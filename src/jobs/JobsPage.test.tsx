import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { listItem, listResponse, mockFetchJson } from '../test/jobs'
import JobsPage from './JobsPage'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function renderPage(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <JobsPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

function requestedQuery(fetchSpy: ReturnType<typeof vi.spyOn>, call = -1): URLSearchParams {
  const calls = fetchSpy.mock.calls
  const url = String(calls.at(call)?.[0])
  return new URLSearchParams(url.split('?')[1])
}

describe('JobsPage', () => {
  it('shows loading, then the jobs with score, meta and the first two reasons', async () => {
    mockFetchJson(200, listResponse([listItem()]))

    renderPage()

    expect(screen.getByText('Loading jobs…')).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: 'Senior .NET Developer' })
    expect(link).toHaveAttribute('href', '/jobs/11111111-1111-1111-1111-111111111111')
    const item = link.closest('li') as HTMLElement
    expect(within(item).getByText('66 · Good')).toBeInTheDocument()
    expect(within(item).getByText(/Acme · Germany ·/)).toBeInTheDocument()
    expect(within(item).getByText('3 h ago')).toBeInTheDocument()
    expect(within(item).getByText('.NET core: in title (+25)')).toBeInTheDocument()
    expect(within(item).getByText('senior title (+5)')).toBeInTheDocument()
    expect(within(item).queryByText('domain: payments (+12)')).not.toBeInTheDocument()
    expect(screen.getByText('1 job')).toBeInTheDocument()
  })

  it('shows "not scored" for jobs without a score', async () => {
    mockFetchJson(200, listResponse([listItem({ score: null, scoreReasons: [] })]))

    renderPage()

    expect(await screen.findByText('Not scored')).toBeInTheDocument()
  })

  it('shows an empty state when no jobs match', async () => {
    mockFetchJson(200, listResponse([]))

    renderPage()

    expect(await screen.findByText(/No jobs match these filters/)).toBeInTheDocument()
  })

  it('shows an error when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load jobs: Failed to fetch')
  })

  it('shows the API validation message on 400', async () => {
    mockFetchJson(400, { errors: { MinScore: ['minScore must be between 0 and 100.'] } })

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('minScore must be between 0 and 100.')
  })

  it('requests the API with the filters from the URL', async () => {
    const fetchSpy = mockFetchJson(200, listResponse([]))

    renderPage('/?q=.net&source=Arbeitnow&minScore=0&sort=posted&posted=24&duplicates=true&page=2')

    await screen.findByText(/No jobs match these filters/)
    expect(String(fetchSpy.mock.calls[0]?.[0])).toMatch(/^\/api\/jobs\?/)
    expect(Object.fromEntries(requestedQuery(fetchSpy))).toEqual({
      q: '.net',
      source: 'Arbeitnow',
      minScore: '0',
      sort: 'posted',
      postedWithinHours: '24',
      includeDuplicates: 'true',
      hideViewed: 'false',
      page: '2',
      pageSize: '100',
    })
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('.net')
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('posted')
    expect(screen.getByRole('checkbox', { name: 'Include duplicates' })).toBeChecked()
  })

  it('shows a minimum score from the URL that is not one of the fixed choices', async () => {
    mockFetchJson(200, listResponse([]))

    renderPage('/?minScore=30')

    await screen.findByText(/No jobs match these filters/)
    expect(screen.getByRole('combobox', { name: 'Minimum score' })).toHaveValue('30')
  })

  it('writes a changed select to the URL, resets the page and refetches', async () => {
    const fetchSpy = mockFetchJson(200, listResponse([]))
    renderPage('/?page=3')
    await screen.findByText(/No jobs match these filters/)

    const select = screen.getByRole('combobox', { name: 'Sort by' })
    fireEvent.change(select, { target: { value: 'posted' } })

    await screen.findByText(/No jobs match these filters/)
    expect(screen.getByTestId('location')).toHaveTextContent('?sort=posted')
    expect(requestedQuery(fetchSpy).get('sort')).toBe('posted')
    expect(requestedQuery(fetchSpy).get('page')).toBe('1')
  })

  it('applies text filters on submit', async () => {
    const fetchSpy = mockFetchJson(200, listResponse([]))
    renderPage()
    await screen.findByText(/No jobs match these filters/)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: '  backend ' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Location' }), { target: { value: 'Spain' } })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    await screen.findByText(/No jobs match these filters/)
    expect(screen.getByTestId('location')).toHaveTextContent('?q=backend&location=Spain')
    expect(requestedQuery(fetchSpy).get('q')).toBe('backend')
    expect(requestedQuery(fetchSpy).get('location')).toBe('Spain')
  })

  it('by default asks for excellent jobs (75+) of the last 24 hours, up to 100', async () => {
    const fetchSpy = mockFetchJson(200, listResponse([]))

    renderPage()

    await screen.findByText(/No jobs match these filters/)
    const query = requestedQuery(fetchSpy)
    expect(query.get('minScore')).toBe('75')
    expect(query.get('postedWithinHours')).toBe('24')
    expect(query.get('pageSize')).toBe('100')
    expect(screen.getByRole('combobox', { name: 'Minimum score' })).toHaveValue('75')
    expect(screen.getByText(/try "Last 7 days" or a lower minimum score/)).toBeInTheDocument()
  })

  it('shows the source badge and name, and marks viewed jobs', async () => {
    mockFetchJson(
      200,
      listResponse([
        listItem({ id: 'a', title: 'Seen job', source: 'Remote OK', viewedAt: '2026-11-25T08:00:00Z' }),
        listItem({ id: 'b', title: 'New job', source: 'Remotive' }),
      ]),
    )

    renderPage()

    const seen = (await screen.findByRole('link', { name: 'Seen job' })).closest('li') as HTMLElement
    const fresh = screen.getByRole('link', { name: 'New job' }).closest('li') as HTMLElement
    expect(within(seen).getByText('Remote OK')).toBeInTheDocument()
    expect(within(seen).getByText('OK')).toBeInTheDocument()
    expect(within(seen).getByText('Viewed')).toBeInTheDocument()
    expect(seen).toHaveClass('viewed')
    expect(within(fresh).getByText('Remotive')).toBeInTheDocument()
    expect(within(fresh).queryByText('Viewed')).not.toBeInTheDocument()
  })

  it('open posting links to the source in a new tab and marks the job viewed on click', async () => {
    const fetchSpy = mockFetchJson(200, listResponse([listItem({ id: 'a', title: 'New job', url: 'https://remotive.com/jobs/1' })]))
    renderPage()
    const row = (await screen.findByRole('link', { name: 'New job' })).closest('li') as HTMLElement
    const posting = within(row).getByRole('link', { name: /Open posting/ })
    expect(posting).toHaveAttribute('href', 'https://remotive.com/jobs/1')
    expect(posting).toHaveAttribute('target', '_blank')
    expect(within(row).queryByText('Viewed')).not.toBeInTheDocument()

    fireEvent.click(posting)

    expect(await within(row).findByText('Viewed')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenLastCalledWith('/api/jobs/a/viewed', expect.objectContaining({ method: 'POST' }))
  })

  it('hide viewed writes to the URL and the API query', async () => {
    const fetchSpy = mockFetchJson(200, listResponse([]))
    renderPage()
    await screen.findByText(/No jobs match these filters/)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hide viewed' }))

    await screen.findByText(/No jobs match these filters/)
    expect(screen.getByTestId('location')).toHaveTextContent('?hideViewed=true')
    expect(requestedQuery(fetchSpy).get('hideViewed')).toBe('true')
  })

  it('pages through results', async () => {
    const items = Array.from({ length: 20 }, (_, i) => listItem({ id: `id-${i}`, title: `Job ${i}` }))
    const fetchSpy = mockFetchJson(200, listResponse(items, { totalCount: 250 }))
    renderPage()
    await screen.findByText('Page 1 of 3')

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByTestId('location')).toHaveTextContent('?page=2')
    await screen.findByText('Page 1 of 3')
    expect(requestedQuery(fetchSpy).get('page')).toBe('2')
  })
})
