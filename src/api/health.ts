/** Mirrors HealthResponse from the backend (GET /api/health, see /openapi/v1.json). */
export type HealthResponse = {
  status: string
  checks: Record<string, string>
}

/** Returns the backend health. The backend answers 503 (with the same body) when unhealthy. */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/health', { signal })
  if (!response.ok && response.status !== 503) {
    throw new Error(`Health request failed: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as HealthResponse
}
