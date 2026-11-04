import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getEquipmentVisual } from './avatar/equipment'
import { BASE_EQUIPMENT_CATALOG, VARIANT_EQUIPMENT_CATALOG } from './equipment-seed-data'
import { GEAR_PRICES, RARITY_ORDER, parseVariantKey, variantKey } from './gear-variants'

describe('gear variants', () => {
  it('gives every base piece each rarity above its own', () => {
    for (const base of BASE_EQUIPMENT_CATALOG) {
      const tiers = VARIANT_EQUIPMENT_CATALOG.filter(
        (v) => parseVariantKey(v.appearanceKey!).baseKey === (base.appearanceKey ?? base.slug),
      ).map((v) => v.rarity)
      expect(tiers).toEqual(RARITY_ORDER.slice(RARITY_ORDER.indexOf(base.rarity) + 1))
    }
  })

  it('has unique ids and a drawing for every variant', () => {
    const ids = new Set([...BASE_EQUIPMENT_CATALOG, ...VARIANT_EQUIPMENT_CATALOG].map((c) => c.id))
    expect(ids.size).toBe(BASE_EQUIPMENT_CATALOG.length + VARIANT_EQUIPMENT_CATALOG.length)
    for (const v of VARIANT_EQUIPMENT_CATALOG) {
      const visual = getEquipmentVisual(v.appearanceKey!)
      expect(visual?.category).toBe(v.category)
    }
  })

  it('makes rarer versions stronger and gives epic and legendary an ability', () => {
    for (const v of VARIANT_EQUIPMENT_CATALOG) {
      const base = BASE_EQUIPMENT_CATALOG.find(
        (b) => (b.appearanceKey ?? b.slug) === parseVariantKey(v.appearanceKey!).baseKey,
      )!
      expect(v.primaryStat).toBeGreaterThan(base.primaryStat)
      if (v.rarity === 'epic' || v.rarity === 'legendary') expect(v.uniquePower).not.toBeNull()
    }
  })

  it('prices climb with rarity', () => {
    const prices = RARITY_ORDER.map((r) => GEAR_PRICES[r])
    expect([...prices].sort((a, b) => a - b)).toEqual(prices)
  })

  it('round-trips variant keys and leaves plain keys alone', () => {
    expect(parseVariantKey(variantKey('creator-crown', 'epic'))).toEqual({ baseKey: 'creator-crown', rarity: 'epic' })
    expect(parseVariantKey('creator-crown')).toEqual({ baseKey: 'creator-crown', rarity: null })
  })

  it('ships every variant in the catalog migration', () => {
    const sql = readFileSync('drizzle/0058_gear_unlocks_and_variants.sql', 'utf8')
    for (const v of VARIANT_EQUIPMENT_CATALOG) {
      expect(sql).toContain(`'${v.id}'::uuid,'${v.slug}'`)
    }
  })
})
