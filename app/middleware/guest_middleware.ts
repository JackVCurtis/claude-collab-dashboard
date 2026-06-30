import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Denies access to routes meant for logged-out visitors (e.g. the login page)
 * when a developer is already authenticated.
 */
export default class GuestMiddleware {
  redirectTo = '/'

  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.currentUser) {
      ctx.session.reflash()
      return ctx.response.redirect(this.redirectTo, true)
    }
    return next()
  }
}
