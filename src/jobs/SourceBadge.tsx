import { SOURCES } from './filters'

/** Where the job comes from: a small coloured text monogram plus the source name (no third-party logos). */
export function SourceBadge({ source }: { source: string }) {
  const known = SOURCES.find((s) => s.value === source)
  const label = known?.label ?? source
  return (
    <span className="source">
      <span className="source-icon" aria-hidden="true" style={{ background: known?.color ?? 'var(--muted)' }}>
        {known?.monogram ?? source.charAt(0).toUpperCase()}
      </span>
      {label}
    </span>
  )
}
