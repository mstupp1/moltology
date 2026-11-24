import { and, eq, inArray, sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { gearUnlocks, profiles, userGearItems } from '../../db/schema'
import { getEquipmentVisual } from '../avatar/equipment'
import { gearCatalogRow, gearCatalogRowByKey, SHOP_CATALOG, STARTER_EQUIPMENT_CATALOG_IDS } from '../equipment-seed-data'
import { GEAR_PRICES } from '../gear-variants'
import { GEM_FIRSTS } from '../gems'
import { buildMarketPieces, type BuyGearResult, type MarketPayload, type WalletBalances } from '../market'
import { bundlePrice, bundleRefKey, marketBundle, type MarketBundle } from '../market-featured'
import { isAdmin } from '../permissions'
import { ensureGearCatalog } from './gear-catalog'
import { balanceRefresh, getGemWallet } from './gems'
import { canBuyCredits, creditBalanceRefresh } from './molt-credits'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

const STARTER = new Set(STARTER_EQUIPMENT_CATALOG_IDS)

export async function getMarket(db: Db, userId: string): Promise<MarketPayload> {
  const [wallet, unlocks, placed, profileRows] = await Promise.all([
    getGemWallet(db, userId),
    db.select({ id: gearUnlocks.catalogItemId }).from(gearUnlocks).where(eq(gearUnlocks.userId, userId)),
    db.select({ id: userGearItems.catalogItemId }).from(userGearItems).where(eq(userGearItems.userId, userId)),
    db
      .select({ role: profiles.role, moltCredits: profiles.moltCredits, experiments: profiles.experiments })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1),
  ])
  // Same rule as the character page: starter set, unlocks, and anything already placed.
  const owned = new Set([...STARTER, ...unlocks.map((u) => u.id), ...placed.map((p) => p.id)])
  return {
    wallet,
    addFree: isAdmin(null, profileRows[0]?.role),
    moltCredits: Number(profileRows[0]?.moltCredits ?? 0),
    creditsLive: canBuyCredits(profileRows[0]?.role, profileRows[0]?.experiments),
    pieces: buildMarketPieces(SHOP_CATALOG, owned),
  }
}

/**
 * Charges gems (then credits) and unlocks pieces in one batch. The profile row lock comes first,
 * so each statement reads a fresh ledger sum and two tabs can't overspend. `key` is the purchase's
 * idempotency key in both ledgers. Returns the balances after, and whether every piece unlocked.
 */
