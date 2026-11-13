/**
 * How long fetched page content counts as fresh. Inside the window, going back to a page
 * shows what was already loaded with no request and no skeleton; after it, the saved data
 * still paints at once and refreshes quietly in the background.
 *
 * Writes made in this app (posting, replying, buying, friend requests) invalidate what they
 * change, so a member always sees their own changes straight away.
 */
export const FRESH = {
  /** Forum lists and threads. */
  forum: 2 * 60_000,
  /** Dashboard panels and member-specific lists. */
  panel: 2 * 60_000,
  /** Editorial content that changes a few times a week (news, releases, store, academy). */
  content: 5 * 60_000,
} as const

/** Shared, not member-specific content. Member data lives under `accountKeys`. */
export const contentKeys = {
  news: ['content', 'news'] as const,
  changelogs: ['content', 'changelogs'] as const,
  storeAccess: ['content', 'store-access'] as const,
  merchCatalog: (userId: string | null | undefined) => ['content', 'merch-catalog', userId ?? 'guest'] as const,
}

/** Forum reads. Invalidate `forumKeys.all` after any forum write. */
export const forumKeys = {
  all: ['forum'] as const,
  topics: (params: Record<string, unknown>) => ['forum', 'topics', params] as const,
  categories: (userId: string | null | undefined) => ['forum', 'categories', userId ?? 'guest'] as const,
  category: (slug: string, userId: string | null | undefined) => ['forum', 'category', slug, userId ?? 'guest'] as const,
  topic: (categorySlug: string, topicSlug: string, userId: string | null | undefined) =>
    ['forum', 'topic', categorySlug, topicSlug, userId ?? 'guest'] as const,
}

type RouteCache = { clearCache: (opts?: { filter?: (match: { routeId: string }) => boolean }) => void }
let routeCache: RouteCache | null = null

/** The browser router registers itself so writes can drop saved route pages. */
export function registerRouteCache(router: RouteCache): void {
  if (typeof window !== 'undefined') routeCache = router
}

/** Drop the router's saved (not on-screen) pages whose route id starts with `routePrefix`. */
export function forgetSavedRoutePages(routePrefix: string): void {
  routeCache?.clearCache({ filter: (match) => match.routeId.startsWith(routePrefix) })
}
