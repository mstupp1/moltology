import {
  ALL_EQUIPMENT_CATALOG,
  STARTER_EQUIPMENT_CATALOG_IDS,
  STARTER_EQUIPPED_SLOTS,
} from '../equipment-seed-data'
import type { EquippedAppearance } from '../character-appearance'
/** Same seven initial placements as initialize_character; also usable in guest previews. */
export const STARTER_CHARACTER_EQUIPMENT: EquippedAppearance = Object.fromEntries(
  STARTER_EQUIPPED_SLOTS.map((slot, i) => {
    const c = ALL_EQUIPMENT_CATALOG.find((c) => c.id === STARTER_EQUIPMENT_CATALOG_IDS[i])!
    return [slot, { visualKey: c.appearanceKey || c.slug, rarity: c.rarity }]
  }),
)
