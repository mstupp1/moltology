import type { EquipmentCategory, EquipmentRarity } from '../db/schema'

export type { EquipmentCategory, EquipmentRarity }

export const VAULT_SIZE = 20

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  'carapace',
  'claws',
  'head',
  'legs',
  'antennae',
]

export const EQUIPMENT_RARITIES: EquipmentRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
]

export type LoadoutStatKey =
  | 'defense'
  | 'attack'
  | 'intelligence'
  | 'speed'
  | 'perception'

export const CATEGORY_TO_STAT: Record<EquipmentCategory, LoadoutStatKey> = {
  carapace: 'defense',
  claws: 'attack',
  head: 'intelligence',
  legs: 'speed',
  antennae: 'perception',
}

export const STAT_LABELS: Record<LoadoutStatKey, string> = {
  defense: 'Defense',
  attack: 'Attack',
  intelligence: 'Intelligence',
  speed: 'Speed',
  perception: 'Perception',
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  carapace: 'Carapace',
  claws: 'Claws',
  head: 'Head',
  legs: 'Legs',
  antennae: 'Antennae',
}

export const RARITY_LABELS: Record<EquipmentRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

/** Tailwind / HUD border + text accents for rarity. */
export const RARITY_STYLES: Record<
  EquipmentRarity,
  { border: string; text: string; glow: string; bar: string }
> = {
  common: {
    border: 'border-[#8a9494]',
    text: 'text-[#b8c0c0]',
    glow: 'shadow-[0_0_8px_rgba(138,148,148,0.25)]',
    bar: 'bg-[#8a9494]/30',
  },
  uncommon: {
    border: 'border-[#39ff14]',
    text: 'text-[#39ff14]',
    glow: 'shadow-[0_0_10px_rgba(57,255,20,0.3)]',
    bar: 'bg-[#39ff14]/25',
  },
  rare: {
    border: 'border-[#3b82f6]',
    text: 'text-[#60a5fa]',
    glow: 'shadow-[0_0_10px_rgba(59,130,246,0.35)]',
    bar: 'bg-[#3b82f6]/25',
  },
  epic: {
    border: 'border-[#a855f7]',
    text: 'text-[#c084fc]',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    bar: 'bg-[#a855f7]/25',
  },
  legendary: {
    border: 'border-[#f59e0b]',
    text: 'text-[#fbbf24]',
    glow: 'shadow-[0_0_14px_rgba(245,158,11,0.45)]',
    bar: 'bg-[#f59e0b]/30',
  },
}

export interface CatalogRef {
  id: string
  slug: string
  name: string
  flavorText: string
  category: EquipmentCategory
  rarity: EquipmentRarity
  primaryStat: number
  imageUrl?: string | null
  sortOrder: number
}

export interface GearItemState {
  id: string
  catalogItemId: string
  equippedSlot: EquipmentCategory | null
  vaultIndex: number | null
}

export type LoadoutTotals = Record<LoadoutStatKey, number>

export function emptyTotals(): LoadoutTotals {
  return {
    defense: 0,
    attack: 0,
    intelligence: 0,
    speed: 0,
    perception: 0,
  }
}

export function computeLoadoutTotals(
  items: GearItemState[],
  catalogById: Map<string, CatalogRef> | Record<string, CatalogRef>
): LoadoutTotals {
  const totals = emptyTotals()
  const lookup =
    catalogById instanceof Map
      ? (id: string) => catalogById.get(id)
      : (id: string) => catalogById[id]

  for (const item of items) {
    if (!item.equippedSlot) continue
    const cat = lookup(item.catalogItemId)
    if (!cat) continue
    const stat = CATEGORY_TO_STAT[item.equippedSlot]
    totals[stat] += cat.primaryStat
  }
  return totals
}

export function findFirstFreeVaultIndex(
  items: GearItemState[],
  vaultSize: number = VAULT_SIZE
): number | null {
  const occupied = new Set(
    items
      .filter((i) => i.vaultIndex !== null && i.vaultIndex !== undefined)
      .map((i) => i.vaultIndex as number)
  )
  for (let i = 0; i < vaultSize; i++) {
    if (!occupied.has(i)) return i
  }
  return null
}

export type MoveTarget =
  | { type: 'equip'; slot: EquipmentCategory }
  | { type: 'vault'; index: number }

export interface MovePlanUpdate {
  id: string
  equippedSlot: EquipmentCategory | null
  vaultIndex: number | null
}

export interface MovePlanResult {
  ok: true
  updates: MovePlanUpdate[]
}

export interface MovePlanError {
  ok: false
  error: string
}

/**
 * Pure move planner for vault ↔ equip. Does not mutate inputs.
 */
