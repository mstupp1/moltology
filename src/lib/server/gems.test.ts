import { describe, expect, it } from 'vitest'
import { GEM_ALL_TASKS_DAILY, GEM_STREAK_MILESTONES, gemStreakBonus } from '../gems'
import { dailyGemAwards } from './gems'

describe('daily gem awards', () => {
  it('gives nothing until every liturgy is done', () => {
    expect(dailyGemAwards('2026-11-04', false, 7)).toEqual([])
  })

  it('pays the daily award with a date-scoped key', () => {
    expect(dailyGemAwards('2026-11-04', true, 1)).toEqual([
      expect.objectContaining({ amount: GEM_ALL_TASKS_DAILY, sourceKey: 'routine_all:2026-11-04' }),
    ])
  })

  it('adds the streak milestone on the day it lands', () => {
    const awards = dailyGemAwards('2026-11-04', true, 7)
    expect(awards.map((a) => a.sourceKey)).toEqual(['routine_all:2026-11-04', 'streak:7:2026-11-04'])
    expect(awards[1].amount).toBe(gemStreakBonus(7))
  })

  it('only pays streaks on milestone days', () => {
    expect(gemStreakBonus(8)).toBe(0)
    for (const m of GEM_STREAK_MILESTONES) expect(gemStreakBonus(m.days)).toBe(m.gems)
  })
})
