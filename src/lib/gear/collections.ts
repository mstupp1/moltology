/**
 * Shop collections: themed sets of pieces sold together. A piece joins by naming the collection
 * in its `collection` field; the shop filter and the collection's bundle are built from that.
 */
export interface GearCollection {
  id: string
  name: string
  /** One line for the shop tile. */
  blurb: string
  /** Off the total of buying each piece on its own. */
  discountPercent: number
}

/** One collection per benefit page costume (src/components/benefits/kits/<kit>), by kit. */
export const GEAR_COLLECTIONS: GearCollection[] = [
  { id: 'collection-01', name: 'Collection 01', blurb: 'Cream trench, charcoal coat, dark glasses. The fashion look.', discountPercent: 20 },
  { id: 'season-1', name: 'Season 1', blurb: 'Glowing hero armour and a headset for ranked nights.', discountPercent: 20 },
  { id: 'heavy-day', name: 'Heavy Day', blurb: 'Lifting belt, taped claws and knee sleeves for training day.', discountPercent: 20 },
  { id: 'clinic-whites', name: 'Clinic Whites', blurb: 'A pressed white coat, wire glasses and a clipboard.', discountPercent: 20 },
  { id: 'full-can', name: 'Full Can', blurb: 'Four flavour tanks, a cold can and loud hi-tops.', discountPercent: 20 },
]

export function gearCollection(id: string): GearCollection | undefined {
  return GEAR_COLLECTIONS.find((c) => c.id === id)
}
