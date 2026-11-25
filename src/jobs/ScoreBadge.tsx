import { BAND_LABELS, scoreBand, scoreValue } from './format'

/** The rule-based fit score (0-100) with its band: "82 · Excellent", or "Not scored". */
export function ScoreBadge({ score }: { score: number | string | null }) {
  const value = scoreValue(score)
  const band = scoreBand(value)
  return (
    <span className={`score score-${band}`} title="Fit score (0-100)">
      {value === null ? BAND_LABELS.none : `${value} · ${BAND_LABELS[band]}`}
    </span>
  )
}
