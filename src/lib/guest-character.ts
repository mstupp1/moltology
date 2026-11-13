/**
 * A character made by a guest in Customize. It lives in this browser until they sign up; then
 * `guest-character-claim.ts` saves it to the new account.
 */
import { STARTER_EQUIPMENT_CATALOG_IDS, STARTER_EQUIPPED_SLOTS } from './equipment-seed-data'
import { GUEST_CHARACTER_CONFIG_KEY, GUEST_CHARACTER_GEAR_KEY } from './guest-character-key'
import {
  EQUIP_SLOT_IDS,
  VAULT_SIZE,
  type CatalogRef,
  type EquipSlotId,
  type GearItemState,
} from './chassis-loadout'
import { lockAvatarConfig, parseLobsterAvatarConfig, type LobsterAvatarConfig } from './lobster-avatar'

const guestItemId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

/** The starter gear every new member gets, placed the same way, with stable guest-only ids. */
export function guestStarterItems(): GearItemState[] {
  const worn = STARTER_EQUIPPED_SLOTS.length
  return STARTER_EQUIPMENT_CATALOG_IDS.map((catalogItemId, i) => ({
    id: guestItemId(i + 1),
    catalogItemId,
    equippedSlot: i < worn ? (STARTER_EQUIPPED_SLOTS[i] as EquipSlotId) : null,
    vaultIndex: i < worn ? null : i - worn,
  }))
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private windows can refuse storage; the guest simply keeps the draft for this visit.
  }
}

const SLOTS = new Set<string>(EQUIP_SLOT_IDS)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseGear(value: unknown): GearItemState[] | null {
  if (!Array.isArray(value) || value.length > VAULT_SIZE + EQUIP_SLOT_IDS.length) return null
  const items: GearItemState[] = []
  for (const raw of value) {
    const v = raw as Partial<GearItemState> | null
    if (!v || typeof v.id !== 'string' || !UUID.test(v.id)) return null
    if (typeof v.catalogItemId !== 'string' || !UUID.test(v.catalogItemId)) return null
    const slot = v.equippedSlot ?? null
    const index = v.vaultIndex ?? null
    if (slot !== null && !SLOTS.has(slot)) return null
    if (index !== null && (!Number.isInteger(index) || index < 0 || index >= VAULT_SIZE)) return null
    items.push({ id: v.id, catalogItemId: v.catalogItemId, equippedSlot: slot, vaultIndex: index })
  }
  return items
}

export interface GuestCharacter {
  config: LobsterAvatarConfig | null
  items: GearItemState[] | null
}

export function readGuestCharacter(): GuestCharacter {
  return {
    config: parseLobsterAvatarConfig(read(GUEST_CHARACTER_CONFIG_KEY)),
    items: parseGear(read(GUEST_CHARACTER_GEAR_KEY)),
  }
}

export function saveGuestCharacter(config: LobsterAvatarConfig, items: GearItemState[]) {
  const { equipment: _, accessory: __, claws: ___, ...body } = config
  write(GUEST_CHARACTER_CONFIG_KEY, lockAvatarConfig(body))
  write(
    GUEST_CHARACTER_GEAR_KEY,
    items.map(({ id, catalogItemId, equippedSlot, vaultIndex }) => ({
      id,
      catalogItemId,
      equippedSlot,
      vaultIndex,
    })),
  )
}

export function clearGuestCharacter() {
  try {
    window.localStorage.removeItem(GUEST_CHARACTER_CONFIG_KEY)
    window.localStorage.removeItem(GUEST_CHARACTER_GEAR_KEY)
  } catch {
    // Nothing stored or storage blocked.
  }
}

export interface RebasedGear {
  placements: { id: string; equippedSlot: EquipSlotId | null; vaultIndex: number | null }[]
  grants: { id: string; catalogItemId: string }[]
  release: string[]
}

/**
 * Moves the guest's gear layout onto a new member's own gear rows. Each guest piece takes a member
 * row of the same item; a worn piece with no row left becomes a new instance (if the member owns
 * that gear), and member rows the guest let go of are released. Anything else stays where it was.
 */
export function rebaseGuestGear(
  memberItems: GearItemState[],
  catalog: CatalogRef[],
  guestItems: GearItemState[],
  newId: () => string = () => crypto.randomUUID(),
): RebasedGear {
  const gear = new Set(catalog.filter((c) => c.kind === 'gear').map((c) => c.id))
  const pool = new Map<string, GearItemState[]>()
  for (const item of memberItems) pool.set(item.catalogItemId, [...(pool.get(item.catalogItemId) ?? []), item])
  const placements: RebasedGear['placements'] = []
  const grants: RebasedGear['grants'] = []
  for (const g of guestItems) {
    const match = pool.get(g.catalogItemId)?.shift()
    if (match) placements.push({ id: match.id, equippedSlot: g.equippedSlot, vaultIndex: g.vaultIndex })
    else if (g.equippedSlot && gear.has(g.catalogItemId)) {
      const id = newId()
      grants.push({ id, catalogItemId: g.catalogItemId })
      placements.push({ id, equippedSlot: g.equippedSlot, vaultIndex: null })
    }
  }
  const release = [...pool.values()].flat().map((i) => i.id)
  return { placements, grants, release }
}
