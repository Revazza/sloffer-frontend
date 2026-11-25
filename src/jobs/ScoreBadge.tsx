import { scoreTone, scoreValue } from './format'

/** The rule-based fit score (0-100), or "not scored". */
export function ScoreBadge({ score }: { score: number | string | null }) {
  const value = scoreValue(score)
  return (
    <span className={`score score-${scoreTone(value)}`} title="Fit score (0-100)">
      {value === null ? 'not scored' : `Score ${value}`}
    </span>
  )
}
