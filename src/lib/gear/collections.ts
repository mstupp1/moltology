/**
 * Shop collections: themed sets of pieces sold together. A piece joins by naming the collection
 * in its `collection` field; the shop filter and the collection's bundle are built from that.
 */
import type { BenefitKit } from '../benefits/types'

export interface GearCollection {
  id: string
  /** The benefit page costume the collection comes from, if any; its pages show the collection. */
  kit?: BenefitKit
  name: string
  /** One line for the shop tile. */
  blurb: string
  /** Off the total of buying each piece on its own. */
  discountPercent: number
  /**
   * A timed drop: the collection stays out of the shop until this day (YYYY-MM-DD, from midnight
   * New York time). Left out, it is on sale as soon as it ships.
   */
  releasesOn?: string
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
  // Themed sets of their own, not tied to a benefit page.
  { id: 'deep-diver', name: 'Deep Diver', blurb: 'A brass helmet, a canvas suit, lead-soled boots and a lantern for the dark.', discountPercent: 20 },
  { id: 'tidepool-summer', name: 'Tidepool Summer', blurb: 'Camp shirts in three prints, rope sandals, a flower crown and an ice lolly.', discountPercent: 20 },
  { id: 'codex-scholar', name: 'Codex Scholar', blurb: 'A hooded robe, a walking staff, brass reading glasses and a heavy tome.', discountPercent: 20 },
  { id: 'molt-street', name: 'Molt Street', blurb: 'Quilted puffers in three colours, a six-panel cap and a plaid hoodie.', discountPercent: 20 },
  { id: 'polar-shelf', name: 'Polar Shelf', blurb: 'Cable knit, a striped scarf, fleece-cuffed boots and a mug of cocoa.', discountPercent: 20 },
  { id: 'bioluminescent', name: 'Bioluminescent', blurb: 'Armour with seams that glow like deep water, and a jellyfish lantern.', discountPercent: 20 },
  { id: 'winter-molt', name: 'Winter Molt', blurb: 'A snowflake sweater, an evergreen cape, holly stripes and a gift to hand over.', discountPercent: 20, releasesOn: '2026-12-01' },
  { id: 'harvest-table', name: 'Harvest Table', blurb: 'A pilgrim hat and doublet, a buckle belt, a full turkey suit and a pumpkin pie to share.', discountPercent: 20 },
  { id: 'royal-reef', name: 'Royal Reef', blurb: 'A coral cape, a pearl crown and a sceptre for holding court.', discountPercent: 20 },
]

/** Whether a collection is on sale yet (see `releasesOn`). Unknown ids count as released. */
export function collectionReleased(id: string | undefined, now: Date = new Date()): boolean {
  const c = id ? GEAR_COLLECTIONS.find((x) => x.id === id) : undefined
  if (!c?.releasesOn) return true
  // Midnight in New York: 05:00 UTC in winter, which is when every drop so far lands.
  return now.getTime() >= Date.parse(`${c.releasesOn}T05:00:00Z`)
}

export function gearCollection(id: string): GearCollection | undefined {
  return GEAR_COLLECTIONS.find((c) => c.id === id)
}

export function collectionForKit(kit: BenefitKit): GearCollection | undefined {
  return GEAR_COLLECTIONS.find((c) => c.kit === kit)
}
