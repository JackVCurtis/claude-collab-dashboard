import type { HttpContext } from '@adonisjs/core/http'
import { Prisma } from '@prisma/client'
import hash from '@adonisjs/core/services/hash'
import prisma from '#services/prisma'
import { loginUser } from '#services/auth'
import { signupValidator } from '#validators/user'

/** Self-signup is hard-restricted to this email domain. */
const ALLOWED_EMAIL_DOMAIN = 'gnar.dog'

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', { allowedDomain: ALLOWED_EMAIL_DOMAIN })
  }

  async store(ctx: HttpContext) {
    const { request, response, session } = ctx
    const { fullName, email: rawEmail, password } = await request.validateUsing(signupValidator)
    const email = rawEmail.toLowerCase()

    // Hardcoded domain gate: only @gnar.dog addresses may self-register. Split
    // on '@' so a lookalike like "x@evil-gnar.dog" or "x@sub.gnar.dog" is rejected.
    if (email.split('@')[1] !== ALLOWED_EMAIL_DOMAIN) {
      session.flash('inputErrorsBag', {
        email: [`Sign-up is restricted to @${ALLOWED_EMAIL_DOMAIN} email addresses`],
      })
      return response.redirect().back()
    }

    if (await prisma.user.findUnique({ where: { email } })) {
      session.flash('inputErrorsBag', { email: ['An account with this email already exists'] })
      return response.redirect().back()
    }

    // Everyone on the @gnar.dog domain shares one team so coworkers can see
    // each other's agents. Created on first signup, reused thereafter.
    const team = await prisma.team.upsert({
      where: { slug: 'gnar-dog' },
      update: {},
      create: { name: ALLOWED_EMAIL_DOMAIN, slug: 'gnar-dog' },
    })

    const passwordHash = await hash.make(password)
    let user
    try {
      user = await prisma.user.create({
        data: { teamId: team.id, email, name: fullName, passwordHash },
      })
    } catch (error) {
      // Lost a race on the unique email between the check above and the insert.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        session.flash('inputErrorsBag', { email: ['An account with this email already exists'] })
        return response.redirect().back()
      }
      throw error
    }

    loginUser(ctx, user)

    // Resume an interrupted OAuth authorize request after signup completes.
    const oauthReturn = session.get('oauth_return')
    if (typeof oauthReturn === 'string' && oauthReturn) {
      session.forget('oauth_return')
      return response.redirect(oauthReturn)
    }

    return response.redirect().toRoute('home')
  }
}
