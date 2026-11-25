import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { JobNotFoundError, fetchJob, markViewed, unmarkViewed, type JobDetail } from '../api/jobs'
import { ScoreBadge } from './ScoreBadge'
import { SourceBadge } from './SourceBadge'
import { formatDate, timeAgo } from './format'

/** The outcome of the request for job `id`. While it belongs to another id, the page shows loading. */
type Result =
  | { id: string; kind: 'loaded'; job: JobDetail }
  | { id: string; kind: 'not-found' }
  | { id: string; kind: 'error'; message: string }

type State = { kind: 'loading' } | Result

export default function JobDetailPage() {
  const { id = '' } = useParams()
  const [result, setResult] = useState<Result | null>(null)
  const state: State = result?.id === id ? result : { kind: 'loading' }

  function setViewedAt(viewedAt: string | null) {
    setResult((current) =>
      current?.id === id && current.kind === 'loaded' ? { ...current, job: { ...current.job, viewedAt } } : current,
    )
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchJob(id, controller.signal)
      .then((job) => {
        setResult({ id, kind: 'loaded', job })
        // Opening a job marks it viewed, so it is never looked at or applied to twice.
        if (!job.viewedAt) {
          markViewed(id, controller.signal)
            .then(() =>
              setResult((current) =>
                current?.id === id && current.kind === 'loaded'
                  ? { ...current, job: { ...current.job, viewedAt: new Date().toISOString() } }
                  : current,
              ),
            )
            .catch(() => {
              // Not critical: the job stays "not viewed" and can be marked by hand.
            })
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof JobNotFoundError) setResult({ id, kind: 'not-found' })
        else setResult({ id, kind: 'error', message: error instanceof Error ? error.message : String(error) })
      })
    return () => controller.abort()
  }, [id])

  return (
    <>
      <p>
        <Link to="/">← All jobs</Link>
      </p>
      {state.kind === 'loading' && <p className="muted">Loading job…</p>}
      {state.kind === 'not-found' && <p className="card">This job no longer exists.</p>}
      {state.kind === 'error' && (
        <p className="card bad" role="alert">
          Could not load the job: {state.message}
        </p>
      )}
      {state.kind === 'loaded' && <JobDetailView job={state.job} onViewedChange={setViewedAt} />}
    </>
  )
}

function JobDetailView({ job, onViewedChange }: { job: JobDetail; onViewedChange: (viewedAt: string | null) => void }) {
  const [viewedError, setViewedError] = useState<string | null>(null)
  // Listing HTML comes from third-party job boards: sanitize before rendering.
  const description = job.description ? DOMPurify.sanitize(job.description) : ''

  async function toggleViewed() {
    setViewedError(null)
    try {
      if (job.viewedAt) {
        await unmarkViewed(job.id)
        onViewedChange(null)
      } else {
        await markViewed(job.id)
        onViewedChange(new Date().toISOString())
      }
    } catch (error: unknown) {
      setViewedError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <article className="card detail">
      <div className="job-head">
        <h1>{job.title}</h1>
        <ScoreBadge score={job.score} />
      </div>
      <p className="job-meta">
        {job.company}
        {job.location && <> · {job.location}</>}
        {job.employmentTypes && <> · {job.employmentTypes}</>}
      </p>
      <p className="job-meta">
        From <SourceBadge source={job.source} /> · posted <time dateTime={job.postedAt}>{formatDate(job.postedAt)}</time> (
        {timeAgo(job.postedAt)})
      </p>
      <p className="actions">
        {/* No "noreferrer": job boards ask for traffic back from the listings they share. */}
        <a className="button" href={job.url} target="_blank" rel="noopener">
          Open original posting ↗
        </a>
        <button type="button" onClick={toggleViewed}>
          {job.viewedAt ? 'Mark as not viewed' : 'Mark as viewed'}
        </button>
        {job.viewedAt && <span className="chip">Viewed {formatDate(job.viewedAt)}</span>}
      </p>
      {viewedError && (
        <p className="bad" role="alert">
          {viewedError}
        </p>
      )}
      <h2>Why this score</h2>
      {job.scoreReasons.length > 0 ? (
        <ul className="reasons">
          {job.scoreReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Not scored yet.</p>
      )}
      <h2>Description</h2>
      {description ? (
        <div className="description" dangerouslySetInnerHTML={{ __html: description }} />
      ) : (
        <p className="muted">No description.</p>
      )}
    </article>
  )
}
