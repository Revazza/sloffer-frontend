import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { JobNotFoundError, fetchJob, type JobDetail } from '../api/jobs'
import { SOURCES } from './filters'
import { ScoreBadge } from './ScoreBadge'
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

  useEffect(() => {
    const controller = new AbortController()
    fetchJob(id, controller.signal)
      .then((job) => setResult({ id, kind: 'loaded', job }))
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
      {state.kind === 'loaded' && <JobDetailView job={state.job} />}
    </>
  )
}

function JobDetailView({ job }: { job: JobDetail }) {
  const sourceLabel = SOURCES.find((s) => s.value === job.source)?.label ?? job.source
  // Listing HTML comes from third-party job boards: sanitize before rendering.
  const description = job.description ? DOMPurify.sanitize(job.description) : ''

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
        From {sourceLabel} · posted <time dateTime={job.postedAt}>{formatDate(job.postedAt)}</time> ({timeAgo(job.postedAt)})
      </p>
      <p>
        <a className="button" href={job.url} target="_blank" rel="noopener noreferrer">
          Open original posting ↗
        </a>
      </p>
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
