import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, parseFilters, toApiQuery, toSearchParams, updateFilters } from './filters'

describe('parseFilters', () => {
  it('uses the defaults for an empty query string', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS)
  })

  it('reads every filter from the query string', () => {
    const filters = parseFilters(
      new URLSearchParams('q=.net&location=Germany&source=jobicy&minScore=45&sort=posted&posted=24&duplicates=true&page=3'),
    )

    expect(filters).toEqual({
      q: '.net',
      location: 'Germany',
      source: 'jobicy',
      minScore: 45,
      sort: 'posted',
      postedWithinHours: 24,
      includeDuplicates: true,
      page: 3,
    })
  })

  it.each([
    ['minScore=-1', 'minScore', 1],
    ['minScore=101', 'minScore', 1],
    ['minScore=abc', 'minScore', 1],
    ['sort=random', 'sort', 'score'],
    ['posted=48', 'postedWithinHours', 168],
    ['page=0', 'page', 1],
    ['page=2.5', 'page', 1],
    ['duplicates=yes', 'includeDuplicates', false],
  ])('falls back to the default for invalid %s', (query, key, expected) => {
    expect(parseFilters(new URLSearchParams(query))[key as keyof typeof DEFAULT_FILTERS]).toBe(expected)
  })

  it('accepts minScore 0 (show rejected jobs)', () => {
    expect(parseFilters(new URLSearchParams('minScore=0')).minScore).toBe(0)
  })
})

describe('toSearchParams', () => {
  it('leaves out default values', () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe('')
  })

  it('round-trips through parseFilters', () => {
    const filters = { ...DEFAULT_FILTERS, q: 'c#', minScore: 0, sort: 'posted' as const, postedWithinHours: 72 as const, page: 2 }

    expect(parseFilters(toSearchParams(filters))).toEqual(filters)
  })
})

describe('toApiQuery', () => {
  it('sends every API parameter explicitly, including defaults and page size', () => {
    expect(Object.fromEntries(toApiQuery(DEFAULT_FILTERS))).toEqual({
      minScore: '1',
      sort: 'score',
      postedWithinHours: '168',
      includeDuplicates: 'false',
      page: '1',
      pageSize: '20',
    })
  })

  it('adds text filters only when set', () => {
    const query = toApiQuery({ ...DEFAULT_FILTERS, q: 'backend', location: 'Spain', source: 'Arbeitnow' })

    expect(query.get('q')).toBe('backend')
    expect(query.get('location')).toBe('Spain')
    expect(query.get('source')).toBe('Arbeitnow')
  })
})

describe('updateFilters', () => {
  it('goes back to page 1 when a filter changes', () => {
    expect(updateFilters({ ...DEFAULT_FILTERS, page: 4 }, { sort: 'posted' }).page).toBe(1)
  })

  it('keeps the requested page when only the page changes', () => {
    expect(updateFilters(DEFAULT_FILTERS, { page: 3 }).page).toBe(3)
  })
})
