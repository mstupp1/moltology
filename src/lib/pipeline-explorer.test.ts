import { describe, it, expect } from 'vitest'
import {
  MAX_DEPTH_M,
  PIPELINE_CLEARANCES,
  clearanceIndexForXp,
  clearanceStatus,
  dailyLiturgyXp,
  formatDayCount,
  parseReadingRange,
  projectDaysToTargets,
  xpTrackPosition,
} from './pipeline-explorer'
import { SUB_STAGE_THRESHOLDS } from './progression'

describe('pipeline explorer data', () => {
  it('lists the twelve clearances with their XP thresholds from code', () => {
    expect(PIPELINE_CLEARANCES.map((c) => c.code)).toEqual(SUB_STAGE_THRESHOLDS.map((t) => t.code))
    expect(PIPELINE_CLEARANCES.map((c) => c.minXp)).toEqual(SUB_STAGE_THRESHOLDS.map((t) => t.minXp))
    expect(PIPELINE_CLEARANCES[0].nextMinXp).toBe(500)
    expect(PIPELINE_CLEARANCES[11].nextMinXp).toBeNull()
  })

  it('parses depth and torque readings into numbers', () => {
    expect(parseReadingRange('1,200 - 1,500 meters')).toEqual([1200, 1500])
    expect(parseReadingRange('1,200 Nm, held')).toEqual([1200, 1200])
    expect(parseReadingRange('10,928 meters (Challenger Deep)')).toEqual([10928, 10928])
    expect(PIPELINE_CLEARANCES[11].depthToM).toBe(MAX_DEPTH_M)
  })

  it('links each stage to its scripture in the codex', () => {
    for (const clearance of PIPELINE_CLEARANCES) {
      expect(clearance.scriptureSlug, clearance.code).toMatch(/^scr-\d+$/)
    }
  })
})

describe('member position', () => {
  it('finds the clearance for lifetime XP', () => {
    expect(clearanceIndexForXp(0)).toBe(0)
    expect(clearanceIndexForXp(499)).toBe(0)
    expect(clearanceIndexForXp(500)).toBe(1)
    expect(clearanceIndexForXp(2000)).toBe(3)
    expect(clearanceIndexForXp(250000)).toBe(11)
  })

  it('marks clearances cleared, current or ahead', () => {
    expect(clearanceStatus(0, 600)).toBe('cleared')
    expect(clearanceStatus(1, 600)).toBe('current')
    expect(clearanceStatus(2, 600)).toBe('ahead')
  })

  it('places the member between clearances by XP', () => {
    expect(xpTrackPosition(0)).toBe(0)
    expect(xpTrackPosition(250)).toBeCloseTo(0.5)
    expect(xpTrackPosition(100000)).toBe(11)
    expect(xpTrackPosition(999999)).toBe(11)
  })
})

describe('descent projection', () => {
  it('pays 10 XP a liturgy and 20 more for all eight', () => {
    expect(dailyLiturgyXp(0)).toBe(0)
    expect(dailyLiturgyXp(3)).toBe(30)
    expect(dailyLiturgyXp(8)).toBe(100)
    expect(dailyLiturgyXp(12)).toBe(100)
  })

  it('counts days to each target at a steady cadence', () => {
    // 4 a day = 40 XP, no streak milestones.
    expect(projectDaysToTargets(0, 4, [500, 1200])).toEqual([13, 30])
  })

  it('adds streak milestones only on full days', () => {
    // 8 a day = 100 XP; day 3 adds 50 and day 7 adds 150.
    // Day 4: 400 + 50 = 450. Day 5: 550, so 500 lands on day 5.
    expect(projectDaysToTargets(0, 8, [500])).toEqual([5])
    // Without the milestones 7 a day (70 XP) needs ceil(500 / 70) = 8 days.
    expect(projectDaysToTargets(0, 7, [500])).toEqual([8])
  })

  it('returns 0 for reached targets and null past the horizon', () => {
    expect(projectDaysToTargets(600, 1, [500, 100000])).toEqual([0, null])
    expect(projectDaysToTargets(0, 0, [500])).toEqual([null])
  })

  it('formats day counts in plain English', () => {
    expect(formatDayCount(0)).toBe('reached')
    expect(formatDayCount(1)).toBe('1 day')
    expect(formatDayCount(45)).toBe('45 days')
    expect(formatDayCount(120)).toBe('about 4 months')
    expect(formatDayCount(1095)).toBe('about 3 years')
    expect(formatDayCount(null)).toBe('over ten years')
  })
})