async function charge(db: Db, userId: string, ids: string[], price: number, key: string, label: string) {
  await ensureGearCatalog(db)
  const [lock, gemUpdate] = balanceRefresh(db, userId)
  const [, creditUpdate] = creditBalanceRefresh(db, userId)
  const idList = sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `,
  )
  const gemSum = sql`(SELECT COALESCE(SUM(amount), 0) FROM gem_transactions WHERE "userId" = ${userId})`
  const creditSum = sql`(SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE "userId" = ${userId})`
  const notOwned = sql`NOT EXISTS (SELECT 1 FROM gear_unlocks WHERE "userId" = ${userId} AND "catalogItemId" IN (${idList}))`
  const gemsPaid = sql`COALESCE((SELECT -amount FROM gem_transactions WHERE "userId" = ${userId} AND "sourceKey" = ${key}), 0)`
  // Gems pay first; credits cover whatever is left. Each statement after the lock reads fresh sums.
  await db.batch([
    lock,
    db.execute(sql`INSERT INTO gem_transactions ("userId", amount, source, "sourceKey", description)
      SELECT ${userId}, -LEAST(${gemSum}, ${price}), 'purchase', ${key}, ${label}
      WHERE ${notOwned} AND ${gemSum} > 0 AND ${gemSum} + GREATEST(${creditSum}, 0) >= ${price}
      ON CONFLICT DO NOTHING`),
    db.execute(sql`INSERT INTO credit_transactions ("userId", amount, source, "sourceKey", description)
      SELECT ${userId}, -(${price} - ${gemsPaid}), 'purchase', ${key}, ${label}
      WHERE ${notOwned} AND ${price} - ${gemsPaid} > 0 AND ${creditSum} >= ${price} - ${gemsPaid}
      ON CONFLICT DO NOTHING`),
    db.execute(sql`INSERT INTO gear_unlocks ("userId", "catalogItemId", source)
      SELECT ${userId}, id, 'purchase' FROM unnest(ARRAY[${idList}]) AS id
      WHERE ${gemsPaid} + COALESCE((SELECT -amount FROM credit_transactions WHERE "userId" = ${userId} AND "sourceKey" = ${key}), 0) >= ${price}
      ON CONFLICT DO NOTHING`),
    gemUpdate,
    creditUpdate,
  ])
  const [after] = await db
    .select({
      balance: profiles.chitinGems,
      credits: profiles.moltCredits,
      unlocked: sql<number>`(SELECT COUNT(*)::int FROM gear_unlocks WHERE "userId" = ${userId} AND "catalogItemId" IN (${idList}))`,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  return {
    balance: after?.balance ?? 0,
    credits: Math.max(0, Number(after?.credits ?? 0)),
    unlocked: Number(after?.unlocked ?? 0) === ids.length,
  }
}

/** Charges gems and unlocks one piece. */
export async function buyGear(db: Db, userId: string, catalogItemId: string): Promise<BuyGearResult> {
  const item = shopRow(catalogItemId)
  const balanceOf = async () =>
    (await db.select({ g: profiles.chitinGems }).from(profiles).where(eq(profiles.id, userId)).limit(1))[0]?.g ?? 0
  if (!item) return { ok: false, balance: await balanceOf(), credits: 0, error: 'That piece is not in the market.' }
  if (STARTER.has(item.id)) return { ok: false, balance: await balanceOf(), credits: 0, error: 'You already own this piece.' }
  const price = GEAR_PRICES[item.rarity]
  const { balance, credits, unlocked } = await charge(db, userId, [item.id], price, `purchase:${item.id}`, `Bought ${item.name} (${item.rarity})`)
  if (unlocked) return { ok: true, balance, credits }
  return { ok: false, balance, credits, error: `You need ${price - balance - credits} more gems for this piece.` }
}

/** A piece the shop sells (not retired, with a 3D look), by catalog id. */
function shopRow(catalogItemId: string) {
  const row = gearCatalogRow(catalogItemId)
  return row && !row.retired && getEquipmentVisual(row.appearanceKey || row.slug) ? row : undefined
}

/** The catalog ids behind a bundle's pieces, or null when any is missing from the shop. */
function bundleRows(bundle: MarketBundle) {
  const rows = bundle.pieces.map((ref) => ({ ref, row: gearCatalogRowByKey(bundleRefKey(ref)) }))
  return rows.every(({ row }) => row && shopRow(row.id)) ? rows.map(({ ref, row }) => ({ ref, id: row!.id })) : null
}

async function ownedIds(db: Db, userId: string, ids: string[]): Promise<Set<string>> {
  const [unlocks, placed] = await Promise.all([
    db.select({ id: gearUnlocks.catalogItemId }).from(gearUnlocks).where(and(eq(gearUnlocks.userId, userId), inArray(gearUnlocks.catalogItemId, ids))),
    db.select({ id: userGearItems.catalogItemId }).from(userGearItems).where(and(eq(userGearItems.userId, userId), inArray(userGearItems.catalogItemId, ids))),
  ])
  return new Set([...ids.filter((id) => STARTER.has(id)), ...unlocks.map((u) => u.id), ...placed.map((p) => p.id)])
}

/**
 * Buys every piece of a bundle the member doesn't own yet, in one charge at the bundle's
 * discount (bundlePrice). Pieces already owned drop out of the price.
 */
export async function buyBundle(db: Db, userId: string, bundleId: string): Promise<BuyGearResult> {
  const bundle = marketBundle(bundleId)
  const wallet = async () => {
    const [row] = await db.select({ g: profiles.chitinGems, c: profiles.moltCredits }).from(profiles).where(eq(profiles.id, userId)).limit(1)
    return { balance: row?.g ?? 0, credits: Math.max(0, Number(row?.c ?? 0)) }
  }
  const rows = bundle ? bundleRows(bundle) : null
  if (!bundle || !rows) return { ok: false, ...(await wallet()), error: 'That bundle is not in the market.' }
  const owned = await ownedIds(db, userId, rows.map((r) => r.id))
  const left = rows.filter((r) => !owned.has(r.id))
  if (!left.length) return { ok: false, ...(await wallet()), error: 'You already own every piece in this bundle.' }
  const ownedRefs = new Set(rows.filter((r) => owned.has(r.id)).map((r) => r.ref))
  const { price } = bundlePrice(bundle, (ref) => ownedRefs.has(ref))
  const ids = left.map((r) => r.id).sort()
  const { balance, credits, unlocked } = await charge(db, userId, ids, price, `bundle:${bundle.id}:${ids.join(',')}`, `Bought the ${bundle.name} bundle (${ids.length} pieces)`)
  if (unlocked) return { ok: true, balance, credits }
  return { ok: false, balance, credits, error: `You need ${price - balance - credits} more gems for this bundle.` }
}

/** Admins: add every piece of a bundle without spending anything. */
export async function addBundleFree(db: Db, userId: string, bundleId: string): Promise<BuyGearResult> {
  const bundle = marketBundle(bundleId)
  const rows = bundle ? bundleRows(bundle) : null
  const [wallet] = await db.select({ balance: profiles.chitinGems, credits: profiles.moltCredits }).from(profiles).where(eq(profiles.id, userId)).limit(1)
  const balance = wallet?.balance ?? 0
  const credits = Math.max(0, Number(wallet?.credits ?? 0))
  if (!rows) return { ok: false, balance, credits, error: 'That bundle is not in the market.' }
  const ids = rows.map((r) => r.id).filter((id) => !STARTER.has(id))
  await ensureGearCatalog(db)
  if (ids.length) await db.insert(gearUnlocks).values(ids.map((catalogItemId) => ({ userId, catalogItemId, source: 'admin' as const }))).onConflictDoNothing()
  return { ok: true, balance, credits }
}

/** Admins: add a piece to the collection without spending anything. */
export async function addGearFree(db: Db, userId: string, catalogItemId: string): Promise<BuyGearResult> {
  const item = shopRow(catalogItemId)
  const [wallet] = await db
    .select({ balance: profiles.chitinGems, credits: profiles.moltCredits })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  const balance = wallet?.balance ?? 0
  const credits = Math.max(0, Number(wallet?.credits ?? 0))
  if (!item) return { ok: false, balance, credits, error: 'That piece is not in the market.' }
  await ensureGearCatalog(db)
  if (!STARTER.has(item.id))
    await db.insert(gearUnlocks).values({ userId, catalogItemId: item.id, source: 'admin' }).onConflictDoNothing()
  return { ok: true, balance, credits }
}

/** Gem and credit balances for the avatar menu: one profile row, no ledger or catalog reads. */
export async function getWalletBalances(db: Db, userId: string): Promise<WalletBalances> {
  const [row] = await db
    .select({
      gems: profiles.chitinGems,
      credits: profiles.moltCredits,
      role: profiles.role,
      experiments: profiles.experiments,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  return {
    gems: Math.max(0, Number(row?.gems ?? 0)),
    credits: Math.max(0, Number(row?.credits ?? 0)),
    creditsLive: canBuyCredits(row?.role, row?.experiments),
  }
}

export async function getWalletBalancesHandler(args: { data?: { token?: string }; context?: WriteAuthContext }) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  return getWalletBalances(auth.dbClient, auth.userId)
}

/** What a signed-out visitor sees: the full catalog, the starter set owned, nothing to spend. */
export async function getGuestMarket(_db?: Db): Promise<MarketPayload> {
  return {
    wallet: { balance: 0, history: [], firsts: GEM_FIRSTS.map((f) => ({ ...f, done: false })) },
    addFree: false,
    moltCredits: 0,
    creditsLive: false,
    guest: true,
    pieces: buildMarketPieces(SHOP_CATALOG, new Set(STARTER)),
  }
}

export async function getMarketHandler(args: { data?: { token?: string }; context?: WriteAuthContext }) {
  const auth = await resolveWriteAuth({ ...args, requireAuth: false })
  if (!auth) return getGuestMarket()
  return getMarket(auth.dbClient, auth.userId)
}

export async function buyGearHandler(args: {
  data?: { token?: string; catalogItemId: string }
  context?: WriteAuthContext
}) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  if (!args.data?.catalogItemId) throw new Error('Pick a piece to buy.')
  const [profile] = await auth.dbClient
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  if (isAdmin(null, profile?.role)) return addGearFree(auth.dbClient, auth.userId, args.data.catalogItemId)
  return buyGear(auth.dbClient, auth.userId, args.data.catalogItemId)
}

export async function buyBundleHandler(args: {
  data?: { token?: string; bundleId: string }
  context?: WriteAuthContext
}) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  if (!args.data?.bundleId) throw new Error('Pick a bundle to buy.')
  const [profile] = await auth.dbClient
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  if (isAdmin(null, profile?.role)) return addBundleFree(auth.dbClient, auth.userId, args.data.bundleId)
  return buyBundle(auth.dbClient, auth.userId, args.data.bundleId)
}
