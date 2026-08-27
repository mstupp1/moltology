import { describe, it, expect } from 'vitest'
import {
  INITIAL_EQUIPMENT_CATALOG,
  STARTER_EQUIPMENT_CATALOG_IDS,
} from './equipment-seed-data'
import {
  CHASSIS_VISUAL_TYPES,
  EQUIPMENT_CATEGORIES,
  VISUAL_TYPE_SLOT,
  chassisTypeImageUrl,
} from './chassis-loadout'

describe('equipment catalog seed', () => {
  it('keeps a small original stash with at least two pieces per hardpoint', () => {
    expect(INITIAL_EQUIPMENT_CATALOG.length).toBeGreaterThanOrEqual(12)
    expect(INITIAL_EQUIPMENT_CATALOG.length).toBeLessThanOrEqual(30)
    for (const slot of EQUIPMENT_CATEGORIES) {
      const count = INITIAL_EQUIPMENT_CATALOG.filter((item) => item.category === slot).length
      expect(count, `${slot} count`).toBeGreaterThanOrEqual(2)
    }
  })

  it('mixes rarities and seats two to four legendaries with unique powers', () => {
    const rarities = new Set(INITIAL_EQUIPMENT_CATALOG.map((item) => item.rarity))
    expect(rarities.has('common')).toBe(true)
    expect(rarities.has('legendary')).toBe(true)
    const legendaries = INITIAL_EQUIPMENT_CATALOG.filter((item) => item.rarity === 'legendary')
    expect(legendaries.length).toBeGreaterThanOrEqual(2)
    expect(legendaries.length).toBeLessThanOrEqual(4)
    for (const item of legendaries) {
      expect(item.uniquePower?.name).toBeTruthy()
      expect(item.uniquePower?.description).toBeTruthy()
    }
  })

  it('points imageUrl at the visual type file, not a per-item asset', () => {
    const urls = new Set(INITIAL_EQUIPMENT_CATALOG.map((item) => item.imageUrl))
    expect(urls.size).toBeLessThanOrEqual(CHASSIS_VISUAL_TYPES.length)
    for (const item of INITIAL_EQUIPMENT_CATALOG) {
      expect(item.imageUrl).toBe(chassisTypeImageUrl(item.visualType))
      expect(item.imageUrl).toMatch(/^\/images\/chassis\/[a-z]+\.webp$/)
      expect(VISUAL_TYPE_SLOT[item.visualType]).toBe(item.category)
    }
  })

  it('grants a starter stash that includes every legendary', () => {
    const legendaryIds = INITIAL_EQUIPMENT_CATALOG.filter((item) => item.rarity === 'legendary').map(
      (item) => item.id
    )
    for (const id of legendaryIds) {
      expect(STARTER_EQUIPMENT_CATALOG_IDS).toContain(id)
    }
    expect(STARTER_EQUIPMENT_CATALOG_IDS.length).toBeGreaterThanOrEqual(8)
    expect(STARTER_EQUIPMENT_CATALOG_IDS.length).toBeLessThanOrEqual(20)
  })

  it('does not ship Diablo names in the catalog', () => {
    const blob = JSON.stringify(INITIAL_EQUIPMENT_CATALOG).toLowerCase()
    expect(blob).not.toMatch(/diablo|blizzard|barber|andariel|shako|harlequin|tyrael|inarius/)
  })
})
