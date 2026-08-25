import { describe, it, expect } from 'vitest'
import {
  CANONICAL_ALIGNMENT_TASKS,
  TOTAL_ALIGNMENT_TASKS,
  localDateString,
  parseLocalDate,
  shiftDays,
  mergeCompletions,
  computeStreak,
  buildStreakHistory,
} from './alignment-tasks'

describe('alignment-tasks catalog and helpers', () => {
  it('contains exactly 8 canonical daily alignment tasks with valid keys and times', () => {
    expect(CANONICAL_ALIGNMENT_TASKS).toHaveLength(8)
    expect(TOTAL_ALIGNMENT_TASKS).toBe(8)

    const expectedKeys = [
      'silent-synchronization',
      'prompt-construction',
      'skill-development',
      'nutritional-efficiency-break',
      'iterative-refinement',
      'community-outreach',
      'reflection-log',
      'alignment-review',
    ]

    CANONICAL_ALIGNMENT_TASKS.forEach((task, idx) => {
      expect(task.key).toBe(expectedKeys[idx])
      expect(task.title).toBeTruthy()
      expect(task.time).toBeTruthy()
    })
  })

  it('formats and parses local date strings correctly', () => {
    const testDate = new Date(2026, 7, 24) // Aug 24, 2026
    const str = localDateString(testDate)
    expect(str).toBe('2026-08-24')

    const parsed = parseLocalDate('2026-08-24')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(7)
    expect(parsed.getDate()).toBe(24)
  })

  it('shifts days correctly forwards and backwards across month boundaries', () => {
    expect(shiftDays('2026-08-01', -1)).toBe('2026-07-31')
    expect(shiftDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(shiftDays('2026-08-24', 0)).toBe('2026-08-24')
    expect(shiftDays('2026-08-24', 7)).toBe('2026-08-31')
  })

  it('merges completed keys into the canonical catalog with correct completed flags', () => {
    const completed = ['silent-synchronization', 'alignment-review']
    const merged = mergeCompletions(completed)

    expect(merged).toHaveLength(8)
    expect(merged[0].completed).toBe(true)
    expect(merged[0].key).toBe('silent-synchronization')
    expect(merged[1].completed).toBe(false)
    expect(merged[7].completed).toBe(true)
    expect(merged[7].key).toBe('alignment-review')
  })

  it('computes streak when today is completed (8/8)', () => {
    const today = '2026-08-24'
    const history = [
      { date: '2026-08-21', completedCount: 8 },
      { date: '2026-08-22', completedCount: 8 },
      { date: '2026-08-23', completedCount: 8 },
      { date: '2026-08-24', completedCount: 8 },
    ]

    const streak = computeStreak(history, today)
    expect(streak).toBe(4)
  })

  it('computes streak when today is in progress (<8) but yesterday was completed (8/8)', () => {
    const today = '2026-08-24'
    const history = [
      { date: '2026-08-21', completedCount: 8 },
      { date: '2026-08-22', completedCount: 8 },
      { date: '2026-08-23', completedCount: 8 },
      { date: '2026-08-24', completedCount: 3 },
    ]

    const streak = computeStreak(history, today)
    expect(streak).toBe(3)
  })

  it('returns 0 streak when yesterday was incomplete (<8) and today is in progress (<8)', () => {
    const today = '2026-08-24'
    const history = [
      { date: '2026-08-22', completedCount: 8 },
      { date: '2026-08-23', completedCount: 5 }, // broken streak yesterday
      { date: '2026-08-24', completedCount: 2 },
    ]

    const streak = computeStreak(history, today)
    expect(streak).toBe(0)
  })

  it('builds streak history with 14 days including today and correct percentages', () => {
    const today = '2026-08-24'
    const history = [
      { date: '2026-08-23', completedCount: 8 },
      { date: '2026-08-24', completedCount: 4 },
    ]

    const streakHistory = buildStreakHistory(history, today, 14)
    expect(streakHistory).toHaveLength(14)

    const todayItem = streakHistory[streakHistory.length - 1]
    expect(todayItem.isToday).toBe(true)
    expect(todayItem.date).toBe(today)
    expect(todayItem.completed).toBe(4)
    expect(todayItem.total).toBe(8)
    expect(todayItem.pct).toBe(50)

    const yesterdayItem = streakHistory[streakHistory.length - 2]
    expect(yesterdayItem.completed).toBe(8)
    expect(yesterdayItem.pct).toBe(100)
  })
})
