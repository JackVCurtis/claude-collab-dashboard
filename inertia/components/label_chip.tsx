export default function LabelChip({
  label,
}: {
  label: { key: string; name: string; color: string }
}) {
  // The label color is a 6-digit hex; appending alpha bytes tints the fill/border.
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: label.color,
        background: `${label.color}1a`,
        border: `1px solid ${label.color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {label.name}
    </span>
  )
}