export function planGearMove(
  items: GearItemState[],
  catalogById: Map<string, CatalogRef> | Record<string, CatalogRef>,
  itemId: string,
  target: MoveTarget,
  vaultSize: number = VAULT_SIZE
): MovePlanResult | MovePlanError {
  const lookup =
    catalogById instanceof Map
      ? (id: string) => catalogById.get(id)
      : (id: string) => catalogById[id]

  const moving = items.find((i) => i.id === itemId)
  if (!moving) return { ok: false, error: 'Gear item not found in loadout.' }

  const movingCatalog = lookup(moving.catalogItemId)
  if (!movingCatalog) return { ok: false, error: 'Catalog entry missing for gear.' }

  if (target.type === 'equip') {
    if (movingCatalog.category !== target.slot) {
      return {
        ok: false,
        error: `${CATEGORY_LABELS[movingCatalog.category]} gear cannot occupy the ${CATEGORY_LABELS[target.slot]} slot.`,
      }
    }

    // Already in this slot — no-op
    if (moving.equippedSlot === target.slot) {
      return { ok: true, updates: [] }
    }

    const occupant = items.find(
      (i) => i.id !== moving.id && i.equippedSlot === target.slot
    )

    if (!occupant) {
      return {
        ok: true,
        updates: [
          {
            id: moving.id,
            equippedSlot: target.slot,
            vaultIndex: null,
          },
        ],
      }
    }

    // Swap: occupant takes mover's prior location
    if (moving.equippedSlot) {
      return {
        ok: true,
        updates: [
          { id: moving.id, equippedSlot: target.slot, vaultIndex: null },
          {
            id: occupant.id,
            equippedSlot: moving.equippedSlot,
            vaultIndex: null,
          },
        ],
      }
    }

    // Mover from vault: occupant goes to mover's vault cell (or free cell)
    const returnIndex =
      moving.vaultIndex !== null && moving.vaultIndex !== undefined
        ? moving.vaultIndex
        : findFirstFreeVaultIndex(
            items.filter((i) => i.id !== moving.id && i.id !== occupant.id),
            vaultSize
          )

    if (returnIndex === null) {
      return { ok: false, error: 'Vault is full. Free a cell before swapping.' }
    }

    return {
      ok: true,
      updates: [
        { id: moving.id, equippedSlot: target.slot, vaultIndex: null },
        {
          id: occupant.id,
          equippedSlot: null,
          vaultIndex: returnIndex,
        },
      ],
    }
  }

  // target.type === 'vault'
  if (target.index < 0 || target.index >= vaultSize) {
    return { ok: false, error: 'Vault cell is out of range.' }
  }

  // Already in this vault cell
  if (moving.vaultIndex === target.index && moving.equippedSlot === null) {
    return { ok: true, updates: [] }
  }

  const cellOccupant = items.find(
    (i) => i.id !== moving.id && i.vaultIndex === target.index
  )

  if (!cellOccupant) {
    return {
      ok: true,
      updates: [
        {
          id: moving.id,
          equippedSlot: null,
          vaultIndex: target.index,
        },
      ],
    }
  }

  // Swap vault cells, or swap vault ↔ equip
  if (moving.equippedSlot) {
    return {
      ok: true,
      updates: [
        { id: moving.id, equippedSlot: null, vaultIndex: target.index },
        {
          id: cellOccupant.id,
          equippedSlot: moving.equippedSlot,
          vaultIndex: null,
        },
      ],
    }
  }

  // Vault ↔ vault swap
  const fromIndex = moving.vaultIndex
  if (fromIndex === null || fromIndex === undefined) {
    return { ok: false, error: 'Cannot rearrange gear without a vault origin.' }
  }

  return {
    ok: true,
    updates: [
      { id: moving.id, equippedSlot: null, vaultIndex: target.index },
      { id: cellOccupant.id, equippedSlot: null, vaultIndex: fromIndex },
    ],
  }
}

export function applyMoveUpdates(
  items: GearItemState[],
  updates: MovePlanUpdate[]
): GearItemState[] {
  if (updates.length === 0) return items
  const byId = new Map(updates.map((u) => [u.id, u]))
  return items.map((item) => {
    const u = byId.get(item.id)
    if (!u) return item
    return {
      ...item,
      equippedSlot: u.equippedSlot,
      vaultIndex: u.vaultIndex,
    }
  })
}

export interface ChassisLoadoutPayload {
  catalog: CatalogRef[]
  items: GearItemState[]
  totals: LoadoutTotals
  vaultSize: number
}

let chassisLoadoutCache: { userId: string; payload: ChassisLoadoutPayload } | null = null

/** Session-scoped cache so HUD route remounts do not flash loaders. */
export function getCachedChassisLoadout(userId: string): ChassisLoadoutPayload | null {
  if (chassisLoadoutCache?.userId === userId) return chassisLoadoutCache.payload
  return null
}

export function setCachedChassisLoadout(userId: string, payload: ChassisLoadoutPayload): void {
  chassisLoadoutCache = { userId, payload }
}

export function clearChassisLoadoutCache(): void {
  chassisLoadoutCache = null
}
