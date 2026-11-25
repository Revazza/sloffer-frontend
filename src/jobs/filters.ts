/** Jobs page filters. They live in the URL query string, so a filtered list can be shared and survives a refresh. */
export type JobFilters = {
  q: string
  location: string
  source: string
  minScore: number
  sort: SortOrder
  postedWithinHours: PostedWithin
  includeDuplicates: boolean
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

/** Source names exactly as the backend stores them (the API's `source` filter is an exact match). */
export const SOURCES: readonly { value: string; label: string; site: string }[] = [
  { value: 'jobicy', label: 'Jobicy', site: 'https://jobicy.com' },
  { value: 'Arbeitnow', label: 'Arbeitnow', site: 'https://www.arbeitnow.com' },
]

export const PAGE_SIZE = 20

export const DEFAULT_FILTERS: JobFilters = {
  q: '',
  location: '',
  source: '',
  minScore: 1,
  sort: 'score',
  postedWithinHours: 168,
  includeDuplicates: false,
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
