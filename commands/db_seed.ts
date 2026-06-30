import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import hash from '@adonisjs/core/services/hash'
import prisma from '#services/prisma'

/**
 * Seeds a demo team, two developers, the team's agreed labels, and a couple of
 * already-reporting agents so the board has something to show on first run.
 * Idempotent: safe to run repeatedly.
 *
 *   node ace db:seed
 */
export default class DbSeed extends BaseCommand {
  static commandName = 'db:seed'
  static description = 'Seed a demo team, developers, labels, and sample agents'
  static options: CommandOptions = { startApp: true }

  async run() {
    const team = await prisma.team.upsert({
      where: { slug: 'demo' },
      update: {},
      create: { name: 'Demo Team', slug: 'demo' },
    })

    const labelDefs = [
      { key: 'frontend', name: 'Frontend', color: '#3b82f6' },
      { key: 'backend', name: 'Backend', color: '#10b981' },
      { key: 'infra', name: 'Infra', color: '#f59e0b' },
      { key: 'release', name: 'Release', color: '#ef4444' },
      { key: 'spike', name: 'Spike', color: '#8b5cf6' },
    ]
    const labels: Record<string, string> = {}
    for (const l of labelDefs) {
      const label = await prisma.label.upsert({
        where: { teamId_key: { teamId: team.id, key: l.key } },
        update: { name: l.name, color: l.color },
        create: { teamId: team.id, key: l.key, name: l.name, color: l.color },
      })
      labels[l.key] = label.id
    }

    const passwordHash = await hash.make('password')
    const alice = await prisma.user.upsert({
      where: { email: 'alice@demo.test' },
      update: {},
      create: { teamId: team.id, email: 'alice@demo.test', name: 'Alice Dev', passwordHash },
    })
    const bob = await prisma.user.upsert({
      where: { email: 'bob@demo.test' },
      update: {},
      create: { teamId: team.id, email: 'bob@demo.test', name: 'Bob Dev', passwordHash },
    })

    const agentDefs = [
      {
        user: alice,
        sessionId: 'demo-session-1',
        name: 'alice-mbp',
        hostname: 'alice-mbp.local',
        project: 'claude-agents-dashboard',
        status: 'working' as const,
        task: 'Refactoring the auth service',
        labelKeys: ['backend'],
      },
      {
        user: bob,
        sessionId: 'demo-session-2',
        name: 'bob-desktop',
        hostname: 'bob-desktop.local',
        project: 'marketing-site',
        status: 'waiting_input' as const,
        task: 'Reviewing PR #42 before merge',
        labelKeys: ['frontend', 'release'],
      },
    ]

    for (const a of agentDefs) {
      const agent = await prisma.agent.upsert({
        where: { userId_sessionId: { userId: a.user.id, sessionId: a.sessionId } },
        update: { status: a.status, task: a.task, lastReportAt: new Date() },
        create: {
          userId: a.user.id,
          teamId: team.id,
          sessionId: a.sessionId,
          name: a.name,
          hostname: a.hostname,
          project: a.project,
          status: a.status,
          task: a.task,
        },
      })
      for (const key of a.labelKeys) {
        await prisma.agentLabel.upsert({
          where: { agentId_labelId: { agentId: agent.id, labelId: labels[key] } },
          update: {},
          create: { agentId: agent.id, labelId: labels[key] },
        })
      }
    }

    this.logger.info('Seeded demo team (slug: demo)')
    this.logger.info('Users: alice@demo.test / bob@demo.test — password: "password"')
  }
}
