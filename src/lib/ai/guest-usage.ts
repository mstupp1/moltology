import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { storeRateLimits } from '../../db/schema'
import { ORACLE_GUEST_LIMITS } from './usage-limits'

const DAY_MS = 24 * 60 * 60 * 1000

export type GuestOracleAllowance = { allowed: true } | { allowed: false; scope: 'visitor' | 'allGuests' }

/** Adds one to a durable fixed-window counter and returns the new count. */
async function bump(key: string, windowMs: number, now: number): Promise<number> {
  const window = Math.floor(now / windowMs)
  // Shares the store's server-only counter table (key, count, expiresAt); expired rows are swept there.
  const bucket = createHash('sha256').update(`oracle-guest:${key}:${window}`).digest('hex')
  const [row] = await getDb()
    .insert(storeRateLimits)
    .values({ key: bucket, count: 1, expiresAt: new Date((window + 1) * windowMs) })
    .onConflictDoUpdate({ target: storeRateLimits.key, set: { count: sql`${storeRateLimits.count} + 1` } })
    .returning({ count: storeRateLimits.count })
  return row?.count ?? Number.POSITIVE_INFINITY
}

/**
 * Counts one guest Oracle message against the visitor's daily allowance and the
 * all-guests ceiling. Throws when the counters can't be written; callers fail closed.
 */
export async function reserveGuestOracleMessage(visitorKey: string, now = Date.now()): Promise<GuestOracleAllowance> {
  if ((await bump(`ip:${visitorKey}`, DAY_MS, now)) > ORACLE_GUEST_LIMITS.perDay) {
    return { allowed: false, scope: 'visitor' }
  }
  if ((await bump('all', DAY_MS, now)) > ORACLE_GUEST_LIMITS.allGuestsPerDay) {
    return { allowed: false, scope: 'allGuests' }
  }
  return { allowed: true }
}
