import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
}

describe('App', () => {
  it('shows healthy backend status from /api/health', async () => {
    const fetchSpy = mockFetch(200, { status: 'Healthy', checks: { database: 'Healthy' } })

    render(<App />)

    expect(await screen.findByText('Healthy', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('database: Healthy')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledWith('/api/health', expect.anything())
  })

  it('shows unhealthy status when the backend returns 503', async () => {
    mockFetch(503, { status: 'Unhealthy', checks: { database: 'Unhealthy' } })

    render(<App />)

    expect(await screen.findByText('Unhealthy', { selector: 'strong' })).toBeInTheDocument()
  })

  it('shows an error when the backend is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    render(<App />)

    expect(await screen.findByText(/Backend unreachable/)).toBeInTheDocument()
  })
})
