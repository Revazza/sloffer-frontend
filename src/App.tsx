import { useEffect, useState } from 'react'
import { fetchHealth, type HealthResponse } from './api/health'

type State =
  | { kind: 'loading' }
  | { kind: 'loaded'; health: HealthResponse }
  | { kind: 'error'; message: string }

export default function App() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then((health) => setState({ kind: 'loaded', health }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) })
      })
    return () => controller.abort()
  }, [reloadCount])

  function refresh() {
    setState({ kind: 'loading' })
    setReloadCount((n) => n + 1)
  }

  return (
    <main className="page">
      <h1>Sloffer</h1>
      <section className="card" aria-live="polite">
        <h2>Backend health</h2>
        {state.kind === 'loading' && <p>Checking…</p>}
        {state.kind === 'error' && <p className="bad">Backend unreachable: {state.message}</p>}
        {state.kind === 'loaded' && (
          <>
            <p className={state.health.status === 'Healthy' ? 'good' : 'bad'}>
              Status: <strong>{state.health.status}</strong>
            </p>
            <ul>
              {Object.entries(state.health.checks).map(([name, status]) => (
                <li key={name}>
                  {name}: {status}
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" onClick={refresh} disabled={state.kind === 'loading'}>
          Refresh
        </button>
      </section>
    </main>
  )
}
