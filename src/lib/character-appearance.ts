import type { LobsterAvatarConfig } from './lobster-avatar'
import type { CatalogRef, EquipSlotId, GearItemState } from './chassis-loadout'
import { EQUIP_SLOT_IDS, equipSlotCategory, VAULT_SIZE } from './chassis-loadout'
import type { EquipmentRarity } from '../db/schema'

export const EQUIPMENT_VERSION = 1
export type EquippedAppearance = Partial<
  Record<EquipSlotId, { visualKey: string; rarity: EquipmentRarity }>
>
export interface CharacterAppearance {
  config: LobsterAvatarConfig
  equipment: EquippedAppearance
}
export interface CharacterPlacement {
  id: string
  equippedSlot: EquipSlotId | null
  vaultIndex: number | null
}

export function equipmentAppearance(
  items: GearItemState[],
  catalog: CatalogRef[],
): EquippedAppearance {
  const byId = new Map(catalog.map((c) => [c.id, c]))
  const result: EquippedAppearance = {}
  for (const item of items) {
    const c = byId.get(item.catalogItemId)
    if (item.equippedSlot && c && c.kind !== 'cosmetic') {
      result[item.equippedSlot] = { visualKey: c.appearanceKey || c.slug, rarity: c.rarity }
    }
  }
  return result
}

/** A complete placement list prevents item loss and accidental duplicate ownership. */
export function validateCharacterPlacements(
  owned: GearItemState[],
  catalog: CatalogRef[],
  placements: CharacterPlacement[],
): string | null {
  if (placements.length !== owned.length) return 'Include every owned item when saving.'
  const byId = new Map(owned.map((i) => [i.id, i]))
  const cats = new Map(catalog.map((c) => [c.id, c]))
  const ids = new Set<string>(),
    slots = new Set<string>(),
    cells = new Set<number>()
  for (const p of placements) {
    const item = byId.get(p.id),
      c = item && cats.get(item.catalogItemId)
    if (!item || !c || c.kind === 'cosmetic' || ids.has(p.id))
      return 'Invalid or unowned equipment.'
    ids.add(p.id)
    if (p.equippedSlot !== null) {
      if (
        !EQUIP_SLOT_IDS.includes(p.equippedSlot) ||
        equipSlotCategory(p.equippedSlot) !== c.category ||
        slots.has(p.equippedSlot) ||
        p.vaultIndex !== null
      )
        return 'Equipment does not fit this slot.'
      slots.add(p.equippedSlot)
    } else {
      if (
        p.vaultIndex === null ||
        !Number.isInteger(p.vaultIndex) ||
        p.vaultIndex < 0 ||
        p.vaultIndex >= VAULT_SIZE ||
        cells.has(p.vaultIndex)
      )
        return 'Invalid vault placement.'
      cells.add(p.vaultIndex)
    }
  }
  return null
}
