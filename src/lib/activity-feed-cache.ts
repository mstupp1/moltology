import type { ActivityFeedPage, ActivityFeedFilter, ActivityFeedScope } from './activity-events'

type CacheKey = string

const cache = new Map<CacheKey, ActivityFeedPage>()
const savedAt = new Map<CacheKey, number>()

function keyFor(userId: string, scope: ActivityFeedScope, filter: ActivityFeedFilter): CacheKey {
  return `${userId}:${scope}:${filter}`
}

export function getCachedActivityFeed(
  userId: string,
  scope: ActivityFeedScope,
  filter: ActivityFeedFilter
): ActivityFeedPage | null {
  return cache.get(keyFor(userId, scope, filter)) ?? null
}

export function setCachedActivityFeed(
  userId: string,
  scope: ActivityFeedScope,
  filter: ActivityFeedFilter,
  page: ActivityFeedPage
): void {
  const key = keyFor(userId, scope, filter)
  cache.set(key, page)
  savedAt.set(key, Date.now())
}

/** True while the saved first page is younger than `maxAgeMs`, so a revisit can skip the read. */
export function isCachedActivityFeedFresh(
  userId: string,
  scope: ActivityFeedScope,
  filter: ActivityFeedFilter,
  maxAgeMs: number
): boolean {
  const at = savedAt.get(keyFor(userId, scope, filter))
  return at !== undefined && Date.now() - at < maxAgeMs
}

export function clearCachedActivityFeed(userId?: string): void {
  if (!userId) {
    cache.clear()
    savedAt.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      cache.delete(key)
      savedAt.delete(key)
    }
  }
}
