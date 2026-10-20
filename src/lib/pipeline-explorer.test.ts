import { describe, it, expect } from 'vitest'
import {
  MAX_DEPTH_M,
  PIPELINE_CLEARANCES,
  clearanceIndexForXp,
  clearanceStatus,
  nextClearanceProgress,
  parseReadingRange,
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

  it('measures progress to the next clearance', () => {
    expect(nextClearanceProgress(0)).toMatchObject({ remainingXp: 500, percent: 0 })
    expect(nextClearanceProgress(250)).toMatchObject({ remainingXp: 250, percent: 50 })
    const progress = nextClearanceProgress(600)
    expect(progress?.next.code).toBe('L-3')
    expect(progress?.remainingXp).toBe(600)
    expect(nextClearanceProgress(100000)).toBeNull()
  })
})
