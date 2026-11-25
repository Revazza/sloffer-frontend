import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { detail, listResponse, mockFetchJson } from './test/jobs'

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('shows the jobs list at /', async () => {
    mockFetchJson(200, listResponse([]))

    renderAt('/')

    expect(await screen.findByText('No jobs match these filters.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sloffer' })).toHaveAttribute('href', '/')
  })

  it('shows a job at /jobs/:id', async () => {
    mockFetchJson(200, detail())

    renderAt('/jobs/11111111-1111-1111-1111-111111111111')

    expect(await screen.findByRole('heading', { name: 'Senior .NET Developer' })).toBeInTheDocument()
  })

  it('credits the job sources in the footer with links', () => {
    mockFetchJson(200, listResponse([]))

    renderAt('/')

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('Jobs from Jobicy, Arbeitnow.')
    expect(screen.getByRole('link', { name: 'Jobicy' })).toHaveAttribute('href', 'https://jobicy.com')
    expect(screen.getByRole('link', { name: 'Arbeitnow' })).toHaveAttribute('href', 'https://www.arbeitnow.com')
  })

  it('shows not found for unknown routes', () => {
    renderAt('/nope')

    expect(screen.getByText('Page not found.')).toBeInTheDocument()
  })
})
