import type {
  ChassisVisualType,
  EquipmentAffix,
  EquipmentCategory,
  EquipmentKind,
  EquipmentRarity,
  EquipmentUniquePower,
} from '../db/schema'
import { higherTiers, tierAbility, variantId, variantKey, variantStats } from './gear-variants'
import { imageUrlOf, visualTypeOf } from './gear/catalog'
import { GEAR_PIECES } from './gear/pieces'
import type { GearPiece } from './gear/types'

export interface EquipmentCatalogSeed {
  id: string
  slug: string
  name: string
  flavorText: string
  category: EquipmentCategory
  rarity: EquipmentRarity
  visualType: ChassisVisualType
  primaryStat: number
  affixes: EquipmentAffix[]
  uniquePower: EquipmentUniquePower | null
  imageUrl: string
  sortOrder: number
  kind?: EquipmentKind
  artKey?: string | null
  appearanceKey?: string
  /** Out of the shop; owners keep it (GearPiece.retired). */
  retired?: boolean
}

/** A piece definition (src/lib/gear/pieces.ts) as a catalog row. */
function catalogRow(p: GearPiece): EquipmentCatalogSeed {
  return {
    id: p.id,
    slug: p.key,
    name: p.name,
    flavorText: p.flavorText,
    category: p.slot,
    rarity: p.rarity,
    visualType: visualTypeOf(p),
    primaryStat: p.primaryStat,
    affixes: p.affixes,
    uniquePower: p.uniquePower ?? tierAbility(p.slot, p.rarity),
    imageUrl: imageUrlOf(p),
    sortOrder: p.sortOrder,
    kind: 'gear',
    appearanceKey: p.key,
    ...(p.retired ? { retired: true } : {}),
  }
}

/** Original benthic catalog. Rows come from the piece definitions in src/lib/gear/pieces.ts. */
export const INITIAL_EQUIPMENT_CATALOG: EquipmentCatalogSeed[] = GEAR_PIECES.filter((p) => p.n <= 24).map(catalogRow)

/** The character creator's hats and gauntlets. */
export const CREATOR_EQUIPMENT_CATALOG: EquipmentCatalogSeed[] = GEAR_PIECES.filter((p) => p.n >= 25 && p.n <= 33).map(catalogRow)

/** Pieces added since, collections included. */
export const LATER_EQUIPMENT_CATALOG: EquipmentCatalogSeed[] = GEAR_PIECES.filter((p) => p.n > 33).map(catalogRow)

/** Every base piece, in catalog order. Variants are built from this list. */
export const BASE_EQUIPMENT_CATALOG = [...INITIAL_EQUIPMENT_CATALOG, ...CREATOR_EQUIPMENT_CATALOG, ...LATER_EQUIPMENT_CATALOG]

/** Rarer versions of every base piece (see src/lib/gear-variants.ts). */
export const VARIANT_EQUIPMENT_CATALOG: EquipmentCatalogSeed[] = GEAR_PIECES.filter((p) => p.ladder !== false).flatMap((piece) => {
  const base = catalogRow(piece)
  return higherTiers(base.rarity).map((rarity, tierIndex) => ({
    ...base,
    ...variantStats(base, rarity),
    id: variantId(piece.n, rarity),
    slug: variantKey(base.slug, rarity),
    appearanceKey: variantKey(base.appearanceKey ?? base.slug, rarity),
    rarity,
    sortOrder: 1000 + base.sortOrder * 10 + tierIndex,
  }))
})

export const ALL_EQUIPMENT_CATALOG = [...BASE_EQUIPMENT_CATALOG, ...VARIANT_EQUIPMENT_CATALOG]

/**
 * The catalog, in shop order, as the rows the server reads. Code is the source of truth; the
 * equipment_catalog table mirrors it (src/lib/server/gear-catalog.ts).
 */
export const GEAR_CATALOG: readonly EquipmentCatalogSeed[] = [...ALL_EQUIPMENT_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder)

const CATALOG_BY_ID = new Map(GEAR_CATALOG.map((row) => [row.id, row]))
const CATALOG_BY_KEY = new Map(GEAR_CATALOG.map((row) => [row.appearanceKey ?? row.slug, row]))

/** A catalog row by id, retired pieces included. */
export function gearCatalogRow(id: string): EquipmentCatalogSeed | undefined {
  return CATALOG_BY_ID.get(id)
}

/** A catalog row by appearance key (variants use `<baseKey>--<rarity>`). */
export function gearCatalogRowByKey(key: string): EquipmentCatalogSeed | undefined {
  return CATALOG_BY_KEY.get(key)
}

/** What the shop sells: every row except retired pieces. */
export const SHOP_CATALOG: readonly EquipmentCatalogSeed[] = GEAR_CATALOG.filter((row) => !row.retired)

/** Two copies of every claw style; 19 instances total, all fitting in an empty vault. */
export const STARTER_EQUIPMENT_CATALOG_IDS: string[] = [
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000007',
  'a1000000-0000-4000-8000-00000000000a',
  'a1000000-0000-4000-8000-00000000000d',
  'a1000000-0000-4000-8000-000000000014',
  ...CREATOR_EQUIPMENT_CATALOG.flatMap((item) =>
    item.category === 'claws' ? [item.id, item.id] : [item.id],
  ),
]
export const STARTER_EQUIPPED_SLOTS = [
  'carapace',
  'claws-1',
  'claws-2',
  'head',
  'legs',
  'antennae',
  'belt',
] as const

export function catalogSeedInsertValues(item: EquipmentCatalogSeed) {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    flavorText: item.flavorText,
    category: item.category,
    rarity: item.rarity,
    visualType: item.visualType,
    primaryStat: item.primaryStat,
    affixes: item.affixes,
    uniquePower: item.uniquePower,
    imageUrl: item.imageUrl,
    sortOrder: item.sortOrder,
    kind: item.kind ?? 'gear',
    artKey: item.artKey ?? null,
    appearanceKey: item.appearanceKey ?? item.slug,
  }
}
