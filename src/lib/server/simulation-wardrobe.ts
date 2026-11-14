/**
 * Simulated members' gear: they shop the market with their gems and change what they wear.
 *
 * Shopping goes through the real market purchase (`buyGear`), but only when the member's gem
 * ledger covers the whole price, so a bot never spends Molt Credits. Dressing writes the same
 * rows a member's own save does and commits through `commit_character`, which recomputes the
 * worn look (`equippedAppearance`) and bumps the appearance revision.
 *
 * Real members are never touched: every entry point re-checks `isSimulated`.
 */
import { and, eq, sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { equipmentCatalog, gearUnlocks, profiles, userGearItems } from '../../db/schema'
import { getEquipmentVisual } from '../avatar/equipment'
import { LOBSTER_AVATAR_STYLE } from '../lobster-avatar'
import { EQUIP_SLOT_IDS, equipSlotCategory, type EquipSlotId } from '../chassis-loadout'
import { STARTER_EQUIPMENT_CATALOG_IDS, STARTER_EQUIPPED_SLOTS } from '../equipment-seed-data'
import { GEAR_PRICES } from '../gear-variants'
import type { EquipmentCategory, EquipmentRarity } from '../../db/schema'
import { buyGear } from './market'

type Db = ReturnType<typeof getDb>
type Rng = () => number

/** Per member, per tick. A weekly run is 14 ticks, so a bot shops about 1.7 times a week when it can afford something. */
export const WARDROBE_SHOP_CHANCE = 0.12
/** Per member, per tick: changes outfit without buying anything. */
export const WARDROBE_RESTYLE_CHANCE = 0.08
/** After a purchase, how often the bot puts the new piece on straight away. */
export const WEAR_NEW_PIECE_CHANCE = 0.75

export interface WardrobePiece {
  id: string
  name: string
  category: EquipmentCategory
  rarity: EquipmentRarity
  /** How many copies the member owns (starter claws come in pairs). */
  copies: number
  /** Bought rather than part of the starter set. */
  bought: boolean
}

export type OutfitStyle = 'bare' | 'starter' | 'mixed'
export type Outfit = Partial<Record<EquipSlotId, string>>

const STARTER_IDS = new Set(STARTER_EQUIPMENT_CATALOG_IDS)

function pickFrom<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length) % list.length]
}

/** Bare 20%, full starter set 30%, a random mix of owned pieces 50%. */
export function pickOutfitStyle(rng: Rng): OutfitStyle {
  const roll = rng()
  if (roll < 0.2) return 'bare'
  if (roll < 0.5) return 'starter'
  return 'mixed'
}

/** The starter set exactly as a new member wears it. */
export function starterOutfit(): Outfit {
  return Object.fromEntries(STARTER_EQUIPPED_SLOTS.map((slot, i) => [slot, STARTER_EQUIPMENT_CATALOG_IDS[i]]))
}

/**
 * Choose what to wear from what the member owns. A mixed outfit fills each slot about 60% of
 * the time and reaches for bought pieces first, so purchases show up on the character.
 * `mustWear` is placed first (a piece just bought).
 */
export function pickOutfit(rng: Rng, owned: readonly WardrobePiece[], style: OutfitStyle, mustWear?: string): Outfit {
  if (style === 'bare' && !mustWear) return {}
  if (style === 'starter' && !mustWear) return starterOutfit()

  const outfit: Outfit = {}
  const used = new Map<string, number>()
  const take = (slot: EquipSlotId, piece: WardrobePiece) => {
    outfit[slot] = piece.id
    used.set(piece.id, (used.get(piece.id) ?? 0) + 1)
  }
  const free = (piece: WardrobePiece) => (used.get(piece.id) ?? 0) < piece.copies

  const must = mustWear ? owned.find((p) => p.id === mustWear) : undefined
  if (must) {
    const slot = must.category === 'claws' ? pickFrom(rng, ['claws-1', 'claws-2'] as const) : (must.category as EquipSlotId)
    take(slot, must)
  }
  if (style === 'bare') return outfit

  const base = style === 'starter' ? starterOutfit() : {}
  for (const slot of EQUIP_SLOT_IDS) {
    if (outfit[slot]) continue
    if (style === 'starter') {
      const id = base[slot]
      const piece = owned.find((p) => p.id === id)
      if (piece && free(piece)) take(slot, piece)
      continue
    }
    if (rng() >= 0.6) continue
    const fits = owned.filter((p) => p.category === equipSlotCategory(slot) && free(p))
    if (!fits.length) continue
    const bought = fits.filter((p) => p.bought)
    take(slot, bought.length && rng() < 0.7 ? pickFrom(rng, bought) : pickFrom(rng, fits))
  }
  return outfit
}

