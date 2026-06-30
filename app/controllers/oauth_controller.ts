import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import prisma from '#services/prisma'
import { createAuthCode, exchangeCode, registerClient } from '#services/oauth_service'

const APP_URL = env.get('APP_URL')

/** Coerce a request value that may be absent or an array into a plain string. */
function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function hiddenInput(name: string, value: string): string {
  return `<input type="hidden" name="${name}" value="${escapeHtml(value)}" />`
}

/**
 * OAuth 2.1 authorization server (RFC 8414/9728 + PKCE). A developer's Claude CLI
 * dynamically registers, sends them through the browser consent page, and trades
 * the resulting code for a bearer token used on the MCP endpoint.
 */
export default class OauthController {
  async protectedResourceMetadata({ response }: HttpContext) {
    return response.json({
      resource: APP_URL + '/mcp',
      authorization_servers: [APP_URL],
      bearer_methods_supported: ['header'],
      scopes_supported: ['agent:report'],
    })
  }

  async authorizationServerMetadata({ response }: HttpContext) {
    return response.json({
      issuer: APP_URL,
      authorization_endpoint: APP_URL + '/oauth/authorize',
      token_endpoint: APP_URL + '/oauth/token',
      registration_endpoint: APP_URL + '/oauth/register',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['agent:report'],
    })
  }

  async register({ request, response }: HttpContext) {
    const body = request.body()
    const name = str(body.client_name).trim() || 'Claude CLI'
    const redirectUris = body.redirect_uris
    if (
      !Array.isArray(redirectUris) ||
      redirectUris.length === 0 ||
      !redirectUris.every((uri) => typeof uri === 'string')
    ) {
      return response.status(400).json({ error: 'invalid_redirect_uri' })
    }

    const client = await registerClient(name, redirectUris)
    return response.status(201).json({
      client_id: client.clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
    })
  }

  async authorize(ctx: HttpContext) {
    const { request, response, session } = ctx
    const q = request.qs()
    const responseType = str(q.response_type)
    const clientId = str(q.client_id)
    const redirectUri = str(q.redirect_uri)
    const codeChallenge = str(q.code_challenge)
    const codeChallengeMethod = str(q.code_challenge_method)
    const state = str(q.state)
    const scope = str(q.scope)

    const client = clientId
      ? await prisma.oAuthClient.findUnique({ where: { clientId } })
      : null
    if (!client) {
      return response.status(400).type('text/plain').send('Unknown client')
    }
    if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
      return response.status(400).type('text/plain').send('Invalid redirect_uri')
    }
    if (codeChallengeMethod !== 'S256' || !codeChallenge) {
      return response.status(400).type('text/plain').send('code_challenge with S256 method is required')
    }

    if (!ctx.currentUser) {
      // Resume this exact authorize request (with its query) after login.
      session.put('oauth_return', request.url(true))
      return response.redirect('/login')
    }

    const displayScope = scope || 'agent:report'
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Authorize ${escapeHtml(client.name)}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; display: grid; place-items: center; min-height: 100vh; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 420px; width: 100%; box-sizing: border-box; }
  h1 { font-size: 20px; margin: 0 0 16px; }
  p { line-height: 1.5; color: #cbd5e1; }
  code { background: #0f172a; padding: 2px 6px; border-radius: 6px; color: #93c5fd; }
  .actions { display: flex; gap: 12px; margin-top: 24px; }
  button { flex: 1; padding: 12px; border-radius: 8px; border: none; font-size: 15px; cursor: pointer; }
  .approve { background: #2563eb; color: #fff; }
  .deny { background: #334155; color: #e2e8f0; }
</style>
</head>
<body>
<main class="card">
  <h1>Authorize access</h1>
  <p><strong>${escapeHtml(client.name)}</strong> wants to connect to your agents dashboard.</p>
  <p>Requested scope: <code>${escapeHtml(displayScope)}</code></p>
  <form method="POST" action="/oauth/authorize">
    ${hiddenInput('client_id', clientId)}
    ${hiddenInput('redirect_uri', redirectUri)}
    ${hiddenInput('code_challenge', codeChallenge)}
    ${hiddenInput('code_challenge_method', codeChallengeMethod)}
    ${hiddenInput('state', state)}
    ${hiddenInput('scope', scope)}
    ${hiddenInput('response_type', responseType)}
    <div class="actions">
      <button type="submit" name="decision" value="approve" class="approve">Approve</button>
      <button type="submit" name="decision" value="deny" class="deny">Deny</button>
    </div>
  </form>
</main>
</body>
</html>`

    return response.type('text/html').send(html)
  }

  async approve(ctx: HttpContext) {
    const { request, response } = ctx
    if (!ctx.currentUser) {
      return response.redirect('/login')
    }

    const body = request.body()
    const clientId = str(body.client_id)
    const redirectUri = str(body.redirect_uri)
    const codeChallenge = str(body.code_challenge)
    const codeChallengeMethod = str(body.code_challenge_method) || 'S256'
    const state = str(body.state)
    const scope = str(body.scope)
    const decision = str(body.decision)

    // Re-validate the client/redirect binding before trusting the posted URL,
    // so neither the deny nor approve path can become an open redirect.
    const client = clientId
      ? await prisma.oAuthClient.findUnique({ where: { clientId } })
      : null
    if (!client) {
      return response.status(400).type('text/plain').send('Unknown client')
    }
    if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
      return response.status(400).type('text/plain').send('Invalid redirect_uri')
    }

    if (decision !== 'approve') {
      return response.redirect(
        redirectUri + '?error=access_denied&state=' + encodeURIComponent(state)
      )
    }

    const code = await createAuthCode({
      clientId,
      userId: ctx.currentUser.id,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      scope: scope || null,
    })

    return response.redirect(
      redirectUri + '?code=' + code + '&state=' + encodeURIComponent(state)
    )
  }

  async token({ request, response }: HttpContext) {
    const body = request.body()
    if (str(body.grant_type) !== 'authorization_code') {
      return response.status(400).json({ error: 'unsupported_grant_type' })
    }

    const result = await exchangeCode({
      code: str(body.code),
      clientId: str(body.client_id),
      redirectUri: str(body.redirect_uri),
      codeVerifier: str(body.code_verifier),
    })
    if (!result.ok) {
      return response.status(400).json({ error: result.error || 'invalid_grant' })
    }

    response.header('Cache-Control', 'no-store')
    return response.status(200).json({
      access_token: result.accessToken,
      token_type: 'Bearer',
      scope: result.scope,
    })
  }
}
