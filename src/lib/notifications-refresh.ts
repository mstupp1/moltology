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
}): boolean {
  if (args.inFlight) return false
  if (args.force) return true
  if (args.lastFetchedAt == null) return true
  const min = args.minIntervalMs ?? NOTIFICATIONS_MIN_INTERVAL_MS
  return args.now - args.lastFetchedAt >= min
}
