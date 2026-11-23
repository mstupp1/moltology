/**
 * Named colour sets. Pieces in one set share a palette so they match, and a palette change
 * recolours the whole set at once. Original pieces keep their own inline colours.
 */
import type { GearColours } from './types'

export const GEAR_PALETTES: Readonly<Record<string, GearColours>> = {
  // Collection 01 (atelier): cream, charcoal and black, no shine.
  'atelier-cream': { material: '#e6d8bd', trim: '#a8865a', accent: '#3a2c22' },
  'atelier-charcoal': { material: '#3a3c42', trim: '#1d1e22', accent: '#cfc8bb' },
  'atelier-noir': { material: '#17171a', trim: '#2e2e33', accent: '#24262c' },
  'atelier-leather': { material: '#2b221e', trim: '#4b3a30', accent: '#3a2c24' },
  // Season 1 (arcade): teal armour, hot orange trim, cyan light.
  'season-1': { material: '#1d6670', trim: '#ff8a3d', accent: '#5ff6ff' },
  'season-1-pad': { material: '#20242c', trim: '#ff8a3d', accent: '#5ff6ff' },
  // Heavy Day (locker): black and volt, worn leather, white tape.
  'heavy-day-volt': { material: '#17191c', trim: '#d4ff3a', accent: '#d4ff3a' },
  'heavy-day-leather': { material: '#3b2a1f', trim: '#c8c2b6', accent: '#d4ff3a' },
  'heavy-day-tape': { material: '#efece4', trim: '#d6d1c6', accent: '#b9b3a6' },
  // Clinic Whites (clinic): white coat, silver wire, mint.
  'clinic-white': { material: '#f2f3ef', trim: '#c9d2d5', accent: '#6fa8ba' },
  'clinic-wire': { material: '#a3acb5', trim: '#7f8891', accent: '#dfe9ee' },
  'clinic-board': { material: '#b7875a', trim: '#c3c9cf', accent: '#fbfaf6' },
  'clinic-mint': { material: '#bfe3dc', trim: '#8fc4ba', accent: '#f2f3ef' },
  // Full Can (can): one palette per flavour, white and hot pink extras.
  'can-lime': { material: '#a9e22f', trim: '#1b1d1f', accent: '#ffffff' },
  'can-berry': { material: '#c21f62', trim: '#1b1d1f', accent: '#ffd1e3' },
  'can-citrus': { material: '#ff9a1f', trim: '#1b1d1f', accent: '#fff1c9' },
  'can-ice': { material: '#83d6fb', trim: '#1b1d1f', accent: '#ffffff' },
  'can-sweatband': { material: '#fbfbf8', trim: '#ff3d7f', accent: '#ff3d7f' },
  'can-hi-tops': { material: '#fbfbf8', trim: '#ff3d7f', accent: '#2cc4ff' },
  // Linen Hours (retreat): undyed linen, sage, clay, straw.
  'retreat-linen': { material: '#ece4d4', trim: '#8f4c34', accent: '#6b7a60' },
  'retreat-straw': { material: '#d8c193', trim: '#55624d', accent: '#8f4c34' },
  'retreat-cord': { material: '#9a5a3e', trim: '#c9a27a', accent: '#ece4d4' },
  'retreat-cup': { material: '#f4efe6', trim: '#6b7a60', accent: '#a8743a' },
  // Private Client (ledger): navy wool, gold hardware, money green.
  'ledger-navy': { material: '#1d2a45', trim: '#d4af37', accent: '#f4f6f2' },
  'ledger-belt': { material: '#2b1e17', trim: '#d4af37', accent: '#f1d77a' },
  'ledger-can': { material: '#0f7a48', trim: '#d4af37', accent: '#7fd6a4' },
  'ledger-tortoise': { material: '#6a3d1e', trim: '#d4af37', accent: '#e9dcc7' },
  // Workflow (platform): near-black, violet and blue glass, steel.
  'platform-hoodie': { material: '#1a1a24', trim: '#c9c9d6', accent: '#8b5cf6' },
  'platform-glass': { material: '#1a1a26', trim: '#9aa6ff', accent: '#8b5cf6' },
  'platform-visor': { material: '#1a1a26', trim: '#3b82f6', accent: '#a78bfa' },
  'platform-lanyard': { material: '#8b5cf6', trim: '#c9c9d6', accent: '#f4f4f7' },
  // Main Stage (seminar): navy, gold, cream, orange.
  'seminar-navy': { material: '#14234b', trim: '#ffcf2e', accent: '#fff8e8' },
  'seminar-mic': { material: '#22252c', trim: '#a9aeb7', accent: '#ffcf2e' },
  'seminar-book': { material: '#ff8a1f', trim: '#ffcf2e', accent: '#fff8e8' },
  'seminar-lanyard': { material: '#ffcf2e', trim: '#c9c9d6', accent: '#fff8e8' },
  // Bonfire (network): sunset orange, violet, pink.
  'network-hoodie': { material: '#ff9a3c', trim: '#ff4f9a', accent: '#fff3e2' },
  'network-bucket': { material: '#6b3cff', trim: '#ff4f9a', accent: '#ffffff' },
  'network-phone': { material: '#1b1530', trim: '#c9c3dd', accent: '#ff4f9a' },
  'network-marshmallow': { material: '#8a5a33', trim: '#c9c3dd', accent: '#fff6ea' },
}

/** A piece's colours, whether inline or named. Throws on an unknown palette name. */
export function resolveColours(colours: GearColours | string): GearColours {
  if (typeof colours !== 'string') return colours
  const palette = GEAR_PALETTES[colours]
  if (!palette) throw new Error(`Unknown gear palette "${colours}"`)
  return palette
}
