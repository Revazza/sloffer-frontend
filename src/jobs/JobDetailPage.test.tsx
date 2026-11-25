import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { detail, mockFetchJson } from '../test/jobs'
import JobDetailPage from './JobDetailPage'

function renderPage(id = '11111111-1111-1111-1111-111111111111') {
  return render(
    <MemoryRouter initialEntries={[`/jobs/${id}`]}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('JobDetailPage', () => {
  it('shows the job with all reasons, source, date and the original link', async () => {
    const fetchSpy = mockFetchJson(200, detail())

    renderPage()

    expect(screen.getByText('Loading job…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Senior .NET Developer' })).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledWith('/api/jobs/11111111-1111-1111-1111-111111111111', expect.anything())
    expect(screen.getByText('66 · Good')).toBeInTheDocument()
    expect(screen.getByText('.NET core: in title (+25)')).toBeInTheDocument()
    expect(screen.getByText('senior title (+5)')).toBeInTheDocument()
    expect(screen.getByText('domain: payments (+12)')).toBeInTheDocument()
    expect(screen.getByText('Arbeitnow')).toBeInTheDocument()
    expect(screen.getByText('24 Nov 2026')).toBeInTheDocument()
    const original = screen.getByRole('link', { name: /Open original posting/ })
    expect(original).toHaveAttribute('href', 'https://www.arbeitnow.com/jobs/acme/senior-net-developer')
    expect(original).toHaveAttribute('target', '_blank')
    expect(original).toHaveAttribute('rel', 'noopener')
    expect(screen.getByRole('link', { name: '← All jobs' })).toHaveAttribute('href', '/')
  })

  it('marks the job viewed when it is opened', async () => {
    const fetchSpy = mockFetchJson(200, detail({ viewedAt: null }))

    renderPage()

    expect(await screen.findByText(/^Viewed /)).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/jobs/11111111-1111-1111-1111-111111111111/viewed',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(screen.getByRole('button', { name: 'Mark as not viewed' })).toBeInTheDocument()
  })

  it('does not mark an already viewed job again', async () => {
    const fetchSpy = mockFetchJson(200, detail({ viewedAt: '2026-11-24T10:00:00Z' }))

    renderPage()

    expect(await screen.findByText('Viewed 24 Nov 2026')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('mark as not viewed sends DELETE and updates the page', async () => {
    const fetchSpy = mockFetchJson(200, detail({ viewedAt: '2026-11-24T10:00:00Z' }))
    renderPage()
    await screen.findByText('Viewed 24 Nov 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Mark as not viewed' }))

    expect(await screen.findByRole('button', { name: 'Mark as viewed' })).toBeInTheDocument()
    expect(screen.queryByText(/^Viewed /)).not.toBeInTheDocument()
    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/api/jobs/11111111-1111-1111-1111-111111111111/viewed',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('renders the description HTML sanitized', async () => {
    mockFetchJson(
      200,
      detail({
        description:
          '<p>We build <b>payments</b> APIs.</p><script>window.hacked = true</script><img src="x" onerror="window.hacked = true">',
      }),
    )

    const { container } = renderPage()

    expect(await screen.findByText('payments', { selector: 'b' })).toBeInTheDocument()
    const description = container.querySelector('.description') as HTMLElement
    expect(description.querySelector('script')).toBeNull()
    expect(description.querySelector('img')?.getAttribute('onerror')).toBeNull()
  })

  it('says when the job is not scored and has no description', async () => {
    mockFetchJson(200, detail({ score: null, scoreReasons: [], description: null }))

    renderPage()

    expect(await screen.findByText('Not scored yet.')).toBeInTheDocument()
    expect(screen.getByText('Not scored')).toBeInTheDocument()
    expect(screen.getByText('No description.')).toBeInTheDocument()
  })

  it('shows a not-found message on 404', async () => {
    mockFetchJson(404, { status: 404 })

    renderPage()

    expect(await screen.findByText('This job no longer exists.')).toBeInTheDocument()
  })

  it('shows an error when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the job: Failed to fetch')
  })
})
