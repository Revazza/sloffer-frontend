import { vi } from 'vitest'
import type { JobDetail, JobListItem, JobListResponse } from '../api/jobs'

export function listItem(overrides: Partial<JobListItem> = {}): JobListItem {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    source: 'jobicy',
    url: 'https://jobicy.com/jobs/1',
    title: 'Senior .NET Developer',
    company: 'Acme',
    location: 'Germany',
    employmentTypes: 'Full-Time',
    level: 'Senior',
    postedAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    descriptionExcerpt: 'Build APIs',
    duplicateOfId: null,
    score: 66,
    scoreReasons: ['.NET core: in title (+25)', 'senior title (+5)', 'domain: payments (+12)'],
    viewedAt: null,
    ...overrides,
  }
}

export function listResponse(items: JobListItem[], overrides: Partial<JobListResponse> = {}): JobListResponse {
  return { items, page: 1, pageSize: 20, totalCount: items.length, ...overrides }
}

export function detail(overrides: Partial<JobDetail> = {}): JobDetail {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    source: 'Arbeitnow',
    externalId: 'senior-net-developer-acme',
    url: 'https://www.arbeitnow.com/jobs/acme/senior-net-developer',
    title: 'Senior .NET Developer',
    company: 'Acme',
    location: 'Berlin, Deutschland',
    employmentTypes: 'Full-Time',
    level: null,
    description: '<p>We build <b>payments</b> APIs in C#.</p>',
    postedAt: '2026-11-24T08:00:00Z',
    fetchedAt: '2026-11-24T09:00:00Z',
    score: 66,
    scoreReasons: ['.NET core: in title (+25)', 'senior title (+5)', 'domain: payments (+12)'],
    viewedAt: null,
    ...overrides,
  }
}

export function mockFetchJson(status: number, body: unknown) {
  // A new Response per call: a body can only be read once.
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    )
}
