import { describe, expect, it } from 'vitest'
import {
  ALL_EQUIPMENT_CATALOG,
  STARTER_EQUIPMENT_CATALOG_IDS,
  STARTER_EQUIPPED_SLOTS,
} from './equipment-seed-data'
import { equipmentAppearance, validateCharacterPlacements } from './character-appearance'
import { getEquipmentVisual } from './avatar/equipment'
import { parseLobsterAvatarConfig } from './lobster-avatar'
import type { GearItemState } from './chassis-loadout'
const catalog = ALL_EQUIPMENT_CATALOG
const items: GearItemState[] = STARTER_EQUIPMENT_CATALOG_IDS.map((id, i) => ({
  id: `item-${i}`,
  catalogItemId: id,
  equippedSlot: i < 7 ? STARTER_EQUIPPED_SLOTS[i] : null,
  vaultIndex: i < 7 ? null : i - 7,
}))
describe('equipped character contract', () => {
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
})
