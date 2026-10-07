import { describe, expect, it } from 'vitest'
import { activeStepForProgress, clamp01, computeScrollProgress } from './motion'
import { depthReadout, MAX_STORY_DEPTH_M } from './StoryPrimitives'

describe('computeScrollProgress', () => {
  it('runs 0 to 1 as an element passes through the viewport', () => {
    expect(computeScrollProgress('through', 800, 400, 800)).toBe(0)
    expect(computeScrollProgress('through', 200, 400, 800)).toBeCloseTo(0.5)
    expect(computeScrollProgress('through', -400, 400, 800)).toBe(1)
  })

  it('tracks the pinned travel of a tall section below the chrome offset', () => {
    // 2000px section, 800px viewport, 100px of fixed chrome: 1300px of travel.
    expect(computeScrollProgress('pin', 100, 2000, 800, 100)).toBe(0)
    expect(computeScrollProgress('pin', -550, 2000, 800, 100)).toBeCloseTo(0.5)
    expect(computeScrollProgress('pin', -1200, 2000, 800, 100)).toBe(1)
    expect(computeScrollProgress('pin', 500, 2000, 800, 100)).toBe(0)
  })

  it('handles sections shorter than the viewport', () => {
    expect(computeScrollProgress('pin', 50, 300, 800)).toBe(0)
    expect(computeScrollProgress('pin', -10, 300, 800)).toBe(1)
  })
})

describe('activeStepForProgress', () => {
  it('splits progress evenly across steps and never overflows', () => {
    expect(activeStepForProgress(0, 5)).toBe(0)
    expect(activeStepForProgress(0.39, 5)).toBe(1)
    expect(activeStepForProgress(1, 5)).toBe(4)
    expect(activeStepForProgress(0.5, 0)).toBe(0)
  })
})

describe('clamp01', () => {
  it('clamps and treats NaN as zero', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(Number.NaN)).toBe(0)
  })
})

describe('depthReadout', () => {
  it('maps page progress onto the dive', () => {
    expect(depthReadout(0)).toEqual({ meters: 0, zone: 'Surface' })
    expect(depthReadout(0.5).zone).toBe('Midnight zone')
    expect(depthReadout(1)).toEqual({ meters: MAX_STORY_DEPTH_M, zone: 'Benthic floor' })
  })
})
