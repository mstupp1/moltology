import { describe, it, expect } from 'vitest'
import {
  capOracleHistory, decideOracleUsage, buildOracleUsageSnapshot,
  ORACLE_FREE_LIMITS, ORACLE_PREMIUM_LIMITS, oracleLimitsFor,
  ORACLE_FIVE_HOURS_MS, ORACLE_WEEK_MS,
} from './usage-limits'

const now = new Date('2026-10-25T12:00:00Z')
const ago = (ms: number) => new Date(now.getTime() - ms)
const events = (count: number, age: number) => Array.from({ length: count }, () => ago(age))

describe('oracle usage limits', () => {
  it('gives Premium 10x every free allowance', () => {
    for (const key of ['perMinute', 'perFiveHours', 'perWeek'] as const) {
      expect(ORACLE_PREMIUM_LIMITS[key]).toBe(ORACLE_FREE_LIMITS[key] * 10)
    }
    expect(oracleLimitsFor(true)).toBe(ORACLE_PREMIUM_LIMITS)
    expect(oracleLimitsFor(false)).toBe(ORACLE_FREE_LIMITS)
  })
  it('allows empty usage', () => {
    const snapshot = buildOracleUsageSnapshot([], false, now)
    expect(snapshot.fiveHours.remaining).toBe(15)
    expect(snapshot.week.remaining).toBe(100)
    expect(snapshot.nextAllowedAt).toBeNull()
    expect(decideOracleUsage(snapshot, false)).toEqual({ allowed: true })
  })
  it('excludes exact rolling boundaries', () => {
    const snapshot = buildOracleUsageSnapshot([ago(60_000), ago(ORACLE_FIVE_HOURS_MS), ago(ORACLE_WEEK_MS)], false, now)
    expect(snapshot.lastMinute).toBe(0)
    expect(snapshot.lastFiveHours).toBe(1)
    expect(snapshot.lastWeek).toBe(2)
  })
  it('blocks the five-hour window with timestamp-based retry', () => {
    const snapshot = buildOracleUsageSnapshot(events(15, 2 * 60 * 60_000), false, now)
    expect(snapshot.fiveHours.remaining).toBe(0)
    expect(decideOracleUsage(snapshot, false)).toMatchObject({ allowed: false, scope: 'fiveHours', retryAfterSeconds: 3 * 60 * 60 })
    expect(decideOracleUsage(buildOracleUsageSnapshot(events(15, 2 * 60 * 60_000), true, now), true)).toEqual({ allowed: true })
  })
  it('blocks weekly usage independently and counts all conversations together', () => {
    const snapshot = buildOracleUsageSnapshot(events(100, 24 * 60 * 60_000), false, now)
    expect(snapshot.fiveHours.remaining).toBe(15)
    expect(decideOracleUsage(snapshot, false)).toMatchObject({ allowed: false, scope: 'week', retryAfterSeconds: 6 * 24 * 60 * 60 })
  })
  it('waits for both blocked windows, including historical over-cap usage', () => {
    const snapshot = buildOracleUsageSnapshot([...events(90, 24 * 60 * 60_000), ...events(20, 2 * 60 * 60_000)], false, now)
    expect(snapshot.nextAllowedAt).toBe('2026-10-31T12:00:00.000Z')
    expect(decideOracleUsage(snapshot, false)).toMatchObject({ scope: 'week', retryAfterSeconds: 6 * 24 * 60 * 60 })
    expect(snapshot.week.remaining).toBe(0)
  })
  it('waits for five-hour capacity when weekly capacity returns first', () => {
    const snapshot = buildOracleUsageSnapshot([...events(85, ORACLE_WEEK_MS - 60 * 60_000), ...events(15, 60 * 60_000)], false, now)
    expect(snapshot.nextAllowedAt).toBe('2026-10-25T16:00:00.000Z')
    expect(decideOracleUsage(snapshot, false)).toMatchObject({ scope: 'fiveHours', retryAfterSeconds: 4 * 60 * 60 })
  })
  it('uses the correct event when historical usage exceeds a new cap', () => {
    const snapshot = buildOracleUsageSnapshot([...events(5, 4 * 60 * 60_000), ...events(15, 60 * 60_000)], false, now)
    expect(snapshot.nextAllowedAt).toBe('2026-10-25T16:00:00.000Z')
    const released = buildOracleUsageSnapshot([...events(5, 4 * 60 * 60_000), ...events(15, 60 * 60_000)], false, new Date('2026-10-25T16:00:00Z'))
    expect(released.fiveHours.remaining).toBe(15)
  })
  it('blocks Premium at its own caps', () => {
    expect(decideOracleUsage(buildOracleUsageSnapshot(events(150, 120_000), true, now), true)).toMatchObject({ scope: 'fiveHours' })
    expect(decideOracleUsage(buildOracleUsageSnapshot(events(1000, ORACLE_FIVE_HOURS_MS), true, now), true)).toMatchObject({ scope: 'week' })
  })
  it('keeps the minute guard and uses its actual expiry', () => {
    expect(decideOracleUsage(buildOracleUsageSnapshot(events(5, 20_000), false, now), false)).toMatchObject({ scope: 'minute', retryAfterSeconds: 40 })
  })
  it('rounds retry up and does not restore usage by changing conversations', () => {
    const history = events(15, ORACLE_FIVE_HOURS_MS - 1200)
    const snapshot = buildOracleUsageSnapshot(history, false, now)
    expect(decideOracleUsage(snapshot, false)).toMatchObject({ retryAfterSeconds: 2 })
    expect(buildOracleUsageSnapshot(history, false, now)).toEqual(snapshot)
  })
})

describe('capOracleHistory', () => {
  it('keeps the newest turns within the message cap', () => {
    const turns = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant',
      content: `t${i}`,
    }))
    const out = capOracleHistory(turns, 4, 1000)
    expect(out.map((m) => m.content)).toEqual(['t6', 't7', 't8', 't9'])
  })

  it('stops at the character budget', () => {
    const out = capOracleHistory(
      [
        { role: 'user', content: 'a'.repeat(50) },
        { role: 'assistant', content: 'b'.repeat(50) },
        { role: 'user', content: 'c'.repeat(50) },
      ],
      20,
      120,
    )
    expect(out.map((m) => m.content[0])).toEqual(['c'])
  })

  it('trims an oversized newest message instead of dropping it', () => {
    const out = capOracleHistory([{ role: 'user', content: 'z'.repeat(500) }], 20, 100)
    expect(out).toHaveLength(1)
    expect(out[0].content).toHaveLength(100)
  })
})
