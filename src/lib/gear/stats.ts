/**
 * Stats for new pieces from their rarity, so a set's numbers sit on the same scale as the rest
 * of the catalog. The primary stat raises the slot's own vector (SLOT_VECTOR); `lean` adds the
 * set's theme as one affix on another vector.
 */
import type { EquipmentAffix, EquipmentCategory, EquipmentRarity } from '../../db/schema'
import { SLOT_VECTOR } from '../vectors'

const PRIMARY: Record<EquipmentRarity, number> = { common: 2, uncommon: 4, rare: 7, epic: 11, legendary: 15 }
const LEAN: Record<EquipmentRarity, number> = { common: 0, uncommon: 2, rare: 2, epic: 3, legendary: 4 }

export function tierStats(
  slot: EquipmentCategory,
  rarity: EquipmentRarity,
  lean: EquipmentAffix['stat'],
): { primaryStat: number; affixes: EquipmentAffix[] } {
  const value = LEAN[rarity]
  // A lean on the slot's own vector would just repeat the primary stat, so it is folded in.
  if (lean === SLOT_VECTOR[slot]) return { primaryStat: PRIMARY[rarity] + value, affixes: [] }
  return { primaryStat: PRIMARY[rarity], affixes: value ? [{ stat: lean, value }] : [] }
}
