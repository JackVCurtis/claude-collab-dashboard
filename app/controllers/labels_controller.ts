import type { HttpContext } from '@adonisjs/core/http'
import { Prisma } from '@prisma/client'
import prisma from '#services/prisma'

const DEFAULT_LABEL_COLOR = '#6b7280'

export default class LabelsController {
  async index(ctx: HttpContext) {
    const user = ctx.currentUser!
    const labels = await prisma.label.findMany({
      where: { teamId: user.teamId },
      orderBy: { name: 'asc' },
    })

    return ctx.inertia.render('labels', {
      labels: labels.map((label) => ({
        id: label.id,
        key: label.key,
        name: label.name,
        color: label.color,
      })),
    })
  }

  async store(ctx: HttpContext) {
    const user = ctx.currentUser!
    const { key: rawKey, name: rawName, color: rawColor } = ctx.request.body()

    // Label keys are the shared vocabulary across the team, so normalize to
    // lowercase kebab-case: collapse whitespace to dashes, drop anything outside
    // [a-z0-9-], then trim the dashes that leaves at the edges.
    const key = String(rawKey ?? '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
    const name = String(rawName ?? '').trim()
    const color = String(rawColor ?? '').trim() || DEFAULT_LABEL_COLOR

    if (!key || !name) {
      ctx.session.flash('error', 'Both a key and a name are required')
      return ctx.response.redirect().back()
    }

    try {
      await prisma.label.create({ data: { teamId: user.teamId, key, name, color } })
      ctx.session.flash('success', 'Label created')
    } catch (error) {
      // @@unique([teamId, key]) — surface the collision instead of a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        ctx.session.flash('error', 'Label key already exists')
      } else {
        throw error
      }
    }

    return ctx.response.redirect().toPath('/labels')
  }
}
