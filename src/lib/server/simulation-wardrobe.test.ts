import { describe, expect, it } from 'vitest'
import { seededRandom } from '../avatar/traits'
import { ALL_EQUIPMENT_CATALOG, STARTER_EQUIPMENT_CATALOG_IDS } from '../equipment-seed-data'
import { GEAR_PRICES } from '../gear-variants'
import { equipSlotCategory, type EquipSlotId } from '../chassis-loadout'
import { pickOutfit, pickOutfitStyle, pickPurchase, starterOutfit, type WardrobePiece } from './simulation-wardrobe'

const byId = new Map(ALL_EQUIPMENT_CATALOG.map((c) => [c.id, c]))
const starter: WardrobePiece[] = [...new Set(STARTER_EQUIPMENT_CATALOG_IDS)].map((id) => {
  const c = byId.get(id)!
  return { id, name: c.name, category: c.category, rarity: c.rarity, copies: STARTER_EQUIPMENT_CATALOG_IDS.filter((x) => x === id).length, bought: false }
})
const bought = ALL_EQUIPMENT_CATALOG.find((c) => c.category === 'head' && !STARTER_EQUIPMENT_CATALOG_IDS.includes(c.id))!
const boughtPiece: WardrobePiece = { id: bought.id, name: bought.name, category: bought.category, rarity: bought.rarity, copies: 1, bought: true }

function fitsSlots(outfit: Partial<Record<EquipSlotId, string>>, owned: WardrobePiece[]) {
  for (const [slot, id] of Object.entries(outfit) as [EquipSlotId, string][]) {
    const piece = owned.find((p) => p.id === id)
    expect(piece, `${slot} piece is owned`).toBeTruthy()
    expect(piece!.category).toBe(equipSlotCategory(slot))
  }
  const counts = new Map<string, number>()
  for (const id of Object.values(outfit)) counts.set(id!, (counts.get(id!) ?? 0) + 1)
  for (const [id, n] of counts) expect(n).toBeLessThanOrEqual(owned.find((p) => p.id === id)!.copies)
}

describe('simulation wardrobe', () => {
  it('starter outfit is the seven starter slots', () => {
    expect(Object.keys(starterOutfit())).toHaveLength(7)
    fitsSlots(starterOutfit(), starter)
  })

  it('mixed outfits only use owned pieces in matching slots and never double-book a single copy', () => {
    for (let i = 0; i < 200; i++) {
      const rng = seededRandom(`mix-${i}`)
      const owned = [...starter, boughtPiece]
      fitsSlots(pickOutfit(rng, owned, 'mixed'), owned)
    }
  })

  it('wears a just-bought piece whatever the style', () => {
    for (const style of ['bare', 'starter', 'mixed'] as const) {
      const outfit = pickOutfit(seededRandom(style), [...starter, boughtPiece], style, boughtPiece.id)
      expect(outfit.head).toBe(boughtPiece.id)
    }
  })

  it('rolls every style over many members', () => {
    const rng = seededRandom('styles')
    const seen = new Set(Array.from({ length: 100 }, () => pickOutfitStyle(rng)))
    expect(seen).toEqual(new Set(['bare', 'starter', 'mixed']))
  })

  it('only buys unowned pieces the gems fully cover', () => {
    const market = ALL_EQUIPMENT_CATALOG.filter((c) => !STARTER_EQUIPMENT_CATALOG_IDS.includes(c.id))
    expect(pickPurchase(seededRandom('poor'), 10, market, new Set())).toBeNull()
    for (let i = 0; i < 50; i++) {
      const pick = pickPurchase(seededRandom(`buy-${i}`), 200, market, new Set([bought.id]))
      expect(pick).toBeTruthy()
      expect(GEAR_PRICES[pick!.rarity]).toBeLessThanOrEqual(200)
      expect(pick!.id).not.toBe(bought.id)
    }
  })
})
