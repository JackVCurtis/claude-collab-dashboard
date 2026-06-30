import { type CSSProperties } from 'react'
import StatusBadge from '~/components/status_badge'
import LabelChip from '~/components/label_chip'

export type Agent = {
  id: string
  sessionId: string
  name: string | null
  hostname: string | null
  project: string | null
  status: string
  task: string | null
  startedAt: string
  lastReportAt: string
  developer: { id: string; name: string; initials: string }
  labels: { key: string; name: string; color: string }[]
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const sec = Math.round(diffMs / 1000)
  if (sec < 45) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  return `${day}d ago`
}

const avatarStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'var(--gray-3)',
  color: 'var(--gray-10)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 600,
  flexShrink: 0,
}

const ellipsis: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const location = [agent.project, agent.hostname].filter(Boolean).join(' · ')

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--gray-3)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={avatarStyle}>{agent.developer.initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--gray-12)', ...ellipsis }}>
            {agent.developer.name}
          </div>
          {agent.name && (
            <div style={{ fontSize: 12, color: 'var(--gray-6)', ...ellipsis }}>{agent.name}</div>
          )}
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <div
        style={{
          fontSize: 14,
          color: agent.task ? 'var(--gray-10)' : 'var(--gray-6)',
          lineHeight: 1.4,
        }}
      >
        {agent.task || '—'}
      </div>

      {agent.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {agent.labels.map((label) => (
            <LabelChip key={label.key} label={label} />
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: 'var(--gray-6)',
          marginTop: 'auto',
        }}
      >
        <span style={ellipsis}>{location || '—'}</span>
        <span
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          title={new Date(agent.lastReportAt).toLocaleString()}
        >
          {relativeTime(agent.lastReportAt)}
        </span>
      </div>
    </div>
  )
}
