import { and, eq, sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { equipmentCatalog, gearUnlocks, profiles } from '../../db/schema'
import { getEquipmentVisual } from '../avatar/equipment'
import { STARTER_EQUIPMENT_CATALOG_IDS } from '../equipment-seed-data'
import { GEAR_PRICES, RARITY_ORDER, parseVariantKey } from '../gear-variants'
import type { BuyGearResult, MarketPayload, MarketPiece } from '../market'
import { isAdmin } from '../permissions'
import { balanceRefresh, getGemWallet } from './gems'
import { canBuyCredits, creditBalanceRefresh } from './molt-credits'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

const STARTER = new Set(STARTER_EQUIPMENT_CATALOG_IDS)

export async function getMarket(db: Db, userId: string): Promise<MarketPayload> {
  const [wallet, catalog, unlocks, profileRows] = await Promise.all([
    getGemWallet(db, userId),
    db.select().from(equipmentCatalog).where(eq(equipmentCatalog.kind, 'gear')),
    db.select({ id: gearUnlocks.catalogItemId }).from(gearUnlocks).where(eq(gearUnlocks.userId, userId)),
    db
      .select({ role: profiles.role, moltCredits: profiles.moltCredits, experiments: profiles.experiments })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1),
  ])
  const everyItem = isAdmin(null, profileRows[0]?.role)
  const owned = new Set([...STARTER, ...unlocks.map((u) => u.id)])
  const pieces = new Map<string, MarketPiece & { order: number }>()
  for (const row of [...catalog].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const key = row.appearanceKey || row.slug
    if (!getEquipmentVisual(key)) continue
    const { baseKey } = parseVariantKey(key)
    let piece = pieces.get(baseKey)
    if (!piece) {
      piece = {
        baseKey,
        name: row.name,
        flavorText: row.flavorText,
        category: row.category,
        variants: [],
        order: row.sortOrder,
      }
      pieces.set(baseKey, piece)
    }
    piece.variants.push({
      catalogItemId: row.id,
      rarity: row.rarity,
      appearanceKey: key,
      price: GEAR_PRICES[row.rarity],
      primaryStat: row.primaryStat,
      affixes: row.affixes ?? [],
      uniquePower: row.uniquePower ?? null,
      owned: everyItem || owned.has(row.id),
    })
  }
  return {
    wallet,
    everyItem,
    moltCredits: Number(profileRows[0]?.moltCredits ?? 0),
    creditsLive: canBuyCredits(profileRows[0]?.role, profileRows[0]?.experiments),
    pieces: [...pieces.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ order: _order, ...piece }) => ({
        ...piece,
        variants: piece.variants.sort(
          (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
        ),
      })),
  }
}

/**
 * Charges gems and unlocks a piece in one transaction. The profile row lock comes first, so
 * the balance check reads a fresh ledger sum and two tabs can't overspend.
 */
export async function buyGear(db: Db, userId: string, catalogItemId: string): Promise<BuyGearResult> {
  const [item] = await db
    .select()
    .from(equipmentCatalog)
    .where(and(eq(equipmentCatalog.id, catalogItemId), eq(equipmentCatalog.kind, 'gear')))
    .limit(1)
  const balanceOf = async () =>
    (await db.select({ g: profiles.chitinGems }).from(profiles).where(eq(profiles.id, userId)).limit(1))[0]?.g ?? 0
  if (!item || !getEquipmentVisual(item.appearanceKey || item.slug))
    return { ok: false, balance: await balanceOf(), credits: 0, error: 'That piece is not in the market.' }
  if (STARTER.has(item.id)) return { ok: false, balance: await balanceOf(), credits: 0, error: 'You already own this piece.' }
  const price = GEAR_PRICES[item.rarity]
  const key = `purchase:${item.id}`
  const label = `Bought ${item.name} (${item.rarity})`
  const [lock, gemUpdate] = balanceRefresh(db, userId)
  const [, creditUpdate] = creditBalanceRefresh(db, userId)
  const gemSum = sql`(SELECT COALESCE(SUM(amount), 0) FROM gem_transactions WHERE "userId" = ${userId})`
  const creditSum = sql`(SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE "userId" = ${userId})`
  const notOwned = sql`NOT EXISTS (SELECT 1 FROM gear_unlocks WHERE "userId" = ${userId} AND "catalogItemId" = ${item.id})`
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
      SELECT ${userId}, ${item.id}, 'purchase'
      WHERE ${gemsPaid} + COALESCE((SELECT -amount FROM credit_transactions WHERE "userId" = ${userId} AND "sourceKey" = ${key}), 0) >= ${price}
      ON CONFLICT DO NOTHING`),
    gemUpdate,
    creditUpdate,
  ])
  const [after] = await db
    .select({
      balance: profiles.chitinGems,
      credits: profiles.moltCredits,
      unlocked: sql<boolean>`EXISTS (SELECT 1 FROM gear_unlocks WHERE "userId" = ${userId} AND "catalogItemId" = ${item.id})`,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  const balance = after?.balance ?? 0
  const credits = Math.max(0, Number(after?.credits ?? 0))
  if (after?.unlocked) return { ok: true, balance, credits }
  return { ok: false, balance, credits, error: `You need ${price - balance - credits} more gems for this piece.` }
}

export async function getMarketHandler(args: { data?: { token?: string }; context?: WriteAuthContext }) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  return getMarket(auth.dbClient, auth.userId)
}

export async function buyGearHandler(args: {
  data?: { token?: string; catalogItemId: string }
  context?: WriteAuthContext
}) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  if (!args.data?.catalogItemId) throw new Error('Pick a piece to buy.')
  return buyGear(auth.dbClient, auth.userId, args.data.catalogItemId)
}
