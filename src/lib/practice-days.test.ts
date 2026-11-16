import { describe, expect, it } from 'vitest'
import { computeStreak, computeStreakWithCarry, buildStreakHistory } from './alignment-tasks'
import {
  DEFAULT_PRACTICE_DAYS,
  describePracticeDays,
  isPracticeDay,
  isValidPracticeDays,
  practiceDayChecker,
  practiceDaysOn,
  weekdayOf,
} from './practice-days'

// 2026-11-16 is a Monday.
const full = (date: string) => ({ date, completedCount: 8 })
const none = (date: string) => ({ date, completedCount: 0 })

describe('practice days', () => {
  it('reads weekdays from the date itself, not the runtime timezone', () => {
    expect(weekdayOf('2026-11-16')).toBe(1)
    expect(weekdayOf('2026-11-15')).toBe(0)
    expect(weekdayOf('2026-11-21')).toBe(6)
  })

  it('defaults to Mon to Fri from the start date and treats earlier days as practice days', () => {
    expect(isPracticeDay('2026-11-07')).toBe(true) // a Saturday before practice days existed
    expect(isPracticeDay('2026-11-14')).toBe(false) // launch weekend Saturday
    expect(isPracticeDay('2026-11-16')).toBe(true)
    expect(isPracticeDay('2026-11-22')).toBe(false)
  })

  it('applies each saved change from its own date only', () => {
    const schedule = [{ from: '2026-11-20', days: 0b1111111 }]
    expect(isPracticeDay('2026-11-15', schedule)).toBe(false)
    expect(isPracticeDay('2026-11-21', schedule)).toBe(true)
    expect(practiceDaysOn('2026-11-19', schedule)).toBe(DEFAULT_PRACTICE_DAYS)
  })

  it('needs at least four days', () => {
    expect(isValidPracticeDays(0b0011110)).toBe(true)
    expect(isValidPracticeDays(0b0001110)).toBe(false)
    expect(isValidPracticeDays(128)).toBe(false)
  })

  it('describes common sets plainly', () => {
    expect(describePracticeDays(DEFAULT_PRACTICE_DAYS)).toBe('Mon to Fri')
    expect(describePracticeDays(0b1111111)).toBe('Every day')
    expect(describePracticeDays(0b1101011)).toBe('Mon, Wed, Fri, Sat, Sun')
  })
})

describe('streaks with off days', () => {
  const weekdays = practiceDayChecker([])

  it('skips a missed weekend', () => {
    const history = [full('2026-11-19'), full('2026-11-20'), none('2026-11-21'), none('2026-11-22'), full('2026-11-23')]
    expect(computeStreak(history, '2026-11-23', 8, weekdays)).toBe(3)
    // Without practice days the weekend breaks it.
    expect(computeStreak(history, '2026-11-23', 8)).toBe(1)
  })

  it('does not break on an off day still in progress, or on today', () => {
    const history = [full('2026-11-20'), none('2026-11-21'), none('2026-11-22')]
    expect(computeStreak(history, '2026-11-22', 8, weekdays)).toBe(1)
  })

  it('counts a full off day as a bonus day', () => {
    const history = [full('2026-11-20'), full('2026-11-21'), none('2026-11-22'), full('2026-11-23')]
    expect(computeStreak(history, '2026-11-23', 8, weekdays)).toBe(3)
  })

  it('still breaks on a missed practice day', () => {
    const history = [full('2026-11-19'), none('2026-11-20'), none('2026-11-21'), none('2026-11-22'), full('2026-11-23')]
    expect(computeStreak(history, '2026-11-23', 8, weekdays)).toBe(1)
  })

  it('joins a carry across off days at the start of the history', () => {
    const history = [none('2026-11-21'), none('2026-11-22'), full('2026-11-23')]
    const carry = { anchorDate: '2026-11-20', streakDays: 40 }
    expect(computeStreakWithCarry(history, '2026-11-23', carry, 8, weekdays)).toBe(41)
    expect(computeStreakWithCarry(history, '2026-11-23', carry, 8)).toBe(1)
  })

  it('marks off days in the week history', () => {
    const days = buildStreakHistory([], '2026-11-23', 7, 8, weekdays)
    expect(days.map((d) => d.offDay)).toEqual([false, false, false, false, true, true, false])
  })
})
