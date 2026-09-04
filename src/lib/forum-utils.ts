/**
 * Shared forum helpers: slugification, hot scoring, relative time, and reply trees.
 */

/** Sibling order within a threaded reply tree. */
export type ForumReplySort = 'oldest' | 'newest' | 'top'

/** Visual indent stops increasing after this depth (0 = root). */
export const FORUM_REPLY_MAX_INDENT_DEPTH = 5

/** Server-side hard cap on nesting depth (ancestor count). */
export const FORUM_REPLY_MAX_DEPTH = 20

export interface ForumTreePost {
  id: string
  parentId?: string | null
  upvotes: number
  createdAt: string
}

export interface ForumPostTreeNode<T extends ForumTreePost = ForumTreePost> {
  post: T
  depth: number
  children: ForumPostTreeNode<T>[]
}

function compareSiblings(sort: ForumReplySort) {
  return (a: ForumTreePost, b: ForumTreePost): number => {
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sort === 'top') {
      if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    // oldest (default)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  }
}

/**
 * Builds a nested reply tree from a flat post list.
 * Orphans (missing / unknown parent) become roots. Cycles are broken by treating
 * the cycling node as a root.
 */
export function buildForumPostTree<T extends ForumTreePost>(
  posts: T[],
  sort: ForumReplySort = 'oldest',
): ForumPostTreeNode<T>[] {
  const byId = new Map(posts.map((p) => [p.id, p]))
  const childrenMap = new Map<string | null, T[]>()

  for (const post of posts) {
    const rawParent = post.parentId ?? null
    const parentId = rawParent && byId.has(rawParent) && rawParent !== post.id ? rawParent : null
    const bucket = childrenMap.get(parentId) ?? []
    bucket.push(post)
    childrenMap.set(parentId, bucket)
  }

  const cmp = compareSiblings(sort)

  const build = (parentId: string | null, depth: number, ancestors: Set<string>): ForumPostTreeNode<T>[] => {
    const siblings = [...(childrenMap.get(parentId) ?? [])].sort(cmp)
    return siblings.map((post) => {
      if (ancestors.has(post.id)) {
        return { post, depth, children: [] }
      }
      const next = new Set(ancestors)
      next.add(post.id)
      return {
        post,
        depth,
        children: build(post.id, depth + 1, next),
      }
    })
  }

  return build(null, 0, new Set())
}

/** Effective visual indent depth (capped). */
export function forumReplyIndentDepth(depth: number): number {
  return Math.min(Math.max(depth, 0), FORUM_REPLY_MAX_INDENT_DEPTH)
}

/**
 * Walks parentId chain to compute nesting depth (0 = root).
 * Returns null if the parent chain is broken / cyclic beyond known posts.
 */
export function getPostDepth(
  postId: string,
  byId: Map<string, { id: string; parentId?: string | null }>,
): number {
  let depth = 0
  let current = byId.get(postId)
  const seen = new Set<string>()
  while (current?.parentId) {
    if (seen.has(current.id)) return depth
    seen.add(current.id)
    const parent = byId.get(current.parentId)
    if (!parent) return depth
    depth += 1
    current = parent
  }
  return depth
}

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