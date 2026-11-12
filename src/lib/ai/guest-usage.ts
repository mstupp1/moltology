import { createHash } from 'node:crypto'
import { inArray, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { storeRateLimits } from '../../db/schema'
import { ORACLE_GUEST_LIMITS } from './usage-limits'

const DAY_MS = 24 * 60 * 60 * 1000

export type GuestOracleAllowance = { allowed: true } | { allowed: false; scope: 'visitor' | 'allGuests' }

function bucketKey(key: string, windowMs: number, now: number) {
  return createHash('sha256').update(`oracle-guest:${key}:${Math.floor(now / windowMs)}`).digest('hex')
}

/** Adds one to a durable fixed-window counter and returns the new count. */
async function bump(key: string, windowMs: number, now: number): Promise<number> {
  const window = Math.floor(now / windowMs)
  // Shares the store's server-only counter table (key, count, expiresAt); expired rows are swept there.
  const bucket = bucketKey(key, windowMs, now)
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

/** Gives back a reserved guest message when the model never answered. Best effort. */
export async function releaseGuestOracleMessage(visitorKey: string, now = Date.now()): Promise<void> {
  try {
    await getDb()
      .update(storeRateLimits)
      .set({ count: sql`GREATEST(${storeRateLimits.count} - 1, 0)` })
      .where(inArray(storeRateLimits.key, [bucketKey(`ip:${visitorKey}`, DAY_MS, now), bucketKey('all', DAY_MS, now)]))
  } catch (err) {
    console.warn('[releaseGuestOracleMessage] Release warning:', err)
  }
}
