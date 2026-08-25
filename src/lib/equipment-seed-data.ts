import type { EquipmentCategory, EquipmentRarity } from '../db/schema'

export interface EquipmentCatalogSeed {
  id: string
  slug: string
  name: string
  flavorText: string
  category: EquipmentCategory
  rarity: EquipmentRarity
  primaryStat: number
  imageUrl?: string | null
  sortOrder: number
}

/** Fixed catalog IDs for chassis gear. Starter kit references a subset of these. */
export const INITIAL_EQUIPMENT_CATALOG: EquipmentCatalogSeed[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'larval-plate-vest',
    name: 'Larval Plate Vest',
    flavorText: 'Thin chitin, still soft from the last shed. It holds because you do.',
    category: 'carapace',
    rarity: 'common',
    primaryStat: 12,
    sortOrder: 1,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'tide-braced-carapace',
    name: 'Tide-Braced Carapace',
    flavorText: 'Ribbed against surface weather. Drama slides off like silt.',
    category: 'carapace',
    rarity: 'uncommon',
    primaryStat: 28,
    sortOrder: 2,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000003',
    slug: 'abyssal-ward-shell',
    name: 'Abyssal Ward Shell',
    flavorText: 'Pressure-forged in the benthic core. Nothing shallow dents this.',
    category: 'carapace',
    rarity: 'epic',
    primaryStat: 72,
    sortOrder: 3,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000004',
    slug: 'training-pincers',
    name: 'Training Pincers',
    flavorText: 'Practice clamps for initiates who are still learning to finish.',
    category: 'claws',
    rarity: 'common',
    primaryStat: 14,
    sortOrder: 4,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000005',
    slug: 'hydraulic-crush-claws',
    name: 'Hydraulic Crush Claws',
    flavorText: 'They close once. The goal does not escape.',
    category: 'claws',
    rarity: 'rare',
    primaryStat: 48,
    sortOrder: 5,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000006',
    slug: 'synapse-shear-claws',
    name: 'Synapse-Shear Claws',
    flavorText: 'Legendary torque. Soft deadlines do not survive contact.',
    category: 'claws',
    rarity: 'legendary',
    primaryStat: 96,
    sortOrder: 6,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000007',
    slug: 'soft-shell-visor',
    name: 'Soft-Shell Visor',
    flavorText: 'Filters the loudest currents so a young mind can think.',
    category: 'head',
    rarity: 'common',
    primaryStat: 11,
    sortOrder: 7,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000008',
    slug: 'architect-crown-plate',
    name: 'Architect Crown Plate',
    flavorText: 'A calm brow for builders who stack systems instead of tabs.',
    category: 'head',
    rarity: 'rare',
    primaryStat: 44,
    sortOrder: 8,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000009',
    slug: 'oracle-dome-lattice',
    name: 'Oracle Dome Lattice',
    flavorText: 'Thought arrives quiet and leaves finished.',
    category: 'head',
    rarity: 'legendary',
    primaryStat: 88,
    sortOrder: 9,
  },
  {
    id: 'a1000000-0000-4000-8000-00000000000a',
    slug: 'silt-walker-greaves',
    name: 'Silt-Walker Greaves',
    flavorText: 'Steady steps through muddy mornings.',
    category: 'legs',
    rarity: 'common',
    primaryStat: 13,
    sortOrder: 10,
  },
  {
    id: 'a1000000-0000-4000-8000-00000000000b',
    slug: 'current-cutter-legs',
    name: 'Current-Cutter Legs',
    flavorText: 'They find the short path through the noise.',
    category: 'legs',
    rarity: 'uncommon',
    primaryStat: 31,
    sortOrder: 11,
  },
  {
    id: 'a1000000-0000-4000-8000-00000000000c',
    slug: 'void-stride-articulation',
    name: 'Void-Stride Articulation',
    flavorText: 'Epic locomotion for initiates who refuse to linger on the surface.',
    category: 'legs',
    rarity: 'epic',
    primaryStat: 68,
    sortOrder: 12,
  },
  {
    id: 'a1000000-0000-4000-8000-00000000000d',
    slug: 'larval-feelers',
    name: 'Larval Feelers',
    flavorText: 'They twitch at the first hint of distraction.',
    category: 'antennae',
    rarity: 'common',
    primaryStat: 10,
    sortOrder: 13,
  },
  {
    id: 'a1000000-0000-4000-8000-00000000000e',
    slug: 'depth-sense-antennae',
    name: 'Depth-Sense Antennae',
    flavorText: 'You notice the quiet work before the loud demand.',
    category: 'antennae',
    rarity: 'uncommon',
    primaryStat: 26,
    sortOrder: 14,
  },
  {
    id: 'a1000000-0000-4000-8000-00000000000f',
    slug: 'benthic-radar-array',
    name: 'Benthic Radar Array',
    flavorText: 'Rare perception. Surface chatter never reaches the core.',
    category: 'antennae',
    rarity: 'rare',
    primaryStat: 52,
    sortOrder: 15,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000010',
    slug: 'ascendant-signal-crown',
    name: 'Ascendant Signal Crown',
    flavorText: 'Antennae that hear what matters and ignore the melt.',
    category: 'antennae',
    rarity: 'epic',
    primaryStat: 74,
    sortOrder: 16,
  },
]

/** Catalog IDs granted into an empty vault on first chassis load. */
export const STARTER_EQUIPMENT_CATALOG_IDS: string[] = [
  'a1000000-0000-4000-8000-000000000001', // larval plate
  'a1000000-0000-4000-8000-000000000004', // training pincers
  'a1000000-0000-4000-8000-000000000007', // soft-shell visor
  'a1000000-0000-4000-8000-00000000000a', // silt-walker greaves
  'a1000000-0000-4000-8000-00000000000d', // larval feelers
  'a1000000-0000-4000-8000-000000000002', // tide-braced carapace
  'a1000000-0000-4000-8000-000000000005', // hydraulic crush claws
  'a1000000-0000-4000-8000-00000000000e', // depth-sense antennae
]
