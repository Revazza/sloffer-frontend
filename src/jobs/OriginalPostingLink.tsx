import type { ReactNode } from 'react'
import { markViewed } from '../api/jobs'

/**
 * Link to the job on its source site, in a new tab. Clicking it marks the job viewed (that is when Sandro actually
 * looks at the posting), so it is never applied to twice. No "noreferrer": job boards ask for traffic back.
 */
export function OriginalPostingLink({
  job,
  className,
  onViewed,
  children,
}: {
  job: { id: string; url: string; viewedAt?: string | null }
  className?: string
  onViewed: (viewedAt: string) => void
  children: ReactNode
}) {
  function handleClick() {
    if (job.viewedAt) return
    markViewed(job.id)
      .then(() => onViewed(new Date().toISOString()))
      .catch(() => {
        // Not critical: the posting still opens; the job can be marked by hand on its page.
      })
  }

  return (
    <a className={className} href={job.url} target="_blank" rel="noopener" onClick={handleClick}>
      {children}
    </a>
  )
}
