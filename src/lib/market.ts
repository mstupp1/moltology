import type { EquipmentAffix, EquipmentCategory, EquipmentRarity, EquipmentUniquePower } from '../db/schema'
import { getEquipmentVisual } from './avatar/equipment'
import type { GemWallet } from './gems'
import { GEAR_PRICES, RARITY_ORDER, parseVariantKey } from './gear-variants'

/** One rarity of a market piece. `catalogItemId` is what a purchase names. */
export interface MarketVariant {
  catalogItemId: string
  rarity: EquipmentRarity
  appearanceKey: string
  price: number
  primaryStat: number
  affixes: EquipmentAffix[]
  uniquePower: EquipmentUniquePower | null
  owned: boolean
}

/** A base piece and its whole rarity ladder, cheapest first. */
export interface MarketPiece {
  baseKey: string
  name: string
  flavorText: string
  category: EquipmentCategory
  variants: MarketVariant[]
}

export interface MarketPayload {
  wallet: GemWallet
  pieces: MarketPiece[]
  /** Admins own every piece, so there is nothing for them to buy. */
  everyItem: boolean
  moltCredits: number
  /** Credit packs can be bought (admins with the Molt Credits experiment, for now). */
  creditsLive: boolean
}

export interface BuyGearResult {
  ok: boolean
  balance: number
  credits: number
  error?: string
}

/** The catalog fields the market reads; DB rows and seed rows both fit. */
export interface MarketCatalogRow {
  id: string
  slug: string
  name: string
  flavorText: string
  category: EquipmentCategory
  rarity: EquipmentRarity
  primaryStat: number
  affixes: EquipmentAffix[] | null
  uniquePower: EquipmentUniquePower | null
  sortOrder: number
  appearanceKey?: string | null
}

/**
 * Groups gear rows into market pieces, each with its rarity ladder cheapest first.
 * `owned` holds catalog ids the member owns; `everyItem` marks everything owned (admins).
 */
export function buildMarketPieces(
  catalog: readonly MarketCatalogRow[],
  owned: ReadonlySet<string>,
  everyItem: boolean,
): MarketPiece[] {
  const pieces = new Map<string, MarketPiece & { order: number }>()
  for (const row of [...catalog].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const key = row.appearanceKey || row.slug
    if (!getEquipmentVisual(key)) continue
    const { baseKey } = parseVariantKey(key)
    let piece = pieces.get(baseKey)
    if (!piece) {
      piece = { baseKey, name: row.name, flavorText: row.flavorText, category: row.category, variants: [], order: row.sortOrder }
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
  return [...pieces.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...piece }) => ({
      ...piece,
      variants: piece.variants.sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)),
    }))
}
