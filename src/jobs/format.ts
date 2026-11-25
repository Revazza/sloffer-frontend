/** "just now", "5 min ago", "3 h ago", "2 d ago". Future dates (clock skew) count as "just now". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

/**
 * The API sends the score as a JSON number or null. The OpenAPI schema also allows a numeric string
 * (ASP.NET's default number handling), so accept that too.
 */
export function scoreValue(score: number | string | null): number | null {
  if (score === null || score === '') return null
  const value = Number(score)
  return Number.isFinite(value) ? value : null
}

export type ScoreBand = 'excellent' | 'good' | 'maybe' | 'weak' | 'rejected' | 'none'

/** Score bands, as in the backend README: 75+ Excellent, 55-74 Good, 35-54 Maybe, 1-34 Weak, 0 rejected. */
export function scoreBand(score: number | null): ScoreBand {
  if (score === null) return 'none'
  if (score >= 75) return 'excellent'
  if (score >= 55) return 'good'
  if (score >= 35) return 'maybe'
  if (score >= 1) return 'weak'
  return 'rejected'
}

export const BAND_LABELS: Record<ScoreBand, string> = {
  excellent: 'Excellent',
  good: 'Good',
  maybe: 'Maybe',
  weak: 'Weak',
  rejected: 'Rejected',
  none: 'Not scored',
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
