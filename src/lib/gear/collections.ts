/**
 * Shop collections: themed sets of pieces sold together. A piece joins by naming the collection
 * in its `collection` field; the shop filter and the collection's bundle are built from that.
 */
import type { BenefitKit } from '../benefits/types'

export interface GearCollection {
  id: string
  /** The benefit page costume the collection comes from; its pages show the collection. */
  kit: BenefitKit
  name: string
  /** One line for the shop tile. */
  blurb: string
  /** Off the total of buying each piece on its own. */
  discountPercent: number
}

/** One collection per benefit page costume (src/components/benefits/kits/<kit>), by kit. */
export const GEAR_COLLECTIONS: GearCollection[] = [
  { id: 'collection-01', kit: 'atelier', name: 'Collection 01', blurb: 'Cream trench, charcoal coat, dark glasses. The fashion look.', discountPercent: 20 },
  { id: 'season-1', kit: 'arcade', name: 'Season 1', blurb: 'Glowing hero armour and a headset for ranked nights.', discountPercent: 20 },
  { id: 'heavy-day', kit: 'locker', name: 'Heavy Day', blurb: 'Lifting belt, taped claws and knee sleeves for training day.', discountPercent: 20 },
  { id: 'clinic-whites', kit: 'clinic', name: 'Clinic Whites', blurb: 'A pressed white coat, wire glasses and a clipboard.', discountPercent: 20 },
  { id: 'full-can', kit: 'can', name: 'Full Can', blurb: 'Four flavour tanks, a cold can and loud hi-tops.', discountPercent: 20 },
  { id: 'linen-hours', kit: 'retreat', name: 'Linen Hours', blurb: 'A linen wrap, a wide straw hat and tea on the porch.', discountPercent: 20 },
  { id: 'private-client', kit: 'ledger', name: 'Private Client', blurb: 'A navy suit, a gold buckle and a watering can for the long game.', discountPercent: 20 },
  { id: 'workflow', kit: 'platform', name: 'Workflow', blurb: 'Glass panels round the antennae, a holo visor and a zip hoodie.', discountPercent: 20 },
  { id: 'main-stage', kit: 'seminar', name: 'Main Stage', blurb: 'A stage blazer, a headset mic and the book everyone is quoting.', discountPercent: 20 },
  { id: 'bonfire', kit: 'network', name: 'Bonfire', blurb: 'A beach hoodie, a bucket hat and a marshmallow on a stick.', discountPercent: 20 },
]

export function gearCollection(id: string): GearCollection | undefined {
  return GEAR_COLLECTIONS.find((c) => c.id === id)
}

export function collectionForKit(kit: BenefitKit): GearCollection | undefined {
  return GEAR_COLLECTIONS.find((c) => c.kit === kit)
}
