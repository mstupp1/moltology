import { describe, expect, it } from 'vitest'
import {
  compareTotals,
  formatWeekRange,
  leaderboardWeeks,
  placeWeeks,
  recordLabel,
  tallyRecords,
  weekStartUtc,
  type WeeklyTotal,
} from './leaderboard'

const W1 = '2026-11-02T00:00:00.000Z'
const W2 = '2026-11-09T00:00:00.000Z'

function total(userId: string, weekStart: string, xp: number, lastAt = weekStart): WeeklyTotal {
  return { userId, weekStart, xp, lastAt }
}

describe('weekStartUtc', () => {
  it('returns Monday 00:00 UTC for any day of the week', () => {
    expect(weekStartUtc(new Date('2026-11-16T16:00:00Z')).toISOString()).toBe('2026-11-16T00:00:00.000Z')
    expect(weekStartUtc(new Date('2026-11-22T23:59:59Z')).toISOString()).toBe('2026-11-16T00:00:00.000Z')
    expect(weekStartUtc(new Date('2026-11-15T23:59:59Z')).toISOString()).toBe('2026-11-09T00:00:00.000Z')
  })

  it('puts the crest week one week before the current one', () => {
    const weeks = leaderboardWeeks(new Date('2026-11-18T10:00:00Z'))
    expect(weeks.currentStart.toISOString()).toBe('2026-11-16T00:00:00.000Z')
    expect(weeks.currentEnd.toISOString()).toBe('2026-11-23T00:00:00.000Z')
    expect(weeks.crestWeekStart.toISOString()).toBe('2026-11-09T00:00:00.000Z')
  })
})

describe('placeWeeks', () => {
  it('places the top 3 of each week and skips members with no XP', () => {
    const placings = placeWeeks([
      total('a', W1, 100),
      total('b', W1, 300),
      total('c', W1, 200),
      total('d', W1, 50),
      total('e', W1, 0),
      total('a', W2, 40),
    ])
    const w1 = placings.filter((p) => p.weekStart === W1).sort((x, y) => x.rank - y.rank)
    expect(w1.map((p) => [p.userId, p.rank])).toEqual([
      ['b', 1],
      ['c', 2],
      ['a', 3],
    ])
    expect(placings.filter((p) => p.weekStart === W2)).toEqual([{ userId: 'a', weekStart: W2, rank: 1, xp: 40 }])
  })

  it('breaks a tie in favour of whoever got there first', () => {
    const early = total('late-id', W1, 100, '2026-11-03T08:00:00.000Z')
    const late = total('early-id', W1, 100, '2026-11-05T08:00:00.000Z')
    expect([late, early].sort(compareTotals).map((t) => t.userId)).toEqual(['late-id', 'early-id'])
  })
})

describe('records', () => {
  it('counts top-3 weeks and golds per member', () => {
    const records = tallyRecords(
      placeWeeks([total('a', W1, 300), total('b', W1, 200), total('a', W2, 10), total('b', W2, 20)]),
    )
    expect(records.a).toEqual({ gold: 1, silver: 1, bronze: 0, weeks: 2 })
    expect(records.b).toEqual({ gold: 1, silver: 1, bronze: 0, weeks: 2 })
  })

  it('labels a record plainly', () => {
    expect(recordLabel(null)).toBeNull()
    expect(recordLabel({ gold: 0, silver: 0, bronze: 1, weeks: 1 })).toBe('Top 3 · 1 week')
    expect(recordLabel({ gold: 2, silver: 1, bronze: 1, weeks: 4 })).toBe('Top 3 · 4 weeks · 2× #1')
  })
})

describe('formatWeekRange', () => {
  it('formats in UTC within and across months', () => {
    expect(formatWeekRange('2026-11-16T00:00:00.000Z')).toBe('Nov 16 – 22')
    expect(formatWeekRange('2026-11-30T00:00:00.000Z')).toBe('Nov 30 – Dec 6')
  })
})
