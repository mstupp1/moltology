/**
 * Oracle chat usage limits.
 *
 * Signed-in members are counted in `ai_usage_events`, which survives thread
 * deletion and is shared by every server instance. Premium gets 10x the free
 * allowance. Guests never reach a chat model, so they have no allowance here.
 */

export interface OracleUsageLimits {
  /** Chat requests in any rolling 60 seconds. */
  perMinute: number
  /** Chat requests in any rolling 24 hours. */
  perDay: number
}

export const ORACLE_FREE_LIMITS: OracleUsageLimits = { perMinute: 5, perDay: 30 }

export const PREMIUM_LIMIT_MULTIPLIER = 10

export const ORACLE_PREMIUM_LIMITS: OracleUsageLimits = {
  perMinute: ORACLE_FREE_LIMITS.perMinute * PREMIUM_LIMIT_MULTIPLIER,
  perDay: ORACLE_FREE_LIMITS.perDay * PREMIUM_LIMIT_MULTIPLIER,
}

/** Caps on what one request may send or receive, for every tier. */
export const ORACLE_MAX_HISTORY_MESSAGES = 20
export const ORACLE_MAX_HISTORY_CHARS = 16_000
export const ORACLE_MAX_OUTPUT_TOKENS = 1_024

export function oracleLimitsFor(isPremium: boolean): OracleUsageLimits {
  return isPremium ? ORACLE_PREMIUM_LIMITS : ORACLE_FREE_LIMITS
}

export interface OracleUsageCounts {
  lastMinute: number
  lastDay: number
}

export type OracleUsageDecision =
  | { allowed: true }
  | { allowed: false; scope: 'minute' | 'day'; message: string; retryAfterSeconds: number }

export function oracleMinuteLimitMessage(): string {
  return 'You are sending messages too quickly. Wait a minute, then try again.'
}

export function oracleDailyLimitMessage(limits: OracleUsageLimits, isPremium: boolean): string {
  const base = `You have reached your limit of ${limits.perDay} Oracle messages in 24 hours. Your allowance frees up as older messages age out.`
  return isPremium ? base : `${base} Premium raises the limit to ${ORACLE_PREMIUM_LIMITS.perDay}.`
}

export function decideOracleUsage(
  counts: OracleUsageCounts,
  isPremium: boolean,
): OracleUsageDecision {
  const limits = oracleLimitsFor(isPremium)
  if (counts.lastDay >= limits.perDay) {
    return {
      allowed: false,
      scope: 'day',
      message: oracleDailyLimitMessage(limits, isPremium),
      retryAfterSeconds: 60 * 60,
    }
  }
  if (counts.lastMinute >= limits.perMinute) {
    return {
      allowed: false,
      scope: 'minute',
      message: oracleMinuteLimitMessage(),
      retryAfterSeconds: 60,
    }
  }
  return { allowed: true }
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
