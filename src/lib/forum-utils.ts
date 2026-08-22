/**
 * Shared forum helpers: slugification, hot scoring, and relative time formatting.
 */

/**
 * Converts a topic title into a URL-safe kebab-case slug, optionally
 * suffixed with a short random token to guarantee uniqueness.
 */
export function slugifyForumTitle(title: string, withSuffix = true): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  if (!base) return `topic-${Date.now().toString(36)}`
  if (!withSuffix) return base
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Reddit-style hot ranking score.
 * `score` is the net vote count (we only track upvotes), `createdAt` is epoch seconds.
 * Newer posts and higher vote counts rank higher; votes decay over time.
 */
export function hotScore(upvotes: number, createdAt: string | number | Date): number {
  const created = new Date(createdAt).getTime() / 1000
  if (!Number.isFinite(created)) return 0
  const score = upvotes
  const order = Math.log10(Math.max(Math.abs(score), 1))
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0
  const seconds = created - 1134028003
  return Number((sign * order + (seconds / 45000)).toFixed(7))
}

export function compareHot(a: { upvotes: number; createdAt: string }, b: { upvotes: number; createdAt: string }): number {
  return hotScore(b.upvotes, b.createdAt) - hotScore(a.upvotes, a.createdAt)
}

/**
 * Formats an ISO timestamp as a short relative time string ("3h ago", "2d ago").
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  const diffWk = Math.floor(diffDay / 7)
  if (diffWk < 5) return `${diffWk}w ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}