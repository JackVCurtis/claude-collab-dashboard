import crypto from 'node:crypto'
import type { OAuthClient, User } from '@prisma/client'
import prisma from '#services/prisma'

/**
 * Pure OAuth 2.1 + PKCE primitives backed by Prisma. The dashboard acts as the
 * authorization server; a developer's Claude CLI is a public client (no secret)
 * that proves possession of the auth code via S256 PKCE.
 */

/** base64url( sha256(input) ) — the S256 transform applied to a PKCE verifier. */
export function sha256base64url(input: string): string {
  return crypto.createHash('sha256').update(input).digest('base64url')
}

/** sha256 hex of an opaque token; only this digest is ever persisted. */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

const AUTH_CODE_TTL_MS = 10 * 60 * 1000

/** Register a public client (no secret) via dynamic client registration. */
export async function registerClient(
  name: string,
  redirectUris: string[]
): Promise<{ clientId: string; redirectUris: string[] }> {
  const clientId = 'cad_' + crypto.randomBytes(32).toString('hex')
  const client = await prisma.oAuthClient.create({
    data: { clientId, name, redirectUris },
  })
  return { clientId: client.clientId, redirectUris: client.redirectUris }
}

/** Persist a single-use authorization code bound to the user and PKCE challenge. */
export async function createAuthCode(input: {
  clientId: string
  userId: string
  redirectUri: string
  codeChallenge: string
  codeChallengeMethod: string
  scope?: string | null
}): Promise<string> {
  const code = crypto.randomBytes(32).toString('hex')
  await prisma.oAuthAuthCode.create({
    data: {
      code,
      clientId: input.clientId,
      userId: input.userId,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: input.codeChallengeMethod,
      scope: input.scope ?? null,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
    },
  })
  return code
}

/**
 * Redeem an authorization code for an access token. Validates existence, single
 * use, expiry, client/redirect binding, and the S256 PKCE proof before issuing
 * an opaque token whose hash (never the raw value) is stored.
 */
export async function exchangeCode(input: {
  code: string
  clientId: string
  redirectUri: string
  codeVerifier: string
}): Promise<
  { ok: true; accessToken: string; scope: string | null } | { ok: false; error: string }
> {
  const record = await prisma.oAuthAuthCode.findUnique({ where: { code: input.code } })
  if (!record) return { ok: false, error: 'invalid_grant' }
  if (record.usedAt) return { ok: false, error: 'invalid_grant' }
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, error: 'invalid_grant' }
  if (record.clientId !== input.clientId) return { ok: false, error: 'invalid_client' }
  if (record.redirectUri !== input.redirectUri) return { ok: false, error: 'invalid_grant' }
  if (sha256base64url(input.codeVerifier) !== record.codeChallenge) {
    return { ok: false, error: 'invalid_grant' }
  }

  await prisma.oAuthAuthCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  })

  const accessToken = 'cad_at_' + crypto.randomBytes(32).toString('hex')
  await prisma.accessToken.create({
    data: {
      tokenHash: hashToken(accessToken),
      clientId: record.clientId,
      userId: record.userId,
      scope: record.scope,
      expiresAt: null,
    },
  })
  return { ok: true, accessToken, scope: record.scope }
}

/** Resolve a presented bearer token to its user + client, or null if invalid. */
export async function verifyAccessToken(
  rawToken: string
): Promise<{ user: User; client: OAuthClient; scope: string | null } | null> {
  const record = await prisma.accessToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true, client: true },
  })
  if (!record) return null
  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null

  await prisma.accessToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  })
  return { user: record.user, client: record.client, scope: record.scope }
}
