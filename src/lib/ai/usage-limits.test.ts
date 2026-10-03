import { describe, it, expect } from 'vitest'
import {
  capOracleHistory,
  decideOracleUsage,
  ORACLE_FREE_LIMITS,
  ORACLE_PREMIUM_LIMITS,
  oracleLimitsFor,
} from './usage-limits'

describe('oracle usage limits', () => {
  it('gives Premium 10x the free allowance', () => {
    expect(ORACLE_PREMIUM_LIMITS.perDay).toBe(ORACLE_FREE_LIMITS.perDay * 10)
    expect(ORACLE_PREMIUM_LIMITS.perMinute).toBe(ORACLE_FREE_LIMITS.perMinute * 10)
    expect(oracleLimitsFor(true)).toBe(ORACLE_PREMIUM_LIMITS)
    expect(oracleLimitsFor(false)).toBe(ORACLE_FREE_LIMITS)
  })

  it('allows a member under both limits', () => {
    expect(decideOracleUsage({ lastMinute: 0, lastDay: 0 }, false)).toEqual({ allowed: true })
  })

  it('blocks a free member at the daily limit and points to Premium', () => {
    const decision = decideOracleUsage({ lastMinute: 0, lastDay: ORACLE_FREE_LIMITS.perDay }, false)
    expect(decision).toMatchObject({ allowed: false, scope: 'day' })
    if (!decision.allowed) expect(decision.message).toContain(`${ORACLE_PREMIUM_LIMITS.perDay}`)
  })

  it('lets Premium continue past the free daily limit', () => {
    expect(decideOracleUsage({ lastMinute: 0, lastDay: ORACLE_FREE_LIMITS.perDay }, true)).toEqual({
      allowed: true,
    })
    const capped = decideOracleUsage({ lastMinute: 0, lastDay: ORACLE_PREMIUM_LIMITS.perDay }, true)
    expect(capped).toMatchObject({ allowed: false, scope: 'day' })
    if (!capped.allowed) expect(capped.message).not.toContain('Premium raises')
  })

  it('blocks bursts per minute', () => {
    expect(decideOracleUsage({ lastMinute: ORACLE_FREE_LIMITS.perMinute, lastDay: 1 }, false)).toMatchObject({
      allowed: false,
      scope: 'minute',
      retryAfterSeconds: 60,
    })
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
