/**
 * Molt Credit packs. Credits are bought with real money and spend exactly like Chitin Gems,
 * at the same prices, so the market keeps one price list. Gems are spent first.
 *
 * Prices follow the usual ladder: a small entry pack, then a growing bonus on larger packs.
 */
export interface MoltCreditPack {
  id: string
  name: string
  credits: number
  /** Price in US cents, sent to Stripe Checkout as an inline price. */
  priceCents: number
  /** Extra credits compared with the entry pack's rate, shown as a percentage. */
  bonusPercent: number
}

export const MOLT_CREDIT_PACKS: MoltCreditPack[] = [
  { id: 'pouch', name: 'Pouch', credits: 200, priceCents: 199, bonusPercent: 0 },
  { id: 'satchel', name: 'Satchel', credits: 550, priceCents: 499, bonusPercent: 10 },
  { id: 'chest', name: 'Chest', credits: 1200, priceCents: 999, bonusPercent: 20 },
  { id: 'hoard', name: 'Hoard', credits: 2600, priceCents: 1999, bonusPercent: 30 },
]

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
