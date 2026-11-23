import { describe, expect, it } from 'vitest'
import { ALL_EQUIPMENT_CATALOG } from '../equipment-seed-data'
import { getEquipmentVisual } from '../avatar/equipment'
import { SHAPE_SLOT } from './catalog'
import { GEAR_COLLECTIONS } from './collections'
import { GEAR_PALETTES } from './palettes'
import { GEAR_PIECES } from './pieces'
import { HATS } from './types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/

describe('gear piece definitions', () => {
  it('gives every piece a unique key, id and permanent number', () => {
    const unique = (xs: unknown[]) => new Set(xs).size === xs.length
    expect(unique(GEAR_PIECES.map((p) => p.key))).toBe(true)
    expect(unique(GEAR_PIECES.map((p) => p.id))).toBe(true)
    expect(unique(GEAR_PIECES.map((p) => p.n))).toBe(true)
    expect(unique(ALL_EQUIPMENT_CATALOG.map((c) => c.id))).toBe(true)
    expect(unique(ALL_EQUIPMENT_CATALOG.map((c) => c.slug))).toBe(true)
    for (const p of GEAR_PIECES) expect(p.id, p.key).toMatch(UUID)
  })

  it('keeps permanent numbers in order, so a new piece takes the next one', () => {
    GEAR_PIECES.forEach((p, i) => expect(p.n, p.key).toBe(i + 1))
  })

  it('puts every shape in its own slot, and names a known hat for every hat', () => {
    for (const p of GEAR_PIECES) {
      expect(SHAPE_SLOT[p.shape], p.key).toBe(p.slot)
      if (p.shape === 'hat') expect(HATS, p.key).toContain(p.hat)
      else expect(p.hat, p.key).toBeUndefined()
    }
  })

  it('uses only palettes and collections that exist', () => {
    for (const p of GEAR_PIECES) {
      if (typeof p.colours === 'string') expect(GEAR_PALETTES, p.key).toHaveProperty(p.colours)
      if (p.collection) expect(GEAR_COLLECTIONS.map((c) => c.id), p.key).toContain(p.collection)
    }
    for (const c of GEAR_COLLECTIONS) expect(GEAR_PIECES.some((p) => p.collection === c.id), c.id).toBe(true)
  })

  it('gives every catalog row, rarer versions included, a look the 3D builders can read', () => {
    for (const c of ALL_EQUIPMENT_CATALOG) expect(getEquipmentVisual(c.appearanceKey ?? c.slug), c.slug).toBeDefined()
  })

  it('makes no rarer versions of pieces that opt out', () => {
    for (const p of GEAR_PIECES.filter((x) => x.ladder === false)) {
      expect(ALL_EQUIPMENT_CATALOG.filter((c) => c.slug.startsWith(`${p.key}--`)), p.key).toEqual([])
    }
  })
})
