import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import { initialsFor } from '#services/auth'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    /**
     * Shared on every Inertia render. A page may render before the router
     * middleware runs (e.g. a 404), so assume HttpContext may not be fully
     * hydrated and guard every access.
     */
    const { session } = ctx as Partial<HttpContext>
    const user = ctx.currentUser ?? null

    const error = session?.flashMessages.get('error') as string
    const success = session?.flashMessages.get('success') as string

    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({ error, success }),
      user: ctx.inertia.always(
        user
          ? { id: user.id, email: user.email, name: user.name, initials: initialsFor(user) }
          : undefined
      ),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
