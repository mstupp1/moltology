import { beforeEach, describe, expect, it, vi } from 'vitest'

const counts = new Map<string, number>()
const insertedKeys: string[] = []

vi.mock('../../db', () => ({
  getDb: () => ({
    insert: () => ({
      values: (row: { key: string }) => ({
        onConflictDoUpdate: () => ({
          returning: async () => {
            insertedKeys.push(row.key)
            const next = (counts.get(row.key) ?? 0) + 1
            counts.set(row.key, next)
            return [{ count: next }]
          },
        }),
      }),
    }),
  }),
}))

import { reserveGuestOracleMessage } from './guest-usage'
import { ORACLE_GUEST_LIMITS } from './usage-limits'

const NOON = Date.UTC(2026, 10, 12, 12)

describe('reserveGuestOracleMessage', () => {
  beforeEach(() => {
    counts.clear()
    insertedKeys.length = 0
  })

  it('allows a visitor their daily guest messages, then stops them', async () => {
    for (let i = 0; i < ORACLE_GUEST_LIMITS.perDay; i += 1) {
      expect(await reserveGuestOracleMessage('203.0.113.9', NOON)).toEqual({ allowed: true })
    }
    expect(await reserveGuestOracleMessage('203.0.113.9', NOON)).toEqual({ allowed: false, scope: 'visitor' })
    // Another visitor is unaffected.
    expect(await reserveGuestOracleMessage('198.51.100.4', NOON)).toEqual({ allowed: true })
  })

  it('starts a fresh allowance the next day', async () => {
    for (let i = 0; i <= ORACLE_GUEST_LIMITS.perDay; i += 1) await reserveGuestOracleMessage('203.0.113.9', NOON)
    expect(await reserveGuestOracleMessage('203.0.113.9', NOON + 24 * 60 * 60 * 1000)).toEqual({ allowed: true })
  })

  it('stops every guest once the all-guests ceiling is reached', async () => {
    for (let i = 0; i < ORACLE_GUEST_LIMITS.allGuestsPerDay; i += 1) {
      expect((await reserveGuestOracleMessage(`10.0.${Math.floor(i / 250)}.${i % 250}`, NOON)).allowed).toBe(true)
    }
    expect(await reserveGuestOracleMessage('192.0.2.1', NOON)).toEqual({ allowed: false, scope: 'allGuests' })
  })

  it('never stores the raw IP address', async () => {
    await reserveGuestOracleMessage('203.0.113.9', NOON)
    expect(insertedKeys.every((key) => /^[0-9a-f]{64}$/.test(key))).toBe(true)
  })
})
