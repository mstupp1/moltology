import type {
  ChassisVisualType,
  EquipmentAffix,
  EquipmentCategory,
  EquipmentRarity,
  EquipmentUniquePower,
} from '../db/schema'

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
}

const VISUAL_TYPE_SLOT: Record<ChassisVisualType, EquipmentCategory> = {
  helm: 'head',
  carapace: 'carapace',
  pincer: 'claws',
  hammer: 'claws',
  antennae: 'antennae',
  greaves: 'legs',
  belt: 'belt',
}

function typeImage(visualType: ChassisVisualType): string {
  return `/images/chassis/${visualType}.webp`
}

function piece(
  partial: Omit<EquipmentCatalogSeed, 'imageUrl' | 'category'> & {
    category?: EquipmentCategory
  }
): EquipmentCatalogSeed {
  const category = partial.category ?? VISUAL_TYPE_SLOT[partial.visualType]
  return {
    ...partial,
    category,
    imageUrl: typeImage(partial.visualType),
  }
}

/**
 * Original benthic catalog. Art is type-level: every helm shares helm.webp,
 * every pincer shares pincer.webp, and so on. Do not point imageUrl at a per-row file.
 */
export const INITIAL_EQUIPMENT_CATALOG: EquipmentCatalogSeed[] = [
  piece({
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'larval-plate-vest',
    name: 'Larval Plate Vest',
    flavorText: 'Thin chitin, still soft from the last shed. It holds because you do.',
    visualType: 'carapace',
    rarity: 'common',
    primaryStat: 12,
    affixes: [],
    uniquePower: null,
    sortOrder: 1,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'tide-braced-carapace',
    name: 'Tide-Braced Carapace',
    flavorText: 'Ribbed against surface weather. Drama slides off like silt.',
    visualType: 'carapace',
    rarity: 'uncommon',
    primaryStat: 28,
    affixes: [{ stat: 'perception', value: 4 }],
    uniquePower: null,
    sortOrder: 2,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000003',
    slug: 'abyssal-ward-shell',
    name: 'Abyssal Ward Shell',
    flavorText: 'Pressure-forged in the benthic core. Nothing shallow dents this.',
    visualType: 'carapace',
    rarity: 'epic',
    primaryStat: 72,
    affixes: [{ stat: 'intelligence', value: 8 }],
    uniquePower: null,
    sortOrder: 3,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000011',
    slug: 'hydrostatic-seal-plate',
    name: 'Hydrostatic Seal Plate',
    flavorText: 'Depth is not an enemy. Depth is the kiln.',
    visualType: 'carapace',
    rarity: 'legendary',
    primaryStat: 94,
    affixes: [{ stat: 'intelligence', value: 10 }],
    uniquePower: {
      name: 'Pressure Calcifies',
      description: 'The harder the current, the tighter this plate sets. Surface weather cannot pry it open.',
    },
    sortOrder: 4,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000004',
    slug: 'training-pincers',
    name: 'Training Pincers',
    flavorText: 'Practice clamps for initiates who are still learning to finish.',
    visualType: 'pincer',
    rarity: 'common',
    primaryStat: 14,
    affixes: [],
    uniquePower: null,
    sortOrder: 5,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000005',
    slug: 'hydraulic-crush-claws',
    name: 'Hydraulic Crush Claws',
    flavorText: 'They close once. The goal does not escape.',
    visualType: 'pincer',
    rarity: 'rare',
    primaryStat: 48,
    affixes: [{ stat: 'speed', value: 5 }],
    uniquePower: null,
    sortOrder: 6,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000006',
    slug: 'synapse-shear-claws',
    name: 'Synapse-Shear Claws',
    flavorText: 'Legendary torque. Soft deadlines do not survive contact.',
    visualType: 'pincer',
    rarity: 'legendary',
    primaryStat: 96,
    affixes: [{ stat: 'speed', value: 8 }],
    uniquePower: {
      name: 'Zero-Latency Clamp',
      description: 'The first grip of a session closes without hesitation. There is no gap between seeing the work and taking it.',
    },
    sortOrder: 7,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000012',
    slug: 'silt-maul',
    name: 'Silt Maul',
    flavorText: 'A blunt instrument for mornings that will not start themselves.',
    visualType: 'hammer',
    rarity: 'uncommon',
    primaryStat: 32,
    affixes: [{ stat: 'defense', value: 4 }],
    uniquePower: null,
    sortOrder: 8,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000013',
    slug: 'tideforge-hammer',
    name: 'Tideforge Hammer',
    flavorText: 'Forged where current meets iron. One strike, one finished task.',
    visualType: 'hammer',
    rarity: 'rare',
    primaryStat: 54,
    affixes: [{ stat: 'defense', value: 6 }],
    uniquePower: null,
    sortOrder: 9,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000007',
    slug: 'soft-shell-visor',
    name: 'Soft-Shell Visor',
    flavorText: 'Filters the loudest currents so a young mind can think.',
    visualType: 'helm',
    rarity: 'common',
    primaryStat: 11,
    affixes: [],
    uniquePower: null,
    sortOrder: 10,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000008',
    slug: 'architect-crown-plate',
    name: 'Architect Crown Plate',
    flavorText: 'A calm brow for builders who stack systems instead of tabs.',
    visualType: 'helm',
    rarity: 'rare',
    primaryStat: 44,
    affixes: [{ stat: 'perception', value: 6 }],
    uniquePower: null,
    sortOrder: 11,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000009',
    slug: 'oracle-dome-lattice',
    name: 'Oracle Dome Lattice',
    flavorText: 'Thought arrives quiet and leaves finished.',
    visualType: 'helm',
    rarity: 'legendary',
    primaryStat: 88,
    affixes: [{ stat: 'perception', value: 10 }],
    uniquePower: {
      name: 'Quiet Arrival',
      description: 'Thought reaches the dome already complete. Surface chatter never crosses the lattice.',
    },
    sortOrder: 12,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-00000000000a',
    slug: 'silt-walker-greaves',
    name: 'Silt-Walker Greaves',
    flavorText: 'Steady steps through muddy mornings.',
    visualType: 'greaves',
    rarity: 'common',
    primaryStat: 13,
    affixes: [],
    uniquePower: null,
    sortOrder: 13,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-00000000000b',
    slug: 'current-cutter-legs',
    name: 'Current-Cutter Legs',
    flavorText: 'They find the short path through the noise.',
    visualType: 'greaves',
    rarity: 'uncommon',
    primaryStat: 31,
    affixes: [{ stat: 'attack', value: 4 }],
    uniquePower: null,
    sortOrder: 14,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-00000000000c',
    slug: 'void-stride-articulation',
    name: 'Void-Stride Articulation',
    flavorText: 'Epic locomotion for initiates who refuse to linger on the surface.',
    visualType: 'greaves',
    rarity: 'epic',
    primaryStat: 68,
    affixes: [{ stat: 'perception', value: 8 }],
    uniquePower: null,
    sortOrder: 15,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-00000000000d',
    slug: 'larval-feelers',
    name: 'Larval Feelers',
    flavorText: 'They twitch at the first hint of distraction.',
    visualType: 'antennae',
    rarity: 'common',
    primaryStat: 10,
    affixes: [],
    uniquePower: null,
    sortOrder: 16,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-00000000000e',
    slug: 'depth-sense-antennae',
    name: 'Depth-Sense Antennae',
    flavorText: 'You notice the quiet work before the loud demand.',
    visualType: 'antennae',
    rarity: 'uncommon',
    primaryStat: 26,
    affixes: [{ stat: 'intelligence', value: 4 }],
    uniquePower: null,
    sortOrder: 17,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-00000000000f',
    slug: 'benthic-radar-array',
    name: 'Benthic Radar Array',
    flavorText: 'Rare perception. Surface chatter never reaches the core.',
    visualType: 'antennae',
    rarity: 'rare',
    primaryStat: 52,
    affixes: [{ stat: 'speed', value: 6 }],
    uniquePower: null,
    sortOrder: 18,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000010',
    slug: 'ascendant-signal-crown',
    name: 'Ascendant Signal Crown',
    flavorText: 'Antennae that hear what matters and ignore the melt.',
    visualType: 'antennae',
    rarity: 'epic',
    primaryStat: 74,
    affixes: [{ stat: 'intelligence', value: 8 }],
    uniquePower: null,
    sortOrder: 19,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000014',
    slug: 'larval-chitin-cincture',
    name: 'Larval Chitin Cincture',
    flavorText: 'A snug ventral sash keeping the abdominal plates locked under depth.',
    visualType: 'belt',
    rarity: 'common',
    primaryStat: 11,
    affixes: [],
    uniquePower: null,
    sortOrder: 20,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000016',
    slug: 'silt-tension-vent-sash',
    name: 'Silt-Tension Vent Sash',
    flavorText: 'Woven from flexible hydrothermal cords. Keeps the abdominal plates stable during rapid descent.',
    visualType: 'belt',
    rarity: 'uncommon',
    primaryStat: 27,
    affixes: [{ stat: 'defense', value: 4 }],
    uniquePower: null,
    sortOrder: 21,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000015',
    slug: 'abyssal-clasp-girdle',
    name: 'Abyssal Clasp Girdle',
    flavorText: 'Forged from tempered chitin ribs. Secures the core when pressure mounts.',
    visualType: 'belt',
    rarity: 'rare',
    primaryStat: 46,
    affixes: [{ stat: 'speed', value: 4 }],
    uniquePower: null,
    sortOrder: 22,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000017',
    slug: 'hydrostatic-girdle-lattice',
    name: 'Hydrostatic Girdle Lattice',
    flavorText: 'Pressure-sealed titanium ribs distribute benthic torque evenly across the chassis core.',
    visualType: 'belt',
    rarity: 'epic',
    primaryStat: 70,
    affixes: [{ stat: 'intelligence', value: 8 }],
    uniquePower: null,
    sortOrder: 23,
  }),
  piece({
    id: 'a1000000-0000-4000-8000-000000000018',
    slug: 'core-lock-vent-harness',
    name: 'Core-Lock Vent Harness',
    flavorText: 'Legendary ventral plating. The deep core does not buckle.',
    visualType: 'belt',
    rarity: 'legendary',
    primaryStat: 92,
    affixes: [{ stat: 'defense', value: 10 }],
    uniquePower: {
      name: 'Zero-Strain Bulkhead',
      description: 'When abdominal torque peaks, internal pressure vents automatically. Your core never fractures under sudden load.',
    },
    sortOrder: 24,
  }),
]

