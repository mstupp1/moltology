import type { EquipmentRarity } from '../db/schema'
import { GEAR_PRICES } from './gear-variants'

/**
 * Market promos and bundles. Static for now: edit this file to change what the Gear tab
 * features. Pieces are named by base key and rarity; any that are missing from the
 * catalog are skipped, so a typo hides a tile rather than breaking the page.
 */
export interface PieceRef {
  baseKey: string
  rarity: EquipmentRarity
}

export interface MarketBundle {
  id: string
  name: string
  blurb: string
  pieces: PieceRef[]
  /** Off the total of buying each piece on its own. */
  discountPercent: number
}

export type FeaturedSlot =
  | { kind: 'piece'; piece: PieceRef; tag: string; blurb?: string }
  | { kind: 'bundle'; bundleId: string; tag: string }

export const MARKET_BUNDLES: MarketBundle[] = [
  {
    id: 'oracle-regalia',
    name: 'Oracle Regalia',
    blurb: 'Three legendary pieces for members who want to moltmax all the way.',
    pieces: [
      { baseKey: 'oracle-dome-lattice', rarity: 'legendary' },
      { baseKey: 'synapse-shear-claws', rarity: 'legendary' },
      { baseKey: 'hydrostatic-seal-plate', rarity: 'legendary' },
    ],
    discountPercent: 20,
  },
  {
    id: 'abyssal-set',
    name: 'Abyssal Set',
    blurb: 'Matching epic plate, girdle and legs from the deep trench.',
    pieces: [
      { baseKey: 'abyssal-ward-shell', rarity: 'epic' },
      { baseKey: 'abyssal-clasp-girdle', rarity: 'epic' },
      { baseKey: 'void-stride-articulation', rarity: 'epic' },
    ],
    discountPercent: 20,
  },
  {
    id: 'party-hats',
    name: 'Party Hats',
    blurb: 'Crown, halo and bow, all in rare. Swap them out by mood.',
    pieces: [
      { baseKey: 'creator-crown', rarity: 'rare' },
      { baseKey: 'creator-halo', rarity: 'rare' },
      { baseKey: 'creator-bow', rarity: 'rare' },
    ],
    discountPercent: 20,
  },
  {
    id: 'first-molt',
    name: 'First Molt Kit',
    blurb: 'The starter set, one step up. A cheap way into uncommon.',
    pieces: [
      { baseKey: 'soft-shell-visor', rarity: 'uncommon' },
      { baseKey: 'larval-plate-vest', rarity: 'uncommon' },
      { baseKey: 'training-pincers', rarity: 'uncommon' },
      { baseKey: 'silt-walker-greaves', rarity: 'uncommon' },
    ],
    discountPercent: 20,
  },
]

/** The first slot is the large banner; the rest sit beside it. */
export const MARKET_FEATURED: FeaturedSlot[] = [
  {
    kind: 'piece',
    piece: { baseKey: 'oracle-dome-lattice', rarity: 'legendary' },
    tag: 'Featured',
    blurb: 'The rarest helm in the trench, with an ability nobody can explain.',
  },
  { kind: 'bundle', bundleId: 'abyssal-set', tag: 'Bundle' },
  { kind: 'piece', piece: { baseKey: 'tideforge-hammer', rarity: 'epic' }, tag: 'New' },
]

/** Bundle price in gems, rounded to a tidy 10. */
export function bundlePrice(bundle: MarketBundle): { full: number; price: number } {
  const full = bundle.pieces.reduce((sum, p) => sum + GEAR_PRICES[p.rarity], 0)
  return { full, price: Math.round((full * (100 - bundle.discountPercent)) / 1000) * 10 }
}
