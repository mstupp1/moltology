/**
 * Remote HUD inbox (hails, forum pings, friend alerts) requires a Postgres read.
 * Keep this off on Neon Free until we have a push/no-poll path. Toasts stay local
 * and do not use this flag.
 *
 * Flip to true to restore mount/focus fetch with NOTIFICATIONS_MIN_INTERVAL_MS.
 */
export const NOTIFICATIONS_REMOTE_INBOX_ENABLED = false

/**
 * Automatic HUD inbox fetches must stay above Neon Free's ~5-minute idle.
 * A 60s timer on many signed-in tabs is enough to pin compute continuously.
 */
export const NOTIFICATIONS_MIN_INTERVAL_MS = 6 * 60_000

export function shouldFetchNotifications(args: {
  lastFetchedAt: number | null
  now: number
  force?: boolean
  inFlight?: boolean
  minIntervalMs?: number
  enabled?: boolean
}): boolean {
  const enabled = args.enabled ?? NOTIFICATIONS_REMOTE_INBOX_ENABLED
  if (!enabled) return false
  if (args.inFlight) return false
  if (args.force) return true
  if (args.lastFetchedAt == null) return true
  const min = args.minIntervalMs ?? NOTIFICATIONS_MIN_INTERVAL_MS
  return args.now - args.lastFetchedAt >= min
}
