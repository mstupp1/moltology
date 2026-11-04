import { describe, expect, it } from 'vitest'
import { outlineHalfAt } from './geometry'
import { EQUIPMENT_VISUALS } from './equipment'
import { HAT_FIT, LOBSTER_SHOULDER, hatKind, hatPlacement, headGeometry, lobsterBodyFit, type CharacterSpec } from './races'
import { AVATAR_BUILDS, AVATAR_HEAD_SHAPES } from './traits'

const spec = (race: 'lobster' | 'crab', headShape: string, build: string, heightScale = 1) =>
  ({ race, headShape, build, eyeShape: 'round', heightScale }) as unknown as CharacterSpec

const hats = Object.values(EQUIPMENT_VISUALS).filter((v) => v.category === 'head')
const combos = (['lobster', 'crab'] as const).flatMap((race) =>
  AVATAR_HEAD_SHAPES.flatMap((headShape) => AVATAR_BUILDS.map((build) => ({ race, headShape, build }))),
)

describe('hat fit sweep', () => {
  for (const { race, headShape, build } of combos) {
    it(`${race} ${headShape}/${build}: every hat rests on the head`, () => {
      const g = headGeometry(spec(race, headShape, build))
      const eyeTop = g.eyeY - g.eye.ry
      for (const hat of hats) {
        const kind = hatKind(hat.key)
        const p = hatPlacement(kind, g)
        const label = `${hat.key} on ${race} ${headShape}/${build}`
        const fit = HAT_FIT[kind]
        if (fit) {
          // The brim sits on the head, between its top and the middle of the eyes.
          expect(p.y, label).toBeGreaterThan(g.crown)
          expect(p.y, label).toBeLessThanOrEqual(g.eyeY)
          // It wraps the head's real width there, so no head shows past the band.
          expect(fit.half * p.sx + 0.5, label).toBeGreaterThanOrEqual(Math.min(g.halfAt(p.y), fit.half * 1.7))
          // Domed hats reach the head top instead of perching on the forehead.
          if (fit.dome > 0) expect(p.y - fit.dome * p.sy, label).toBeLessThanOrEqual(g.crown + 1)
        } else if (kind === 'crown') {
          // Its base bites into the head top: no gap under the crown.
          expect(p.y - g.crown, label).toBeGreaterThan(0)
          expect(p.y - g.crown, label).toBeLessThan(eyeTop - g.crown + 6)
        } else if (kind === 'bow') {
          // The knot is on (or just over) the head's edge, never out in the air.
          expect(Math.abs(p.x - 50) - g.halfAt(p.y), label).toBeLessThan(12)
        } else if (kind === 'halo') {
          // A small fixed gap above whatever is highest, the head or the eyes.
          const gap = Math.min(g.crown, eyeTop) - p.y
          expect(gap, label).toBeGreaterThanOrEqual(4)
          expect(gap, label).toBeLessThanOrEqual(14)
        }
      }
    })
  }
})

describe('lobster torso sweep', () => {
  for (const headShape of AVATAR_HEAD_SHAPES)
    for (const build of AVATAR_BUILDS)
      for (const height of [0.85, 1, 1.15])
        it(`${headShape}/${build} at ${height}: the torso tucks under the head and arms`, () => {
          const fit = lobsterBodyFit(spec('lobster', headShape, build, height))
          // The torso's top corners stay inside the head's outline at the neck.
          expect(fit.neckHalf).toBeLessThanOrEqual(fit.headHalfAtNeck)
          // The arm roots at or outside the torso edge, so the body never shows past the arm.
          expect(LOBSTER_SHOULDER[0] + fit.shoulderDx).toBeLessThanOrEqual(fit.torsoEdge + 0.01)
          expect(outlineHalfAt(fit.torsoPath, fit.top + 1)).toBeLessThanOrEqual(fit.headHalfAtNeck)
        })
})
