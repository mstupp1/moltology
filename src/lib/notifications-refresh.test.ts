import { describe, expect, it } from 'vitest'
import {
  DISABLED_REMOTE_INBOX_LIST,
  DISABLED_REMOTE_INBOX_MARK_READ,
  isRemoteInboxEnabled,
  NOTIFICATIONS_MIN_INTERVAL_MS,
  NOTIFICATIONS_REMOTE_INBOX_ENABLED,
  shouldFetchNotifications,
} from './notifications-refresh'

describe('shouldFetchNotifications', () => {
  it('keeps the remote inbox off so HUD tabs do not query Neon', () => {
    expect(NOTIFICATIONS_REMOTE_INBOX_ENABLED).toBe(false)
    expect(isRemoteInboxEnabled()).toBe(false)
    expect(DISABLED_REMOTE_INBOX_LIST).toEqual({ notifications: [], unreadCount: 0 })
    expect(DISABLED_REMOTE_INBOX_MARK_READ).toEqual({ ok: true })
    expect(shouldFetchNotifications({ lastFetchedAt: null, now: 1_000 })).toBe(false)
    expect(
      shouldFetchNotifications({
        lastFetchedAt: 1_000,
        now: 1_001,
        force: true,
      }),
    ).toBe(false)
  })

  it('allows the first fetch and user-forced fetches when the inbox is on', () => {
    expect(shouldFetchNotifications({ lastFetchedAt: null, now: 1_000, enabled: true })).toBe(true)
    expect(
      shouldFetchNotifications({
        lastFetchedAt: 1_000,
        now: 1_001,
        force: true,
        enabled: true,
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
        enabled: true,
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
        enabled: true,
      }),
    ).toBe(false)
    expect(
      shouldFetchNotifications({
        lastFetchedAt,
        now: lastFetchedAt + NOTIFICATIONS_MIN_INTERVAL_MS,
        enabled: true,
      }),
    ).toBe(true)
  })
})
