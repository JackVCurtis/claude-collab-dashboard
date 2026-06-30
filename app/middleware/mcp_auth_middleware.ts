import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { OAuthClient, User } from '@prisma/client'
import env from '#start/env'
import { verifyAccessToken } from '#services/oauth_service'

/**
 * Guards the MCP endpoint with OAuth 2.1 Bearer tokens (not sessions). On any
 * failure we answer 401 with the RFC 9728 `WWW-Authenticate` challenge so the
 * Claude CLI knows where to discover the protected-resource metadata.
 */
export default class McpAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const header = ctx.request.header('authorization')?.trim()
    const token = header?.toLowerCase().startsWith('bearer ')
      ? header.slice(7).trim()
      : undefined

    if (!token) {
      return this.challenge(ctx, 'Missing bearer token')
    }

    const result = await verifyAccessToken(token)
    if (!result) {
      return this.challenge(ctx, 'Invalid or expired token')
    }

    ctx.mcpUser = result.user
    ctx.mcpClient = result.client
    return next()
  }

  private challenge(ctx: HttpContext, description: string) {
    const metadataUrl = `${env.get('APP_URL')}/.well-known/oauth-protected-resource`
    return ctx.response
      .status(401)
      .header('WWW-Authenticate', `Bearer resource_metadata="${metadataUrl}"`)
      .json({ error: 'invalid_token', error_description: description })
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    mcpUser: User
    mcpClient: OAuthClient
  }
}