/**
 * A piece the member can pay for in gems alone, cheaper pieces far more likely.
 * Null when nothing unowned is affordable.
 */
export function pickPurchase<T extends { id: string; rarity: EquipmentRarity }>(
  rng: Rng,
  gems: number,
  market: readonly T[],
  ownedIds: ReadonlySet<string>,
): T | null {
  const affordable = market.filter((p) => !ownedIds.has(p.id) && GEAR_PRICES[p.rarity] <= gems)
  if (!affordable.length) return null
  const weights = affordable.map((p) => 1 / GEAR_PRICES[p.rarity])
  let roll = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < affordable.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return affordable[i]
  }
  return affordable[affordable.length - 1]
}

async function isSimulated(db: Db, userId: string) {
  const [row] = await db.select({ s: profiles.isSimulated }).from(profiles).where(eq(profiles.id, userId)).limit(1)
  return Boolean(row?.s)
}

/** Gear in the market: wearable pieces outside the starter set. */
async function loadMarket(db: Db) {
  const rows = await db.select().from(equipmentCatalog).where(eq(equipmentCatalog.kind, 'gear'))
  return rows.filter((c) => {
    const key = c.appearanceKey || c.slug
    return typeof key === 'string' && Boolean(getEquipmentVisual(key))
  })
}

/** Everything the member may wear: the starter set (claws twice) plus their unlocks. */
async function loadOwned(db: Db, userId: string, market: Awaited<ReturnType<typeof loadMarket>>): Promise<WardrobePiece[]> {
  const unlocks = await db.select({ id: gearUnlocks.catalogItemId }).from(gearUnlocks).where(eq(gearUnlocks.userId, userId))
  const copies = new Map<string, number>()
  for (const id of STARTER_EQUIPMENT_CATALOG_IDS) copies.set(id, (copies.get(id) ?? 0) + 1)
  for (const u of unlocks) if (!copies.has(u.id)) copies.set(u.id, 1)
  const byId = new Map(market.map((c) => [c.id, c]))
  return [...copies].flatMap(([id, n]) => {
    const c = byId.get(id)
    return c ? [{ id, name: c.name, category: c.category, rarity: c.rarity, copies: n, bought: !STARTER_IDS.has(id) }] : []
  })
}

/** Gem ledger total: what the market actually charges against. */
async function gemLedger(db: Db, userId: string): Promise<number> {
  const res = await db.execute<{ total: string | number }>(
    sql`SELECT COALESCE(SUM(amount), 0) AS total FROM gem_transactions WHERE "userId" = ${userId}`,
  )
  return Number(res.rows[0]?.total ?? 0)
}

/**
 * Put the outfit on: one gear row per worn piece, nothing in the vault, then commit through
 * `commit_character` so the worn look and revision update exactly as a member's save would.
 */
export async function dressSimulatedMember(db: Db, userId: string, outfit: Outfit) {
  if (!(await isSimulated(db, userId))) throw new Error('Refusing to dress a real member.')
  await db.execute(sql`SELECT public.initialize_character(${userId})`)
  const [profile] = await db
    .select({ revision: profiles.appearanceRevision, config: profiles.avatarConfig })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  // commit_character writes the config it is given (a null would erase the character) and only
  // accepts the current style; older bots saved a retired style name that draws the same way.
  if (!profile?.config) return { dressed: false, reason: 'No saved character.' }

  const entries = Object.entries(outfit) as [EquipSlotId, string][]
  const rows = entries.map(([slot, catalogItemId]) => ({ id: crypto.randomUUID(), userId, catalogItemId, equippedSlot: slot }))
  const placements = rows.map((r) => ({ id: r.id, equippedSlot: r.equippedSlot, vaultIndex: null }))
  const config = JSON.stringify({ ...profile.config, style: LOBSTER_AVATAR_STYLE })
  // One transaction: a failed commit leaves the old outfit in place.
  await db.batch([
    db.delete(userGearItems).where(eq(userGearItems.userId, userId)),
    ...(rows.length ? [db.insert(userGearItems).values(rows)] : []),
    db.execute(sql`SELECT public.commit_character(${userId},${profile.revision},${config}::jsonb,${JSON.stringify(placements)}::jsonb)`),
  ] as unknown as Parameters<typeof db.batch>[0])
  return { dressed: true, slots: entries.map(([slot]) => slot) }
}

