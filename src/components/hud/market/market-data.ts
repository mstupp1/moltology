import type { EquipmentRarity } from '@/lib/chassis-loadout'

export type MarketTab = 'credits' | 'exchange' | 'vault'

export interface MoltCreditPack {
  id: string
  name: string
  credits: number
  bonusCredits?: number
  priceUsd: string
  badge?: 'best-value' | 'limited' | 'popular'
  imagePath: string
}

export interface ExchangeListing {
  id: string
  name: string
  category: 'accelerator' | 'cosmetic' | 'boost' | 'material'
  description: string
  creditCost: number
  imagePath: string
  rarity: EquipmentRarity
}

export interface GemVaultItem {
  id: string
  name: string
  slot: string
  description: string
  gemCost: number
  imagePath: string
  rarity: EquipmentRarity
  exclusive?: boolean
}

export interface MaterialQuickShed {
  id: string
  name: string
  yieldCredits: number
  imagePath: string
}

export const MOLT_CREDIT_PACKS: MoltCreditPack[] = [
  {
    id: 'starter-drip',
    name: 'Starter Drip',
    credits: 500,
    priceUsd: '$0.99',
    imagePath: '/images/molt_credit.png',
  },
  {
    id: 'pincer-pouch',
    name: 'Pincer Pouch',
    credits: 1200,
    priceUsd: '$4.99',
    badge: 'popular',
    imagePath: '/images/molt_credit.png',
  },
  {
    id: 'claw-lord-cache',
    name: 'Claw-Lord Cache',
    credits: 5000,
    bonusCredits: 1000,
    priceUsd: '$19.99',
    badge: 'best-value',
    imagePath: '/images/stage3_exoshell.png',
  },
  {
    id: 'abyssal-vault',
    name: 'Abyssal Vault',
    credits: 12000,
    bonusCredits: 3000,
    priceUsd: '$49.99',
    badge: 'limited',
    imagePath: '/images/stage4_carcinization.png',
  },
  {
    id: 'ultimate-carcinization',
    name: 'Ultimate Carcinization',
    credits: 25000,
    bonusCredits: 25000,
    priceUsd: '$99.99',
    badge: 'limited',
    imagePath: '/images/stage4_carcinization.png',
  },
]

export const EXCHANGE_LISTINGS: ExchangeListing[] = [
  {
    id: 'neural-overclock',
    name: 'Neural Overclock',
    category: 'boost',
    description: '2× Molt Credit yield for seven days.',
    creditCost: 800,
    imagePath: '/images/synapse_shard.png',
    rarity: 'rare',
  },
  {
    id: 'chitin-plated-chassis',
    name: 'Chitin-Plated Chassis',
    category: 'cosmetic',
    description: 'Premium carapace finish. Style only — rank unchanged.',
    creditCost: 1200,
    imagePath: '/images/stage3_exoshell.png',
    rarity: 'epic',
  },
  {
    id: 'isolation-dome-skin',
    name: 'Isolation Dome Skin',
    category: 'cosmetic',
    description: 'Glassmorphic focus bubble overlay for your HUD.',
    creditCost: 650,
    imagePath: '/images/stage2_softshed.png',
    rarity: 'uncommon',
  },
  {
    id: 'depth-skip-pass',
    name: 'Depth Skip Pass',
    category: 'accelerator',
    description: 'Skip one routine cooldown without touching clearance.',
    creditCost: 400,
    imagePath: '/images/molt_credit.png',
    rarity: 'uncommon',
  },
  {
    id: 'pincer-ornament-gold',
    name: 'Gilded Pincer Ornament',
    category: 'cosmetic',
    description: 'Deluxe claw trim. Catalog flair — never authority.',
    creditCost: 950,
    imagePath: '/images/stage3_exoshell.png',
    rarity: 'epic',
  },
  {
    id: 'surface-noise-shield',
    name: 'Surface Noise Shield',
    category: 'boost',
    description: 'Extended isolation window for one deep-work block.',
    creditCost: 550,
    imagePath: '/images/stage2_softshed.png',
    rarity: 'rare',
  },
]

export const GEM_VAULT_ITEMS: GemVaultItem[] = [
  {
    id: 'mariana-aura',
    name: 'Mariana Singularity Aura',
    slot: 'Full Carapace',
    description: 'Apex stillness field. The deepest cosmetic in the catalog.',
    gemCost: 5000,
    imagePath: '/images/stage4_carcinization.png',
    rarity: 'legendary',
    exclusive: true,
  },
  {
    id: 'ascendant-helm',
    name: 'Ascendant Core Helm',
    slot: 'Head Hardpoint',
    description: 'Steward-tier crest. Earned prestige — never sold for credits.',
    gemCost: 3200,
    imagePath: '/images/stage4_carcinization.png',
    rarity: 'legendary',
    exclusive: true,
  },
  {
    id: 'hydraulic-pincer-skin',
    name: 'Hydraulic Pincer Skin',
    slot: 'Claw Hardpoint',
    description: '850 Nm torque visual. For members who shed in public.',
    gemCost: 1800,
    imagePath: '/images/stage3_exoshell.png',
    rarity: 'epic',
    exclusive: true,
  },
  {
    id: 'benthic-sigil',
    name: 'Benthic Council Sigil',
    slot: 'Belt Hardpoint',
    description: 'Forum steward badge rendered on your chassis.',
    gemCost: 2400,
    imagePath: '/images/stage3_exoshell.png',
    rarity: 'epic',
    exclusive: true,
  },
  {
    id: 'shell-polish-kit',
    name: 'Shell Polish Kit',
    slot: 'Carapace',
    description: 'Entry prestige finish for members who completed their first shed.',
    gemCost: 200,
    imagePath: '/images/stage1_larval.png',
    rarity: 'uncommon',
  },
  {
    id: 'larval-memorial',
    name: 'Larval Memorial Shell',
    slot: 'Carapace',
    description: 'Honors your first shed. Warm, never mockery.',
    gemCost: 900,
    imagePath: '/images/stage1_larval.png',
    rarity: 'rare',
  },
  {
    id: 'abyssal-antennae',
    name: 'Abyssal Antennae Array',
    slot: 'Antennae',
    description: 'Deep-listening finials for Exoshell Born clearances.',
    gemCost: 1400,
    imagePath: '/images/stage3_exoshell.png',
    rarity: 'epic',
    exclusive: true,
  },
]

export const MATERIAL_QUICK_SHEDS: MaterialQuickShed[] = [
  {
    id: 'hover-vehicle',
    name: 'Hover Vehicle',
    yieldCredits: 750,
    imagePath: '/images/extracted/asset_vehicle_3d.jpg',
  },
  {
    id: 'abyssal-citadel',
    name: 'Abyssal Stronghold',
    yieldCredits: 2400,
    imagePath: '/images/extracted/asset_citadel_3d.jpg',
  },
  {
    id: 'luxury-reserve',
    name: 'Luxury Reserve',
    yieldCredits: 1200,
    imagePath: '/images/extracted/asset_relic_3d.jpg',
  },
  {
    id: 'cash-reserves',
    name: 'Cash Reserves',
    yieldCredits: 500,
    imagePath: '/images/molt_credit.png',
  },
]

export const MARKET_TABS: { id: MarketTab; label: string; hint: string }[] = [
  { id: 'credits', label: 'Buy Credits', hint: 'Molt Credits are bought' },
  { id: 'exchange', label: 'Exchange', hint: 'Spend credits & shed material' },
  { id: 'vault', label: 'Gem Vault', hint: 'Chitin Gems unlock prestige' },
]
