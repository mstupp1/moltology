import { describe, expect, it } from 'vitest'
import { NOTIFICATIONS_MIN_INTERVAL_MS, shouldFetchNotifications } from './notifications-refresh'

describe('shouldFetchNotifications', () => {
  it('allows the first fetch and user-forced fetches', () => {
    expect(shouldFetchNotifications({ lastFetchedAt: null, now: 1_000 })).toBe(true)
    expect(
      shouldFetchNotifications({
        lastFetchedAt: 1_000,
        now: 1_001,
        force: true,
      }),
    ).toBe(true)
  })

  it('coalesces in-flight requests even when forced', () => {
    expect(
      shouldFetchNotifications({
        lastFetchedAt: null,
        now: 1_000,
        force: true,
        inFlight: true,
      }),
    ).toBe(false)
  })

  it('stays above Neon Free 5-minute idle for automatic refetches', () => {
    expect(NOTIFICATIONS_MIN_INTERVAL_MS).toBeGreaterThan(5 * 60_000)
    const lastFetchedAt = 10_000
    expect(
      shouldFetchNotifications({
        lastFetchedAt,
        now: lastFetchedAt + NOTIFICATIONS_MIN_INTERVAL_MS - 1,
      }),
    ).toBe(false)
    expect(
      shouldFetchNotifications({
        lastFetchedAt,
        now: lastFetchedAt + NOTIFICATIONS_MIN_INTERVAL_MS,
      }),
    ).toBe(true)
  })
})
