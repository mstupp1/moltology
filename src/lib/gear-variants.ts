/**
 * Rarer versions of every gear piece, plus market prices.
 *
 * A variant reuses its base piece's drawing with richer trim and accent colours, heavier
 * construction, bigger stats, and (from epic up) a made-up ability. Variants are generated
 * here, so adding a base piece gives it a full rarity ladder for free.
 */
import type {
  EquipmentAffix,
  EquipmentCategory,
  EquipmentRarity,
  EquipmentUniquePower,
} from '../db/schema'

export const RARITY_ORDER: EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export const RARITY_LABELS: Record<EquipmentRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

/** Gem price by rarity. One table: change a number here and every piece follows. */
export const GEAR_PRICES: Record<EquipmentRarity, number> = {
  common: 60,
  uncommon: 150,
  rare: 400,
  epic: 900,
  legendary: 2000,
}

export const VARIANT_SEPARATOR = '--'

/** Appearance key of a variant: `<base key>--<rarity>`. */
export function variantKey(baseKey: string, rarity: EquipmentRarity): string {
  return `${baseKey}${VARIANT_SEPARATOR}${rarity}`
}

/** Splits a variant key into its base key and rarity. Plain keys come back with no rarity. */
export function parseVariantKey(key: string): { baseKey: string; rarity: EquipmentRarity | null } {
  const at = key.lastIndexOf(VARIANT_SEPARATOR)
  if (at < 0) return { baseKey: key, rarity: null }
  const rarity = key.slice(at + VARIANT_SEPARATOR.length) as EquipmentRarity
  if (!RARITY_ORDER.includes(rarity)) return { baseKey: key, rarity: null }
  return { baseKey: key.slice(0, at), rarity }
}

/** Colour treatment per tier: trim and accent are replaced, material is pulled toward a hue. */
export const TIER_FINISH: Record<
  Exclude<EquipmentRarity, 'common'>,
  { hue: string; pull: number; trim: string; accent: string; construction: number }
> = {
  uncommon: { hue: '#2f6a55', pull: 0.25, trim: '#a6e6c8', accent: '#7dffc4', construction: 1 },
  rare: { hue: '#284a7c', pull: 0.3, trim: '#b4ceff', accent: '#6fb6ff', construction: 2 },
  epic: { hue: '#47306f', pull: 0.35, trim: '#dcbcff', accent: '#c77dff', construction: 3 },
  legendary: { hue: '#6b4a1e', pull: 0.4, trim: '#f4cf6a', accent: '#fff0b8', construction: 4 },
}

export function mixHex(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16)
  const ch = [16, 8, 0].map((s) => {
    const x = (pa >> s) & 255,
      y = (pb >> s) & 255
    return Math.round(x + (y - x) * f)
  })
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** Primary bonus floor per tier. Sized to sit beside a 0 to 100 audit base. */
const TIER_STAT: Record<EquipmentRarity, number> = {
  common: 2,
  uncommon: 4,
  rare: 7,
  epic: 11,
  legendary: 15,
}

const TIER_AFFIX: Record<EquipmentRarity, number> = {
  common: 0,
  uncommon: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
}

const SECONDARY_STAT: Record<EquipmentCategory, EquipmentAffix['stat']> = {
  head: 'depthTolerance',
  carapace: 'neuralLatency',
  claws: 'ecdysisDiscipline',
  legs: 'depthTolerance',
  antennae: 'neuralLatency',
  belt: 'pincerTorque',
}

/** Made-up abilities for epic and legendary variants of pieces that don't have their own. */
const TIER_ABILITIES: Record<EquipmentCategory, { epic: EquipmentUniquePower; legendary: EquipmentUniquePower }> = {
  head: {
    epic: { name: 'Composure Brim', description: 'Unsolicited advice slides off the brim before it reaches your ears.' },
    legendary: { name: 'Crown of Quiet Rooms', description: 'Group chats go silent as you walk past. Nobody knows why.' },
  },
  carapace: {
    epic: { name: 'Shed-Proof Plating', description: 'Absorbs one bad take per day without denting.' },
    legendary: { name: 'Abyssal Bulwark', description: 'Criticism arrives pre-sorted, with the useful part on top.' },
  },
  claws: {
    epic: { name: 'Decisive Pinch', description: 'Closes eleven browser tabs with a single snap.' },
    legendary: { name: 'Grip of Follow-Through', description: 'Once it takes hold of a plan, it does not let go until the plan is done.' },
  },
  legs: {
    epic: { name: 'Silt Glide', description: 'Walks straight past the snack drawer without breaking stride.' },
    legendary: { name: 'Trench Stride', description: 'Every step lands two fathoms deeper than it should.' },
  },
  antennae: {
    epic: { name: 'Noise Gate', description: 'Picks up signal. Drops notifications.' },
    legendary: { name: 'Deep Current Array', description: 'Hears what the room means, not what it says.' },
  },
  belt: {
    epic: { name: 'Core Clasp', description: 'Keeps your posture upright through a four hour meeting.' },
    legendary: { name: 'Tidal Cinch', description: 'Holds everything together, including you.' },
  },
}

export interface VariantBase {
  id: string
  slug: string
  name: string
  flavorText: string
  category: EquipmentCategory
  rarity: EquipmentRarity
  primaryStat: number
  affixes: EquipmentAffix[]
  uniquePower: EquipmentUniquePower | null
  appearanceKey?: string
  sortOrder: number
}

export interface VariantStats {
  primaryStat: number
  affixes: EquipmentAffix[]
  uniquePower: EquipmentUniquePower | null
}

/** The made-up ability an epic or legendary piece gets when it has none of its own. */
export function tierAbility(category: EquipmentCategory, rarity: EquipmentRarity): EquipmentUniquePower | null {
  return rarity === 'epic' || rarity === 'legendary' ? TIER_ABILITIES[category][rarity] : null
}

/** Stats for a base piece raised to a higher tier. */
export function variantStats(base: VariantBase, rarity: EquipmentRarity): VariantStats {
  const primaryStat = TIER_STAT[rarity] + Math.round(base.primaryStat * 0.25)
  const scale = TIER_STAT[rarity] / Math.max(TIER_STAT[base.rarity], 1)
  const affixes = base.affixes.map((a) => ({ ...a, value: Math.round(a.value * scale) }))
  const bonus = TIER_AFFIX[rarity]
  if (bonus > 0) {
    const stat = SECONDARY_STAT[base.category]
    const existing = affixes.find((a) => a.stat === stat)
    if (existing) existing.value += bonus
    else affixes.push({ stat, value: bonus })
  }
  // A piece's own ability travels with it; a stock tier ability is swapped for the higher tier's.
  const stock = base.uniquePower?.name === tierAbility(base.category, base.rarity)?.name
  const uniquePower = (stock ? null : base.uniquePower) ?? tierAbility(base.category, rarity)
  return { primaryStat, affixes, uniquePower }
}

/** Deterministic id: a3 prefix, base position, tier position. */
export function variantId(baseIndex: number, rarity: EquipmentRarity): string {
  const n = (baseIndex + 1) * 10 + RARITY_ORDER.indexOf(rarity)
  return `a3000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

/** Tiers above a piece's own rarity. */
export function higherTiers(rarity: EquipmentRarity): EquipmentRarity[] {
  return RARITY_ORDER.slice(RARITY_ORDER.indexOf(rarity) + 1)
}