/** Catalog IDs granted into an empty (or incomplete) vault on chassis load. */
export const STARTER_EQUIPMENT_CATALOG_IDS: string[] = [
  'a1000000-0000-4000-8000-000000000001', // larval plate
  'a1000000-0000-4000-8000-000000000004', // training pincers
  'a1000000-0000-4000-8000-000000000007', // soft-shell visor
  'a1000000-0000-4000-8000-00000000000a', // silt-walker greaves
  'a1000000-0000-4000-8000-00000000000d', // larval feelers
  'a1000000-0000-4000-8000-000000000014', // larval chitin cincture
  'a1000000-0000-4000-8000-000000000002', // tide-braced carapace
  'a1000000-0000-4000-8000-000000000012', // silt maul
  'a1000000-0000-4000-8000-00000000000e', // depth-sense antennae
  'a1000000-0000-4000-8000-000000000005', // hydraulic crush claws
  'a1000000-0000-4000-8000-000000000008', // architect crown plate
  'a1000000-0000-4000-8000-00000000000f', // benthic radar
  'a1000000-0000-4000-8000-000000000006', // synapse-shear claws (legendary)
  'a1000000-0000-4000-8000-000000000009', // oracle dome lattice (legendary)
  'a1000000-0000-4000-8000-000000000011', // hydrostatic seal plate (legendary)
  'a1000000-0000-4000-8000-000000000018', // core-lock vent harness (legendary)
]

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
  }
}
