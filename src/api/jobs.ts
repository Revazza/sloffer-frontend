import type { components } from './schema'

/** Mirrors the backend contract (generated from /openapi/v1.json by `npm run api:generate`). */
export type JobListItem = components['schemas']['JobListItem']
export type JobListResponse = components['schemas']['JobListResponse']
export type JobDetail = components['schemas']['JobDetailResponse']

/** The backend answered 404 for a job id. */
export class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Job ${id} was not found.`)
    this.name = 'JobNotFoundError'
  }
}

/** GET /api/jobs. `query` is the query string built by `toApiQuery`. */
export async function fetchJobs(query: URLSearchParams, signal?: AbortSignal): Promise<JobListResponse> {
  const response = await fetch(`/api/jobs?${query.toString()}`, { signal })
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Jobs request failed'))
  }
  return (await response.json()) as JobListResponse
}

/** GET /api/jobs/{id}. Throws `JobNotFoundError` on 404. */
export async function fetchJob(id: string, signal?: AbortSignal): Promise<JobDetail> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`, { signal })
  if (response.status === 404) {
    throw new JobNotFoundError(id)
  }
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Job request failed'))
  }
  return (await response.json()) as JobDetail
}

/** POST /api/jobs/{id}/viewed: marks the job as viewed (keeps the first viewed time). */
export async function markViewed(id: string, signal?: AbortSignal): Promise<void> {
  await sendViewed('POST', id, signal)
}

/** DELETE /api/jobs/{id}/viewed: marks the job as not viewed. */
export async function unmarkViewed(id: string, signal?: AbortSignal): Promise<void> {
  await sendViewed('DELETE', id, signal)
}

async function sendViewed(method: 'POST' | 'DELETE', id: string, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(id)}/viewed`, { method, signal })
  if (response.status === 404) throw new JobNotFoundError(id)
  if (!response.ok) throw new Error(await errorMessage(response, 'Viewed request failed'))
}

/** Uses the validation messages of a 400 problem details body when there are any. */
async function errorMessage(response: Response, prefix: string): Promise<string> {
  if (response.status === 400) {
    try {
      const problem = (await response.json()) as { errors?: Record<string, string[]> }
      const messages = Object.values(problem.errors ?? {}).flat()
      if (messages.length > 0) return messages.join(' ')
    } catch {
      // Not JSON: fall through to the generic message.
    }
  }
  return `${prefix}: ${response.status} ${response.statusText}`.trim()
}
