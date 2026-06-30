import type { HttpContext } from '@adonisjs/core/http'
import { loginUser, logoutUser, verifyCredentials } from '#services/auth'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store(ctx: HttpContext) {
    const { request, response, session } = ctx
    const { email, password } = request.only(['email', 'password'])

    const user = await verifyCredentials(email, password)
    if (!user) {
      session.flash('error', 'Invalid email or password')
      return response.redirect().back()
    }

    loginUser(ctx, user)

    // Resume an interrupted OAuth authorize request after login completes.
    const oauthReturn = session.get('oauth_return')
    if (typeof oauthReturn === 'string' && oauthReturn) {
      session.forget('oauth_return')
      return response.redirect(oauthReturn)
    }

    return response.redirect().toRoute('home')
  }

  async destroy(ctx: HttpContext) {
    logoutUser(ctx)
    return ctx.response.redirect().toRoute('session.create')
  }
}
