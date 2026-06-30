type StatusMeta = { label: string; bg: string; fg: string; dot: string }

const STATUS_META: Record<string, StatusMeta> = {
  working: { label: 'Working', bg: '#dcfce7', fg: '#15803d', dot: '#22c55e' },
  idle: { label: 'Idle', bg: '#f3f4f6', fg: '#4b5563', dot: '#9ca3af' },
  waiting_input: { label: 'Waiting for input', bg: '#fef3c7', fg: '#b45309', dot: '#f59e0b' },
  error: { label: 'Error', bg: '#fee2e2', fg: '#b91c1c', dot: '#ef4444' },
  done: { label: 'Done', bg: '#dbeafe', fg: '#1d4ed8', dot: '#3b82f6' },
  offline: { label: 'Offline', bg: '#e2e8f0', fg: '#475569', dot: '#64748b' },
}

const FALLBACK: StatusMeta = { label: 'Unknown', bg: '#f3f4f6', fg: '#4b5563', dot: '#9ca3af' }

/** Human-readable label for a status, reused by the board's filter and counts. */
export function statusLabel(status: string): string {
  return (STATUS_META[status] ?? FALLBACK).label
}

export default function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? FALLBACK
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 999,
        background: meta.bg,
        color: meta.fg,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
      {meta.label}
    </span>
  )
}
