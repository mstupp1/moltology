import { describe, expect, it } from 'vitest'
import { buildTickSchedule, seededRng, WEEKLY_TICKS } from './simulation-schedule'

describe('buildTickSchedule', () => {
  const now = new Date('2026-10-18T00:00:00Z')

  it('returns weekly ticks ordered oldest to newest inside the window', () => {
    const times = buildTickSchedule({ now, rng: seededRng(1) })
    expect(times).toHaveLength(WEEKLY_TICKS)
    const sorted = [...times].sort((a, b) => a.getTime() - b.getTime())
    expect(times).toEqual(sorted)
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
    expect(times[0].getTime()).toBeGreaterThanOrEqual(weekAgo)
    expect(times[times.length - 1].getTime()).toBeLessThan(now.getTime())
  })

  it('keeps ticks distinct and roughly twelve hours apart', () => {
    const times = buildTickSchedule({ now, rng: seededRng(7) })
    for (let i = 1; i < times.length; i++) {
      const gap = times[i].getTime() - times[i - 1].getTime()
      expect(gap).toBeGreaterThan(0)
      expect(gap).toBeLessThan(24 * 60 * 60 * 1000)
    }
  })

  it('is reproducible for a given seed', () => {
    expect(buildTickSchedule({ now, rng: seededRng(3) })).toEqual(buildTickSchedule({ now, rng: seededRng(3) }))
  })

  it('handles zero ticks', () => {
    expect(buildTickSchedule({ now, totalTicks: 0 })).toEqual([])
  })
})
