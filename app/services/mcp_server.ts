import type { User } from '@prisma/client'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import prisma from '#services/prisma'
import transmit from '@adonisjs/transmit/services/main'

const statusEnum = z.enum(['idle', 'working', 'waiting_input', 'error', 'done', 'offline'])

/** Wrap a string into the single-text-block result shape the MCP SDK expects. */
function text(body: string) {
  return { content: [{ type: 'text' as const, text: body }] }
}

/** Coarse "5m ago" style stamp for the agent-facing coordination view. */
function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * Replace an agent's labels with the team labels matching `keys`. Unknown keys
 * are returned so the caller can surface them; they never create new labels.
 */
async function syncAgentLabels(agentId: string, teamId: string, keys: string[]): Promise<string[]> {
  const labels = await prisma.label.findMany({ where: { teamId, key: { in: keys } } })
  const known = new Set(labels.map((label) => label.key))
  const unknown = [...new Set(keys.filter((key) => !known.has(key)))]

  await prisma.agentLabel.deleteMany({ where: { agentId } })
  if (labels.length > 0) {
    await prisma.agentLabel.createMany({
      data: labels.map((label) => ({ agentId, labelId: label.id })),
    })
  }
  return unknown
}

function broadcastReport(teamId: string, sessionId: string): void {
  transmit.broadcast('team/' + teamId + '/agents', { type: 'report', sessionId })
}

/**
 * Build a per-request MCP server bound to one authenticated developer. Every
 * write is scoped to `user.id` / `user.teamId`; client-supplied identities are
 * never trusted.
 */
export function buildMcpServer(user: User): McpServer {
  const server = new McpServer({ name: 'claude-agents-dashboard', version: '0.1.0' })

  server.registerTool(
    'report_status',
    {
      title: 'Report status',
      description: 'Create or update this session’s agent with its current status, task, and labels.',
      inputSchema: {
        sessionId: z.string(),
        status: statusEnum,
        task: z.string().optional(),
        labels: z.array(z.string()).optional(),
        name: z.string().optional(),
        hostname: z.string().optional(),
        project: z.string().optional(),
      },
    },
    async ({ sessionId, status, task, labels, name, hostname, project }) => {
      const agent = await prisma.agent.upsert({
        where: { userId_sessionId: { userId: user.id, sessionId } },
        create: { userId: user.id, teamId: user.teamId, sessionId, status, task, name, hostname, project },
        update: { status, task, name, hostname, project, lastReportAt: new Date() },
      })

      await prisma.statusEvent.create({ data: { agentId: agent.id, status, task } })

      let unknown: string[] = []
      if (labels) {
        unknown = await syncAgentLabels(agent.id, user.teamId, labels)
      }

      broadcastReport(user.teamId, sessionId)

      let message = `Reported ${status}${task ? ` — ${task}` : ''} for session ${sessionId}.`
      if (unknown.length > 0) message += ` (ignored unknown labels: ${unknown.join(', ')})`
      return text(message)
    }
  )

  server.registerTool(
    'set_labels',
    {
      title: 'Set labels',
      description: 'Replace the labels on this session’s agent with the given team label keys.',
      inputSchema: {
        sessionId: z.string(),
        labels: z.array(z.string()),
      },
    },
    async ({ sessionId, labels }) => {
      const agent = await prisma.agent.findUnique({
        where: { userId_sessionId: { userId: user.id, sessionId } },
      })
      if (!agent) return text(`No agent found for session ${sessionId}.`)

      const unknown = await syncAgentLabels(agent.id, user.teamId, labels)
      broadcastReport(user.teamId, sessionId)

      let message = `Updated labels for session ${sessionId}.`
      if (unknown.length > 0) message += ` (ignored unknown labels: ${unknown.join(', ')})`
      return text(message)
    }
  )

  server.registerTool(
    'end_session',
    {
      title: 'End session',
      description: 'Mark this session’s agent as offline.',
      inputSchema: {
        sessionId: z.string(),
      },
    },
    async ({ sessionId }) => {
      const agent = await prisma.agent.findUnique({
        where: { userId_sessionId: { userId: user.id, sessionId } },
      })
      if (!agent) return text(`No agent found for session ${sessionId}.`)

      await prisma.agent.update({
        where: { id: agent.id },
        data: { status: 'offline', lastReportAt: new Date() },
      })
      await prisma.statusEvent.create({ data: { agentId: agent.id, status: 'offline' } })
      broadcastReport(user.teamId, sessionId)

      return text(`Ended session ${sessionId} (marked offline).`)
    }
  )

  server.registerTool(
    'list_labels',
    {
      title: 'List labels',
      description: 'List the labels available in your team.',
      inputSchema: {},
    },
    async () => {
      const labels = await prisma.label.findMany({
        where: { teamId: user.teamId },
        orderBy: { key: 'asc' },
      })
      if (labels.length === 0) return text('No labels defined for this team.')

      const lines = labels.map((label) => `${label.key} — ${label.name}`)
      return text(`Team labels:\n${lines.join('\n')}`)
    }
  )

  server.registerTool(
    'list_team_agents',
    {
      title: 'List team agents',
      description: 'List every agent reporting in your team, for coordinating who is doing what.',
      inputSchema: {},
    },
    async () => {
      const agents = await prisma.agent.findMany({
        where: { teamId: user.teamId },
        include: { user: true, labels: { include: { label: true } } },
        orderBy: { lastReportAt: 'desc' },
      })
      if (agents.length === 0) return text('No agents have reported in for this team yet.')

      const lines = agents.map((agent) => {
        const labelKeys = agent.labels.map((link) => link.label.key).join(', ') || 'none'
        const where = [agent.project, agent.hostname].filter(Boolean).join(' @ ') || 'unknown'
        const task = agent.task ?? '—'
        return (
          `${agent.user.name} [${agent.status}] ${task}` +
          ` | labels: ${labelKeys} | ${where} | ${relativeTime(agent.lastReportAt)}`
        )
      })
      return text(`Team agents:\n${lines.join('\n')}`)
    }
  )

  return server
}
