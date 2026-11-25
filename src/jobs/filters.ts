/** Jobs page filters. They live in the URL query string, so a filtered list can be shared and survives a refresh. */
export type JobFilters = {
  q: string
  location: string
  source: string
  minScore: number
  sort: SortOrder
  postedWithinHours: PostedWithin
  includeDuplicates: boolean
  hideViewed: boolean
  page: number
}

export type SortOrder = 'score' | 'posted'

/** 24 hours, 3 days, 7 days. */
export type PostedWithin = 24 | 72 | 168

export const POSTED_WITHIN_OPTIONS: readonly { value: PostedWithin; label: string }[] = [
  { value: 24, label: 'Last 24 hours' },
  { value: 72, label: 'Last 3 days' },
  { value: 168, label: 'Last 7 days' },
]

/**
 * Source names exactly as the backend stores them (the API's `source` filter is an exact match), with the text
 * monogram and colour of their badge. No third-party logos: Remote OK forbids using theirs.
 */
export const SOURCES: readonly { value: string; label: string; site: string; monogram: string; color: string }[] = [
  { value: 'jobicy', label: 'Jobicy', site: 'https://jobicy.com', monogram: 'J', color: '#7b4dff' },
  { value: 'Arbeitnow', label: 'Arbeitnow', site: 'https://www.arbeitnow.com', monogram: 'A', color: '#0a7cff' },
  { value: 'Remotive', label: 'Remotive', site: 'https://remotive.com', monogram: 'R', color: '#e8590c' },
  { value: 'Remote OK', label: 'Remote OK', site: 'https://remoteok.com', monogram: 'OK', color: '#2b8a3e' },
]

/** At most this many jobs per page: the list shows up to 100 best matches a day. */
export const PAGE_SIZE = 100

/** Minimum-score choices, by score band (same bands as the backend README). */
export const MIN_SCORE_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 75, label: 'Excellent (75+)' },
  { value: 55, label: 'Good (55+)' },
  { value: 35, label: 'Maybe (35+)' },
  { value: 0, label: 'Any (incl. rejected)' },
]

/** Only Excellent matches from the last 24 hours, best first: at most 100 a day (one page). */
export const DEFAULT_FILTERS: JobFilters = {
  q: '',
  location: '',
  source: '',
  minScore: 75,
  sort: 'score',
  postedWithinHours: 24,
  includeDuplicates: false,
  hideViewed: false,
  page: 1,
}

/** Reads filters from the page URL. Missing or invalid values fall back to the defaults. */
export function parseFilters(params: URLSearchParams): JobFilters {
  const minScore = integer(params.get('minScore'))
  const page = integer(params.get('page'))
  const posted = integer(params.get('posted'))
  const sort = params.get('sort')

  return {
    q: params.get('q')?.trim() ?? '',
    location: params.get('location')?.trim() ?? '',
    source: params.get('source')?.trim() ?? '',
    minScore: minScore !== null && minScore >= 0 && minScore <= 100 ? minScore : DEFAULT_FILTERS.minScore,
    sort: sort === 'score' || sort === 'posted' ? sort : DEFAULT_FILTERS.sort,
    postedWithinHours: POSTED_WITHIN_OPTIONS.find((o) => o.value === posted)?.value ?? DEFAULT_FILTERS.postedWithinHours,
    includeDuplicates: params.get('duplicates') === 'true',
    hideViewed: params.get('hideViewed') === 'true',
    page: page !== null && page >= 1 ? page : DEFAULT_FILTERS.page,
  }
}

/** Writes filters to the page URL, leaving out values that equal the defaults so URLs stay short. */
export function toSearchParams(filters: JobFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.location) params.set('location', filters.location)
  if (filters.source) params.set('source', filters.source)
  if (filters.minScore !== DEFAULT_FILTERS.minScore) params.set('minScore', String(filters.minScore))
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort)
  if (filters.postedWithinHours !== DEFAULT_FILTERS.postedWithinHours) params.set('posted', String(filters.postedWithinHours))
  if (filters.includeDuplicates) params.set('duplicates', 'true')
  if (filters.hideViewed) params.set('hideViewed', 'true')
  if (filters.page !== DEFAULT_FILTERS.page) params.set('page', String(filters.page))
  return params
}

/** The query string for GET /api/jobs. Every value is sent explicitly, so the page never depends on backend defaults. */
export function toApiQuery(filters: JobFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.location) params.set('location', filters.location)
  if (filters.source) params.set('source', filters.source)
  params.set('minScore', String(filters.minScore))
  params.set('sort', filters.sort)
  params.set('postedWithinHours', String(filters.postedWithinHours))
  params.set('includeDuplicates', String(filters.includeDuplicates))
  params.set('hideViewed', String(filters.hideViewed))
  params.set('page', String(filters.page))
  params.set('pageSize', String(PAGE_SIZE))
  return params
}

/** Applies a change; any change other than the page itself goes back to page 1. */
export function updateFilters(current: JobFilters, change: Partial<JobFilters>): JobFilters {
  const next = { ...current, ...change }
  if (change.page === undefined) next.page = 1
  return next
}

function integer(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  return Number(value)
}
