import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Transmit } from '@adonisjs/transmit-client'
import AgentCard, { type Agent } from '~/components/agent_card'
import StatusBadge, { statusLabel } from '~/components/status_badge'

type Developer = { id: string; name: string; initials: string }
type BoardLabel = { id: string; key: string; name: string; color: string }

type BoardProps = {
  team: { id: string; name: string }
  agents: Agent[]
  labels: BoardLabel[]
  developers: Developer[]
}

// Statuses ordered by how much attention they warrant on the board.
const STATUS_ORDER = ['working', 'waiting_input', 'error', 'idle', 'done', 'offline']

const selectStyle: CSSProperties = {
  width: 'auto',
  height: 36,
  padding: '0 12px',
  border: '1px solid var(--gray-4)',
  borderRadius: 6,
  background: '#fff',
  color: 'var(--gray-10)',
  fontWeight: 500,
}

export default function Board({ team, agents, labels, developers }: BoardProps) {
  const [status, setStatus] = useState('')
  const [labelKey, setLabelKey] = useState('')
  const [developerId, setDeveloperId] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const transmit = new Transmit({ baseUrl: window.location.origin })
    const sub = transmit.subscription('team/' + team.id + '/agents')
    let cancelled = false
    ;(async () => {
      await sub.create()
      if (cancelled) return
      sub.onMessage(() => router.reload({ only: ['agents'] }))
    })()
    return () => {
      cancelled = true
      void sub.delete()
    }
  }, [team.id])

  const counts = useMemo(() => {
    const tally: Record<string, number> = {}
    for (const agent of agents) tally[agent.status] = (tally[agent.status] ?? 0) + 1
    return tally
  }, [agents])

  const filtered = useMemo(
    () =>
      agents.filter(
        (agent) =>
          (!status || agent.status === status) &&
          (!developerId || agent.developer.id === developerId) &&
          (!labelKey || agent.labels.some((label) => label.key === labelKey))
      ),
    [agents, status, labelKey, developerId]
  )

  return (
    <div style={{ padding: '32px 40px', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px' }}>
          {team.name || 'Team board'}
        </h1>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
            <span
              key={s}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <StatusBadge status={s} />
              <strong style={{ color: 'var(--gray-12)' }}>{counts[s]}</strong>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by label"
          value={labelKey}
          onChange={(e) => setLabelKey(e.target.value)}
          style={selectStyle}
        >
          <option value="">All labels</option>
          {labels.map((label) => (
            <option key={label.key} value={label.key}>
              {label.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by developer"
          value={developerId}
          onChange={(e) => setDeveloperId(e.target.value)}
          style={selectStyle}
        >
          <option value="">All developers</option>
          {developers.map((developer) => (
            <option key={developer.id} value={developer.id}>
              {developer.name}
            </option>
          ))}
        </select>
      </div>

      {agents.length === 0 ? (
        <div
          style={{
            marginTop: 40,
            padding: 48,
            textAlign: 'center',
            border: '1px dashed var(--gray-4)',
            borderRadius: 12,
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>No agents reporting yet</h2>
          <p style={{ color: 'var(--gray-6)', maxWidth: 460, margin: '0 auto 20px' }}>
            The board is opt-in. Connect your Claude CLI to start reporting agent status to your
            team.
          </p>
          <Link
            href="/connect"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              background: 'var(--gray-12)',
              color: '#fff',
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            Connect an agent
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ marginTop: 40, color: 'var(--gray-6)', textAlign: 'center' }}>
          No agents match the current filters.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
            marginTop: 24,
          }}
        >
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}