export interface WardrobeAction {
  userId: string
  handle: string | null
  bought?: { id: string; name: string; rarity: EquipmentRarity; price: number }
  outfit?: { style: OutfitStyle; slots: EquipSlotId[] }
  skipped?: string
}

/** One member's turn: maybe shop, maybe change outfit. */
export async function runMemberWardrobe(
  db: Db,
  member: { id: string; handle: string | null },
  rng: Rng = Math.random,
  options: { dryRun?: boolean; forceShop?: boolean; forceRestyle?: boolean; market?: Awaited<ReturnType<typeof loadMarket>> } = {},
): Promise<WardrobeAction | null> {
  const shop = options.forceShop || rng() < WARDROBE_SHOP_CHANCE
  const restyle = options.forceRestyle || rng() < WARDROBE_RESTYLE_CHANCE
  if (!shop && !restyle) return null
  if (!(await isSimulated(db, member.id))) return { userId: member.id, handle: member.handle, skipped: 'Not a simulated member.' }

  const market = options.market ?? (await loadMarket(db))
  const action: WardrobeAction = { userId: member.id, handle: member.handle }
  let wearNow: string | undefined

  if (shop) {
    const owned = await loadOwned(db, member.id, market)
    const pick = pickPurchase(rng, await gemLedger(db, member.id), market.filter((c) => !STARTER_IDS.has(c.id)), new Set(owned.map((p) => p.id)))
    if (pick) {
      const price = GEAR_PRICES[pick.rarity]
      if (!options.dryRun) {
        const res = await buyGear(db, member.id, pick.id)
        if (!res.ok) return { ...action, skipped: res.error ?? 'Purchase failed.' }
      }
      action.bought = { id: pick.id, name: pick.name, rarity: pick.rarity, price }
      if (rng() < WEAR_NEW_PIECE_CHANCE) wearNow = pick.id
    }
  }

  if (restyle || wearNow) {
    const owned = await loadOwned(db, member.id, market)
    if (options.dryRun && action.bought)
      owned.push({ id: action.bought.id, name: action.bought.name, rarity: action.bought.rarity, category: market.find((c) => c.id === action.bought!.id)!.category, copies: 1, bought: true })
    const style = pickOutfitStyle(rng)
    const outfit = pickOutfit(rng, owned, style, wearNow)
    if (!options.dryRun) {
      const res = await dressSimulatedMember(db, member.id, outfit)
      if (!res.dressed) return { ...action, skipped: res.reason }
    }
    action.outfit = { style, slots: Object.keys(outfit) as EquipSlotId[] }
  }
  return action.bought || action.outfit ? action : null
}

/** Simulation phase: every simulated member with a saved character gets a turn. */
export async function simulateWardrobes(db: Db, options: { dryRun?: boolean; rng?: Rng } = {}) {
  const members = await db
    .select({ id: profiles.id, handle: profiles.handle })
    .from(profiles)
    .where(and(eq(profiles.isSimulated, true), sql`${profiles.avatarConfig} IS NOT NULL`))
  const market = await loadMarket(db)
  const actions: WardrobeAction[] = []
  for (const member of members) {
    try {
      const action = await runMemberWardrobe(db, member, options.rng, { dryRun: options.dryRun, market })
      if (action) actions.push(action)
    } catch (err) {
      actions.push({ userId: member.id, handle: member.handle, skipped: err instanceof Error ? err.message : String(err) })
    }
  }
  return {
    dryRun: Boolean(options.dryRun),
    purchases: actions.filter((a) => a.bought).length,
    restyles: actions.filter((a) => a.outfit).length,
    actions,
  }
}

/** A new bot gets the starter set and usually wears some or all of it. */
export async function dressNewSimulatedMember(db: Db, userId: string, rng: Rng = Math.random) {
  const owned = await loadOwned(db, userId, await loadMarket(db))
  const style = pickOutfitStyle(rng)
  return dressSimulatedMember(db, userId, pickOutfit(rng, owned, style))
}
