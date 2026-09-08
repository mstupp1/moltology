import type { ActivityFeedPage, ActivityFeedFilter, ActivityFeedScope } from './activity-events'

type CacheKey = string

const cache = new Map<CacheKey, ActivityFeedPage>()

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
  cache.set(keyFor(userId, scope, filter), page)
}

export function clearCachedActivityFeed(userId?: string): void {
  if (!userId) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) cache.delete(key)
  }
}
