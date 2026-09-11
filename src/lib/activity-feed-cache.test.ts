import { describe, it, expect } from 'vitest'
import {
  clearCachedActivityFeed,
  getCachedActivityFeed,
  setCachedActivityFeed,
} from './activity-feed-cache'
import type { ActivityFeedPage } from './activity-events'

const emptyPage: ActivityFeedPage = { events: [], nextCursor: null }

describe('activity feed session cache', () => {
  it('stores and clears pages per viewer, scope, and filter', () => {
    setCachedActivityFeed('user-a', 'circle', 'all', emptyPage)
    expect(getCachedActivityFeed('user-a', 'circle', 'all')).toEqual(emptyPage)
    expect(getCachedActivityFeed('user-a', 'self', 'all')).toBeNull()
    clearCachedActivityFeed('user-a')
    expect(getCachedActivityFeed('user-a', 'circle', 'all')).toBeNull()
  })
})
