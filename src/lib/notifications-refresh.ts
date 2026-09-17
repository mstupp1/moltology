import type { NotificationView } from './notifications'

/**
 * Remote HUD inbox (hails, forum pings, friend alerts) requires a Postgres read.
 * Keep this off on Neon Free until we have a push/no-poll path. Toasts stay local
 * and do not use this flag.
 *
 * Flip to true to restore mount/focus fetch with NOTIFICATIONS_MIN_INTERVAL_MS.
 * Server handlers must honor this too: stale pre-#138 tabs still POST getNotificationsFn.
 */
export const NOTIFICATIONS_REMOTE_INBOX_ENABLED = false

/**
 * Automatic HUD inbox fetches must stay above Neon Free's ~5-minute idle.
 * A 60s timer on many signed-in tabs is enough to pin compute continuously.
 */
export const NOTIFICATIONS_MIN_INTERVAL_MS = 6 * 60_000

export const DISABLED_REMOTE_INBOX_LIST: {
  notifications: NotificationView[]
  unreadCount: number
} = {
  notifications: [],
  unreadCount: 0,
}

export const DISABLED_REMOTE_INBOX_MARK_READ = { ok: true as const }

export function isRemoteInboxEnabled(
  enabled: boolean = NOTIFICATIONS_REMOTE_INBOX_ENABLED,
): boolean {
  return enabled
}

export function shouldFetchNotifications(args: {
  lastFetchedAt: number | null
  now: number
  force?: boolean
  inFlight?: boolean
  minIntervalMs?: number
  enabled?: boolean
}): boolean {
  if (!isRemoteInboxEnabled(args.enabled ?? NOTIFICATIONS_REMOTE_INBOX_ENABLED)) return false
  if (args.inFlight) return false
  if (args.force) return true
  if (args.lastFetchedAt == null) return true
  const min = args.minIntervalMs ?? NOTIFICATIONS_MIN_INTERVAL_MS
  return args.now - args.lastFetchedAt >= min
}
