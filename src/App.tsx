import { Link, Route, Routes } from 'react-router'
import { SOURCES } from './jobs/filters'
import JobDetailPage from './jobs/JobDetailPage'
import JobsPage from './jobs/JobsPage'

export default function App() {
  return (
    <div className="page">
      <header className="site-header">
        <Link to="/" className="brand">
          Sloffer
        </Link>
        <span className="muted">.NET jobs in EMEA, best matches first</span>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="*" element={<p className="card">Page not found.</p>} />
        </Routes>
      </main>
      <footer className="site-footer muted">
        Jobs from{' '}
        {SOURCES.map((s, i) => (
          <span key={s.value}>
            {i > 0 && ', '}
            <a href={s.site} target="_blank" rel="noopener">
              {s.label}
            </a>
          </span>
        ))}
        .
      </footer>
    </div>
  )
}
