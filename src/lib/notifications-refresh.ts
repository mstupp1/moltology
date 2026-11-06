import type { NotificationView } from './notifications'

/**
 * Notifications inbox (friend requests, forum replies and mentions). There is no
 * timer: the inbox reads once on load, again when the tab regains focus (no more
 * often than NOTIFICATIONS_MIN_INTERVAL_MS), and whenever the bell is opened.
 * Server handlers honor this flag too, so flipping it off stops every read.
 */
export const NOTIFICATIONS_REMOTE_INBOX_ENABLED = true

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
