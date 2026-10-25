import { describe, expect, it } from 'vitest'
import {
  ALL_EQUIPMENT_CATALOG,
  STARTER_EQUIPMENT_CATALOG_IDS,
  STARTER_EQUIPPED_SLOTS,
} from './equipment-seed-data'
import { equipmentAppearance, validateCharacterPlacements } from './character-appearance'
import { EQUIPMENT_VISUALS, equipmentThumbnail } from './avatar/equipment'
import { generateLobsterAvatarSvg, parseLobsterAvatarConfig } from './lobster-avatar'
import type { GearItemState } from './chassis-loadout'
const catalog = ALL_EQUIPMENT_CATALOG
const items: GearItemState[] = STARTER_EQUIPMENT_CATALOG_IDS.map((id, i) => ({
  id: `item-${i}`,
  catalogItemId: id,
  equippedSlot: i < 7 ? STARTER_EQUIPPED_SLOTS[i] : null,
  vaultIndex: i < 7 ? null : i - 7,
}))
describe('equipped character contract', () => {
  it('registers compatible worn geometry and unique thumbnails for every catalog item', () => {
    const thumbnails = new Set<string>()
    for (const c of catalog) {
      expect(EQUIPMENT_VISUALS[c.appearanceKey || c.slug]?.category).toBe(c.category)
      const thumb = equipmentThumbnail(c.appearanceKey || c.slug)!
      const svg = decodeURIComponent(thumb.split(',')[1])
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
      expect(doc.querySelector('parsererror')).toBeNull()
      expect(svg).toContain(`data-equipment="${c.slug}"`)
      thumbnails.add(thumb)
    }
    expect(thumbnails.size).toBe(catalog.length)
  })
  it('grants only common equipment with two instances of every claw and 19 total', () => {
    expect(items).toHaveLength(19)
    expect(items.filter((i) => i.equippedSlot)).toHaveLength(7)
    for (const id of STARTER_EQUIPMENT_CATALOG_IDS)
      expect(catalog.find((c) => c.id === id)?.rarity).toBe('common')
    for (const c of catalog.filter(
      (c) => c.category === 'claws' && STARTER_EQUIPMENT_CATALOG_IDS.includes(c.id),
    ))
      expect(items.filter((i) => i.catalogItemId === c.id)).toHaveLength(2)
    expect(validateCharacterPlacements(items, catalog, items)).toBeNull()
    expect(
      validateCharacterPlacements(
        items,
        catalog,
        items.map((i, n) => ({ ...i, equippedSlot: null, vaultIndex: n })),
      ),
    ).toBeNull()
  })
  it('rejects missing, duplicate, unowned, incompatible, and invalid vault placements', () => {
    expect(validateCharacterPlacements(items, catalog, items.slice(1))).not.toBeNull()
    expect(
      validateCharacterPlacements(items, catalog, [items[1], ...items.slice(1)]),
    ).not.toBeNull()
    expect(
      validateCharacterPlacements(
        items,
        catalog,
        items.map((i, n) => (n ? i : { ...i, id: 'unowned' })),
      ),
    ).not.toBeNull()
    expect(
      validateCharacterPlacements(
        items,
        catalog,
        items.map((i, n) => (n ? i : { ...i, equippedSlot: 'head' })),
      ),
    ).not.toBeNull()
    expect(
      validateCharacterPlacements(
        items,
        catalog,
        items.map((i, n) => (n ? i : { ...i, equippedSlot: null, vaultIndex: 20 })),
      ),
    ).not.toBeNull()
  })
  it('renders both species with six walking legs and distinct independent pincer equipment', () => {
    const equipment = equipmentAppearance(items, catalog)
    equipment['claws-1'] = { visualKey: 'silt-maul', rarity: 'uncommon' }
    equipment['claws-2'] = { visualKey: 'creator-mitten', rarity: 'common' }
    for (const race of ['lobster', 'crab'] as const) {
      for (const pose of ['rest', 'wave', 'cheer', 'flex'] as const) {
        const config = {
          style: 'critters' as const,
          seed: 'anatomy',
          race,
          pose,
          equipment,
          transparentBackground: true,
        }
        const svg = generateLobsterAvatarSvg(config, 512, { staticMotion: true })!
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        expect(doc.querySelector('parsererror')).toBeNull()
        expect(doc.querySelectorAll('[data-walking-leg]')).toHaveLength(6)
        expect(doc.querySelector('[data-equipment="silt-maul"]')).not.toBeNull()
        expect(doc.querySelector('[data-equipment="creator-mitten"]')).not.toBeNull()
        const ids = [...doc.querySelectorAll('[id]')].map((e) => e.id)
        expect(new Set(ids).size).toBe(ids.length)
        const portrait = generateLobsterAvatarSvg(config, 128, { frame: 'portrait' })!
        expect(portrait).toContain('data-equipment="silt-maul"')
        expect(portrait).not.toMatch(/<animate(?:Transform)?\b/)
        expect(generateLobsterAvatarSvg(config, 512, { staticMotion: true })).toBe(svg)
      }
    }
  })
  it('includes equipped visuals in cache keys and rejects unknown visual snapshots', () => {
    const base = { style: 'critters' as const, seed: 'cache', race: 'crab' as const }
    const one = generateLobsterAvatarSvg({
      ...base,
      equipment: { head: { visualKey: 'creator-bow', rarity: 'common' } },
    })
    const two = generateLobsterAvatarSvg({
      ...base,
      equipment: { head: { visualKey: 'creator-crown', rarity: 'common' } },
    })
    expect(one).not.toBe(two)
    expect(
      parseLobsterAvatarConfig({
        ...base,
        equipment: {
          head: { visualKey: '<script>', rarity: 'common' },
          belt: { visualKey: 'silt-maul', rarity: 'rare' },
        },
      })?.equipment,
    ).toEqual({})
  })
})
