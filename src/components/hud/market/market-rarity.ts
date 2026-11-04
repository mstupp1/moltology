import type { EquipmentRarity } from '@/db/schema'

/**
 * Market frames by rarity. Rarer pieces get a stronger edge; legendary gets a slow foil
 * sweep (see market.css). Resting frames never glow.
 */
export const RARITY_FRAME: Record<EquipmentRarity, { frame: string; text: string; dot: string }> = {
  common: { frame: 'border-line', text: 'text-ink-muted', dot: 'bg-ink-muted' },
  uncommon: { frame: 'border-emerald-400/55', text: 'text-emerald-300', dot: 'bg-emerald-300' },
  rare: { frame: 'border-sky-400/65', text: 'text-sky-300', dot: 'bg-sky-300' },
  epic: { frame: 'border-violet-400/75 market-frame-epic', text: 'text-violet-300', dot: 'bg-violet-300' },
  legendary: { frame: 'border-amber-300/85 market-frame-legendary', text: 'text-amber-200', dot: 'bg-amber-200' },
}
