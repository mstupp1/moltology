import type { EquipmentAffix, EquipmentCategory, EquipmentRarity, EquipmentUniquePower } from '../db/schema'
import type { GemWallet } from './gems'

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
