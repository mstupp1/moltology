/** Oracle allowances count chat requests across all conversations. */
export interface OracleUsageLimits {
  perMinute: number
  perFiveHours: number
  perWeek: number
}

export const ORACLE_FREE_LIMITS: OracleUsageLimits = { perMinute: 5, perFiveHours: 15, perWeek: 100 }
export const PREMIUM_LIMIT_MULTIPLIER = 10
export const ORACLE_PREMIUM_LIMITS: OracleUsageLimits = {
  perMinute: ORACLE_FREE_LIMITS.perMinute * PREMIUM_LIMIT_MULTIPLIER,
  perFiveHours: ORACLE_FREE_LIMITS.perFiveHours * PREMIUM_LIMIT_MULTIPLIER,
  perWeek: ORACLE_FREE_LIMITS.perWeek * PREMIUM_LIMIT_MULTIPLIER,
}
export const ORACLE_FIVE_HOURS_MS = 5 * 60 * 60 * 1000
export const ORACLE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
export const ORACLE_MAX_HISTORY_MESSAGES = 20
export const ORACLE_MAX_HISTORY_CHARS = 16_000
export const ORACLE_MAX_OUTPUT_TOKENS = 1_024

export function oracleLimitsFor(isPremium: boolean): OracleUsageLimits {
  return isPremium ? ORACLE_PREMIUM_LIMITS : ORACLE_FREE_LIMITS
}

export interface OracleUsageCounts {
  lastMinute: number
  lastFiveHours: number
  lastWeek: number
  nextMinuteAt?: string | null
  nextFiveHoursAt?: string | null
  nextWeekAt?: string | null
  serverTime?: string
}
export interface OracleUsageWindow {
  used: number
  limit: number
  remaining: number
  /** When one message of capacity returns, even if still over the limit. */
  nextAvailableAt: string | null
}
export interface OracleUsageSnapshot extends OracleUsageCounts {
  isPremium: boolean
  serverTime: string
  fiveHours: OracleUsageWindow
  week: OracleUsageWindow
  /** When both allowance windows permit sending; excludes the burst guard. */
  nextAllowedAt: string | null
}

/** Exact rolling boundaries exclude events that have just aged out. */
export function buildOracleUsageSnapshot(
  events: Array<Date | string>,
  isPremium: boolean,
  now: Date = new Date(),
): OracleUsageSnapshot {
  const nowMs = now.getTime()
  const timestamps = events.map((event) => new Date(event).getTime()).filter((time) => time <= nowMs).sort((a, b) => a - b)
  const limits = oracleLimitsFor(isPremium)
  function windowFor(duration: number, limit: number): OracleUsageWindow {
    const active = timestamps.filter((time) => time > nowMs - duration)
    // Over-cap historical usage must expire far enough to admit another request.
    const releaseIndex = Math.max(0, active.length - limit)
    return {
      used: active.length,
      limit,
      remaining: Math.max(0, limit - active.length),
      nextAvailableAt: active.length ? new Date(active[releaseIndex] + duration).toISOString() : null,
    }
  }
  const minute = windowFor(60_000, limits.perMinute)
  const fiveHours = windowFor(ORACLE_FIVE_HOURS_MS, limits.perFiveHours)
  const week = windowFor(ORACLE_WEEK_MS, limits.perWeek)
  const blockedUntil = [fiveHours, week].filter((window) => !window.remaining).map((window) => window.nextAvailableAt!)
  return {
    isPremium, serverTime: now.toISOString(), fiveHours, week,
    lastMinute: minute.used, lastFiveHours: fiveHours.used, lastWeek: week.used,
    nextMinuteAt: minute.nextAvailableAt,
    nextFiveHoursAt: fiveHours.nextAvailableAt,
    nextWeekAt: week.nextAvailableAt,
    nextAllowedAt: blockedUntil.sort().at(-1) ?? null,
  }
}

export type OracleUsageDecision =
  | { allowed: true }
  | { allowed: false; scope: 'minute' | 'fiveHours' | 'week'; message: string; retryAfterSeconds: number }

export function oracleMinuteLimitMessage(): string {
  return 'You are sending messages too quickly. Wait a minute, then try again.'
}

export function decideOracleUsage(counts: OracleUsageCounts, isPremium: boolean): OracleUsageDecision {
  const limits = oracleLimitsFor(isPremium)
  const now = counts.serverTime ? Date.parse(counts.serverTime) : Date.now()
  const blocked = [
    { scope: 'minute' as const, count: counts.lastMinute, limit: limits.perMinute, at: counts.nextMinuteAt, duration: 60_000 },
    { scope: 'fiveHours' as const, count: counts.lastFiveHours, limit: limits.perFiveHours, at: counts.nextFiveHoursAt, duration: ORACLE_FIVE_HOURS_MS },
    { scope: 'week' as const, count: counts.lastWeek, limit: limits.perWeek, at: counts.nextWeekAt, duration: ORACLE_WEEK_MS },
  ].filter((window) => window.count >= window.limit)
    .map((window) => ({ ...window, until: window.at ? Date.parse(window.at) : now + window.duration }))
    .sort((a, b) => b.until - a.until)
  const binding = blocked[0]
  if (!binding) return { allowed: true }
  const message = binding.scope === 'minute' ? oracleMinuteLimitMessage()
    : `You have reached your ${binding.scope === 'week' ? '7-day' : '5-hour'} Oracle message limit. Messages become available as older messages leave each window.`
  return { allowed: false, scope: binding.scope, message, retryAfterSeconds: Math.max(1, Math.ceil((binding.until - now) / 1000)) }
}

export interface OracleHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Keeps the newest turns that fit the message and character caps. The newest
 * message always survives, trimmed if it alone is over the budget.
 */
export function capOracleHistory<T extends OracleHistoryMessage>(
  messages: T[],
  maxMessages: number = ORACLE_MAX_HISTORY_MESSAGES,
  maxChars: number = ORACLE_MAX_HISTORY_CHARS,
): T[] {
  const kept: T[] = []
  let used = 0
  for (let i = messages.length - 1; i >= 0 && kept.length < maxMessages; i--) {
    const message = messages[i]
    const remaining = maxChars - used
    if (message.content.length > remaining) {
      if (kept.length === 0) kept.unshift({ ...message, content: message.content.slice(-maxChars) })
      break
    }
    kept.unshift(message)
    used += message.content.length
  }
  // A model turn must not lead the history.
  while (kept.length > 1 && kept[0].role === 'assistant') kept.shift()
  return kept
}
