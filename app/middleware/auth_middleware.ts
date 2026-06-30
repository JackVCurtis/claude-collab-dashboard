import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Denies access to routes that require a logged-in developer. The current user
 * is resolved upstream by load_current_user_middleware into ctx.currentUser.
 */
export default class AuthMiddleware {
  redirectTo = '/login'

  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.currentUser) {
      return ctx.response.redirect(this.redirectTo)
    }
    return next()
  }
}
