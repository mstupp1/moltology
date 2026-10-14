import { describe, expect, it } from 'vitest'
import { badgeFrame, introBadges, makeBadge, spawnAngle } from './badges'
import { mulberry32 } from './shell'
import { staticWeight } from './engine'

describe('hero alert badges', () => {
  it('spawns away from the copy: right of the shell on wide layouts, below it on phones', () => {
    const rand = mulberry32(1)
    for (let i = 0; i < 200; i++) {
      expect(Math.cos(spawnAngle(rand, false))).toBeGreaterThan(0.3)
      expect(Math.sin(spawnAngle(rand, true))).toBeGreaterThan(-0.2)
    }
  })

  it('spreads the opening set across the range and absorbs them in order after the hold', () => {
    const badges = introBadges(5, mulberry32(2), false, 1.1)
    expect(badges).toHaveLength(5)
    const angles = badges.map((b) => Math.atan2(b.oy / 0.85, b.ox / 1.15)).sort((a, b) => a - b)
    for (let i = 1; i < angles.length; i++) expect(angles[i] - angles[i - 1]).toBeGreaterThan(0.05)
    for (let i = 0; i < badges.length; i++) {
      expect(badges[i].absorbAt).toBeGreaterThan(1.1)
      if (i > 0) expect(badges[i].absorbAt).toBeGreaterThan(badges[i - 1].absorbAt)
      expect(badges[i].born).toBeLessThan(badges[i].absorbAt)
    }
  })

  it('is hidden before it is born and after it is absorbed, and shrinks into the shell', () => {
    const b = makeBadge('warning', mulberry32(3), false, 1, 3)
    expect(badgeFrame(b, 0.5)).toBeNull()
    expect(badgeFrame(b, 3 + b.pull + 0.01)).toBeNull()
    const hovering = badgeFrame(b, 2)!
    expect(hovering.scale).toBeCloseTo(1)
    const late = badgeFrame(b, 3 + b.pull * 0.95)!
    expect(late.scale).toBeLessThan(0.35)
    expect(late.alpha).toBeLessThan(0.15)
    expect(Math.hypot(late.x - b.tx, late.y - b.ty)).toBeLessThan(0.1)
  })
})

describe('staticWeight', () => {
  it('keeps static near the shell and fades it out before it reaches the copy', () => {
    expect(staticWeight(0, 0, 300)).toBe(1)
    expect(staticWeight(300, 0, 300)).toBe(1)
    expect(staticWeight(-560, 0, 300)).toBeLessThan(0.3)
    expect(staticWeight(-600, 0, 300)).toBe(0)
  })
})
