import { describe, expect, it } from 'vitest'
import { HOME_FAQ, HOME_MELT_MOMENTS, HOME_READINGS, HOME_STEPS, HOME_VOICES } from './content'
import { litMomentForProgress } from './HomeSections'
import { pointerOffset } from './HomeDepth'

describe('homepage content', () => {
  it('picks three member voices that exist in the About content', () => {
    expect(HOME_VOICES.map((v) => v.name)).toEqual(['Shallow Reef 4', 'Pressure Hull', 'Brine Circuit'])
  })

  it('walks a visitor from the diagnostic to the community', () => {
    expect(HOME_STEPS.map((s) => s.actionRoute)).toEqual(['/moltmax', '/dashboard', '/oracle', '/forum'])
    for (const step of HOME_STEPS) {
      expect(step.screenshot.src).toContain('/images/marketing/')
      expect(step.screenshot.srcSm).toContain('/images/marketing/')
    }
  })

  it('says each reading in plain words before its name', () => {
    expect(HOME_READINGS.map((r) => r.name)).toEqual(['Shell Hardness', 'Pincer Torque', 'Submergence Depth'])
    expect(HOME_READINGS.every((r) => r.plain.length > 0 && r.body.length > 0)).toBe(true)
  })

  it('mentions what cannot be bought once, in the pricing answer only', () => {
    const mentions = HOME_FAQ.filter((q) => /cannot be bought/.test(q.answer))
    expect(mentions.map((q) => q.question)).toEqual(['Is it really free?'])
  })
})

describe('litMomentForProgress', () => {
  const count = HOME_MELT_MOMENTS.length

  it('holds the first moment until the list reaches the middle of the screen', () => {
    expect(litMomentForProgress(0, count)).toBe(0)
    expect(litMomentForProgress(0.3, count)).toBe(0)
  })

  it('steps through every moment and stops on the last', () => {
    expect(litMomentForProgress(0.45, count)).toBe(1)
    expect(litMomentForProgress(0.62, count)).toBe(3)
    expect(litMomentForProgress(1, count)).toBe(count - 1)
  })
})

describe('pointerOffset', () => {
  const rect = { left: 100, top: 200, width: 400, height: 200 }

  it('is zero at the centre and half at the edges', () => {
    expect(pointerOffset(300, 300, rect)).toEqual({ x: 0, y: 0 })
    expect(pointerOffset(500, 200, rect)).toEqual({ x: 0.5, y: -0.5 })
  })

  it('clamps outside the element and ignores empty boxes', () => {
    expect(pointerOffset(-1000, 9999, rect)).toEqual({ x: -0.5, y: 0.5 })
    expect(pointerOffset(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 })
  })
})
