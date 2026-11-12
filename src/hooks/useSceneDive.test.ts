import { describe, expect, it } from 'vitest'
import { SCENE_DIVE_DISTANCE, sceneDiveFrame } from './useSceneDive'

describe('sceneDiveFrame', () => {
  it('leaves the scene untouched at the top of the page', () => {
    expect(sceneDiveFrame(0)).toEqual({ progress: 0, transform: '', depthOpacity: 0 })
    expect(sceneDiveFrame(-40).progress).toBe(0)
  })

  it('sinks and darkens as the page scrolls, and stops at full depth', () => {
    const half = sceneDiveFrame(SCENE_DIVE_DISTANCE / 2)
    expect(half.progress).toBe(0.5)
    expect(half.transform).toBe('translate3d(0, -4.500%, 0) scale(1.1100)')
    expect(half.depthOpacity).toBe(0.375)
    expect(sceneDiveFrame(SCENE_DIVE_DISTANCE * 3)).toEqual(sceneDiveFrame(SCENE_DIVE_DISTANCE))
  })

  it('always zooms enough to cover the slide, so no edge of the painting shows', () => {
    for (const scroll of [100, 600, 1200, SCENE_DIVE_DISTANCE]) {
      const { progress } = sceneDiveFrame(scroll)
      const slide = progress * 9
      const spare = ((1 + progress * 0.22 - 1) / 2) * 100
      expect(spare).toBeGreaterThanOrEqual(slide)
    }
  })
})
