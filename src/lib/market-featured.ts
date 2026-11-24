import type { EquipmentRarity } from '../db/schema'
import { GEAR_PRICES, variantKey } from './gear-variants'
import { GEAR_PIECE_BY_KEY } from './gear/catalog'
import { collectionReleased, GEAR_COLLECTIONS } from './gear/collections'
import { GEAR_PIECES } from './gear/pieces'

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

/** Hand-picked bundles. Collections add their own below. */
const PICKED_BUNDLES: MarketBundle[] = [
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

/** One bundle per shop collection: every piece in it, at the piece's own rarity. */
const COLLECTION_BUNDLES: MarketBundle[] = GEAR_COLLECTIONS.map((c) => ({
  id: `collection-${c.id}`,
  name: c.name,
  blurb: c.blurb,
  pieces: GEAR_PIECES.filter((p) => p.collection === c.id).map((p) => ({ baseKey: p.key, rarity: p.rarity })),
  discountPercent: c.discountPercent,
}))

export const MARKET_BUNDLES: MarketBundle[] = [...PICKED_BUNDLES, ...COLLECTION_BUNDLES]

/** Standing promos, shown after the week's collection (and in its place if it can't be shown). */
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

const RARITY_RANK: Record<EquipmentRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }
const WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * The Gear tab's promos, in order: the first that can be shown is the large banner and the next
 * two sit beside it. Each week (UTC, from the epoch) a different collection leads, with its
 * rarest piece beside it, then the standing promos.
 */
export function featuredSlots(now: Date = new Date()): FeaturedSlot[] {
  const week = Math.floor(now.getTime() / WEEK)
  const out = GEAR_COLLECTIONS.filter((x) => collectionReleased(x.id, now))
  const c = out[((week % out.length) + out.length) % out.length]
  const top = c ? GEAR_PIECES.filter((p) => p.collection === c.id).sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || a.n - b.n)[0] : undefined
  return [
    ...(c ? [{ kind: 'bundle' as const, bundleId: `collection-${c.id}`, tag: 'Collection of the week' }] : []),
    ...(top ? [{ kind: 'piece' as const, piece: { baseKey: top.key, rarity: top.rarity }, tag: 'New' }] : []),
    ...MARKET_FEATURED,
  ]
}

/**
 * Bundle price in gems, rounded to a tidy 10. Pieces the member already owns drop out, so the
 * price is for what is left, still at the bundle's discount.
 */
export function bundlePrice(bundle: MarketBundle, owned: (ref: PieceRef) => boolean = () => false): { full: number; price: number; left: number } {
  const left = bundle.pieces.filter((p) => !owned(p))
  const full = left.reduce((sum, p) => sum + GEAR_PRICES[p.rarity], 0)
  return { full, price: Math.round((full * (100 - bundle.discountPercent)) / 1000) * 10, left: left.length }
}

/** The catalog appearance key for a bundle piece: the piece itself at its own rarity, else its recoloured version. */
export function bundleRefKey(ref: PieceRef): string {
  return GEAR_PIECE_BY_KEY.get(ref.baseKey)?.rarity === ref.rarity ? ref.baseKey : variantKey(ref.baseKey, ref.rarity)
}

export function marketBundle(id: string): MarketBundle | undefined {
  return MARKET_BUNDLES.find((b) => b.id === id)
}
