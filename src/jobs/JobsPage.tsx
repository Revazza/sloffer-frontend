import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { fetchJobs, type JobListResponse } from '../api/jobs'
import {
  DEFAULT_FILTERS,
  MIN_SCORE_OPTIONS,
  PAGE_SIZE,
  POSTED_WITHIN_OPTIONS,
  SOURCES,
  parseFilters,
  toApiQuery,
  toSearchParams,
  updateFilters,
  type JobFilters,
  type PostedWithin,
  type SortOrder,
} from './filters'
import { ScoreBadge } from './ScoreBadge'
import { OriginalPostingLink } from './OriginalPostingLink'
import { SourceBadge } from './SourceBadge'
import { timeAgo } from './format'

/** The outcome of the request for `query`. While it belongs to another query, the page shows loading. */
type Result =
  | { query: string; kind: 'loaded'; data: JobListResponse }
  | { query: string; kind: 'error'; message: string }

type State = { kind: 'loading' } | Result

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFilters(searchParams)
  const apiQuery = toApiQuery(filters).toString()
  const [result, setResult] = useState<Result | null>(null)
  const state: State = result?.query === apiQuery ? result : { kind: 'loading' }

  useEffect(() => {
    const controller = new AbortController()
    fetchJobs(new URLSearchParams(apiQuery), controller.signal)
      .then((data) => setResult({ query: apiQuery, kind: 'loaded', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setResult({ query: apiQuery, kind: 'error', message: error instanceof Error ? error.message : String(error) })
      })
    return () => controller.abort()
  }, [apiQuery])

  function setViewedAt(id: string, viewedAt: string) {
    setResult((current) =>
      current?.kind === 'loaded'
        ? { ...current, data: { ...current.data, items: current.data.items.map((j) => (j.id === id ? { ...j, viewedAt } : j)) } }
        : current,
    )
  }

  function apply(change: Partial<JobFilters>) {
    setSearchParams(toSearchParams(updateFilters(filters, change)))
  }

  return (
    <>
      <FilterForm key={`${filters.q}|${filters.location}`} filters={filters} onApply={apply} />
      <section aria-live="polite" aria-busy={state.kind === 'loading'}>
        {state.kind === 'loading' && <p className="muted">Loading jobs…</p>}
        {state.kind === 'error' && (
          <p className="card bad" role="alert">
            Could not load jobs: {state.message}
          </p>
        )}
        {state.kind === 'loaded' && (
          <JobList data={state.data} filters={filters} onPage={(page) => apply({ page })} onViewed={setViewedAt} />
        )}
      </section>
    </>
  )
}

function FilterForm({ filters, onApply }: { filters: JobFilters; onApply: (change: Partial<JobFilters>) => void }) {
  // Text fields apply on submit (Enter or the button); selects and the checkbox apply at once.
  const [q, setQ] = useState(filters.q)
  const [location, setLocation] = useState(filters.location)

  function submit(event: FormEvent) {
    event.preventDefault()
    onApply({ q: q.trim(), location: location.trim() })
  }

  return (
    <form className="card filters" role="search" aria-label="Job filters" onSubmit={submit}>
      <label>
        Search
        <input type="search" value={q} placeholder="Title or company" onChange={(e) => setQ(e.target.value)} />
      </label>
      <label>
        Location
        <input type="text" value={location} placeholder="e.g. Germany" onChange={(e) => setLocation(e.target.value)} />
      </label>
      <label>
        Source
        <select value={filters.source} onChange={(e) => onApply({ source: e.target.value })}>
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Minimum score
        <select value={filters.minScore} onChange={(e) => onApply({ minScore: Number(e.target.value) })}>
          {minScoreOptions(filters.minScore).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sort by
        <select value={filters.sort} onChange={(e) => onApply({ sort: e.target.value as SortOrder })}>
          <option value="score">Best match</option>
          <option value="posted">Newest</option>
        </select>
      </label>
      <label>
        Posted
        <select
          value={filters.postedWithinHours}
          onChange={(e) => onApply({ postedWithinHours: Number(e.target.value) as PostedWithin })}
        >
          {POSTED_WITHIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.includeDuplicates}
          onChange={(e) => onApply({ includeDuplicates: e.target.checked })}
        />
        Include duplicates
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={filters.hideViewed} onChange={(e) => onApply({ hideViewed: e.target.checked })} />
        Hide viewed
      </label>
      <button type="submit">Search</button>
    </form>
  )
}

/** The fixed choices, plus the current value when a shared URL used another one (e.g. minScore=30). */
function minScoreOptions(current: number) {
  if (MIN_SCORE_OPTIONS.some((o) => o.value === current)) return MIN_SCORE_OPTIONS
  return [...MIN_SCORE_OPTIONS, { value: current, label: `${current}+` }].sort((a, b) => b.value - a.value)
}

function JobList({
  data,
  filters,
  onPage,
  onViewed,
}: {
  data: JobListResponse
  filters: JobFilters
  onPage: (page: number) => void
  onViewed: (id: string, viewedAt: string) => void
}) {
  const totalCount = Number(data.totalCount)
  const page = Number(data.page)
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  if (data.items.length === 0) {
    const strictDefaults = filters.minScore >= DEFAULT_FILTERS.minScore || filters.postedWithinHours < 168
    return (
      <p className="card muted">
        No jobs match these filters.
        {strictDefaults && ' Only excellent matches are shown: try "Last 7 days" or a lower minimum score.'}
      </p>
    )
  }

  return (
    <>
      <p className="muted">
        {totalCount} {totalCount === 1 ? 'job' : 'jobs'}
      </p>
      <ul className="job-list">
        {data.items.map((job) => (
          <li key={job.id} className={job.viewedAt ? 'card job viewed' : 'card job'}>
            <div className="job-head">
              <Link to={`/jobs/${job.id}`} className="job-title">
                {job.title}
              </Link>
              <ScoreBadge score={job.score} />
            </div>
            <p className="job-meta">
              <SourceBadge source={job.source} /> · {job.company}
              {job.location && <> · {job.location}</>} · <time dateTime={job.postedAt}>{timeAgo(job.postedAt)}</time>
              {job.duplicateOfId && <> · duplicate</>}
              {job.viewedAt && (
                <>
                  {' '}
                  <span className="chip">Viewed</span>
                </>
              )}
            </p>
            {job.scoreReasons.length > 0 && (
              <ul className="reasons">
                {job.scoreReasons.slice(0, 2).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            <p className="job-actions">
              <OriginalPostingLink job={job} onViewed={(viewedAt) => onViewed(job.id, viewedAt)}>
                Open posting ↗
              </OriginalPostingLink>
            </p>
          </li>
        ))}
      </ul>
      {pageCount > 1 && (
        <nav className="pager" aria-label="Pages">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
    </>
  )
}
