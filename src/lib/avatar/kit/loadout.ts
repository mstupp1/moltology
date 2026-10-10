/**
 * What a member is wearing, packed into one short string on `profiles.avatarConfig.loadout`
 * so any page that has the avatar config can draw gear and looks without loading the vault.
 *
 * Format: `;`-separated entries.
 *   gear  `<equipSlot>=<visualType>.<rarity>`   e.g. `claws-1=pincer.epic`
 *   look  `@<category>=<artKey>`                e.g. `@head=reef-crown`
 *
 * The server writes it whenever gear, looks, or the avatar change. Clients never send it.
 */
import type { ChassisVisualType, EquipmentCategory, EquipmentRarity, EquipSlotId } from '../../../db/schema'

export const KIT_EQUIP_SLOTS = ['head', 'carapace', 'claws-1', 'claws-2', 'belt', 'legs', 'antennae'] as const satisfies readonly EquipSlotId[]
export const KIT_LOOK_CATEGORIES = ['head', 'carapace', 'claws', 'belt', 'legs', 'antennae'] as const satisfies readonly EquipmentCategory[]
export type KitLookCategory = (typeof KIT_LOOK_CATEGORIES)[number]

const VISUAL_TYPES: readonly ChassisVisualType[] = ['helm', 'carapace', 'pincer', 'hammer', 'antennae', 'greaves', 'belt']
const RARITIES: readonly EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const ART_KEY = /^[a-z0-9][a-z0-9-]{0,47}$/

export interface KitGearVisual {
  visual: ChassisVisualType
  rarity: EquipmentRarity
}

export interface KitLoadout {
  gear: Partial<Record<EquipSlotId, KitGearVisual>>
  look: Partial<Record<KitLookCategory, string>>
}

export const EMPTY_KIT_LOADOUT: KitLoadout = Object.freeze({ gear: {}, look: {} }) as KitLoadout

export function isKitArtKey(value: unknown): value is string {
  return typeof value === 'string' && ART_KEY.test(value)
}

export function serializeKitLoadout(loadout: KitLoadout): string {
  const parts: string[] = []
  for (const slot of KIT_EQUIP_SLOTS) {
    const g = loadout.gear[slot]
    if (g) parts.push(`${slot}=${g.visual}.${g.rarity}`)
  }
  for (const category of KIT_LOOK_CATEGORIES) {
    const art = loadout.look[category]
    if (art && isKitArtKey(art)) parts.push(`@${category}=${art}`)
  }
  return parts.join(';')
}

export function parseKitLoadout(raw: unknown): KitLoadout {
  if (typeof raw !== 'string' || !raw) return { gear: {}, look: {} }
  const out: KitLoadout = { gear: {}, look: {} }
  for (const entry of raw.split(';').slice(0, 32)) {
    const eq = entry.indexOf('=')
    if (eq <= 0) continue
    const key = entry.slice(0, eq)
    const value = entry.slice(eq + 1)
    if (key.startsWith('@')) {
      const category = key.slice(1) as KitLookCategory
      if ((KIT_LOOK_CATEGORIES as readonly string[]).includes(category) && isKitArtKey(value)) {
        out.look[category] = value
      }
      continue
    }
    if (!(KIT_EQUIP_SLOTS as readonly string[]).includes(key)) continue
    const [visual, rarity] = value.split('.')
    if (VISUAL_TYPES.includes(visual as ChassisVisualType) && RARITIES.includes(rarity as EquipmentRarity)) {
      out.gear[key as EquipSlotId] = { visual: visual as ChassisVisualType, rarity: rarity as EquipmentRarity }
    }
  }
  return out
}
