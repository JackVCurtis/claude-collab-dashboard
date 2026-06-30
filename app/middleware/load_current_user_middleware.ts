import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { User } from '@prisma/client'
import { loadUserFromSession } from '#services/auth'

/**
 * Runs on every routed request and resolves the logged-in developer (if any)
 * into ctx.currentUser. Never blocks the request — the `auth` named middleware
 * is responsible for enforcing access.
 */
export default class LoadCurrentUserMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.currentUser = await loadUserFromSession(ctx)
    return next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    currentUser: User | null
  }
}
