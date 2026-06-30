import type { HttpContext } from '@adonisjs/core/http'
import type { User } from '@prisma/client'
import hash from '@adonisjs/core/services/hash'
import prisma from '#services/prisma'

/**
 * Hand-rolled session auth for the dashboard. We do not use @adonisjs/auth
 * because the data layer is Prisma, and the OAuth authorize endpoint needs to
 * read the same session to identify the developer granting access.
 */
const SESSION_KEY = 'userId'

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const ok = await hash.verify(user.passwordHash, password)
  return ok ? user : null
}

export function loginUser(ctx: HttpContext, user: User): void {
  ctx.session.put(SESSION_KEY, user.id)
}

export function logoutUser(ctx: HttpContext): void {
  ctx.session.forget(SESSION_KEY)
}

/**
 * Resolve the logged-in developer from the session, or null. Loaded once per
 * request by load_current_user_middleware and exposed as ctx.currentUser.
 */
export async function loadUserFromSession(ctx: HttpContext): Promise<User | null> {
  const userId = ctx.session.get(SESSION_KEY)
  if (!userId || typeof userId !== 'string') return null
  return prisma.user.findUnique({ where: { id: userId } })
}

/** Two-letter avatar initials derived from the user's name (or email). */
export function initialsFor(user: Pick<User, 'name' | 'email'>): string {
  const source = user.name?.trim() || user.email
  const [first, second] = source.split(/\s+/)
  if (first && second) return `${first[0]}${second[0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}
