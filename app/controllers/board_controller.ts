import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma'
import { initialsFor } from '#services/auth'

export default class BoardController {
  async index(ctx: HttpContext) {
    const user = ctx.currentUser!
    const teamId = user.teamId

    const [team, agentRecords, labelRecords] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.agent.findMany({
        where: { teamId },
        include: { user: true, labels: { include: { label: true } } },
        orderBy: { lastReportAt: 'desc' },
      }),
      prisma.label.findMany({ where: { teamId }, orderBy: { name: 'asc' } }),
    ])

    const agents = agentRecords.map((agent) => ({
      id: agent.id,
      sessionId: agent.sessionId,
      name: agent.name,
      hostname: agent.hostname,
      project: agent.project,
      status: agent.status,
      task: agent.task,
      startedAt: agent.startedAt.toISOString(),
      lastReportAt: agent.lastReportAt.toISOString(),
      developer: {
        id: agent.user.id,
        name: agent.user.name,
        initials: initialsFor(agent.user),
      },
      labels: agent.labels.map((entry) => ({
        key: entry.label.key,
        name: entry.label.name,
        color: entry.label.color,
      })),
    }))

    const labels = labelRecords.map((label) => ({
      id: label.id,
      key: label.key,
      name: label.name,
      color: label.color,
    }))

    // Dedupe developers by id while preserving the lastReportAt ordering of agents.
    const developerMap = new Map<string, { id: string; name: string; initials: string }>()
    for (const agent of agents) {
      developerMap.set(agent.developer.id, agent.developer)
    }
    const developers = [...developerMap.values()]

    return ctx.inertia.render('board', {
      team: { id: team?.id ?? teamId, name: team?.name ?? '' },
      agents,
      labels,
      developers,
    })
  }
}
