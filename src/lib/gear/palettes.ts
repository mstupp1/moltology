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
  // Deep Diver: polished brass and copper, oiled canvas, lead grey.
  'diver-brass': { material: '#c08a3e', trim: '#9a5a2e', accent: '#bfe7f0' },
  'diver-canvas': { material: '#b9a582', trim: '#c08a3e', accent: '#3a2e24' },
  'diver-boots': { material: '#4a4b4f', trim: '#2b2c30', accent: '#c08a3e' },
  'diver-lantern': { material: '#c08a3e', trim: '#9a5a2e', accent: '#ffcf6e' },
  'diver-belt': { material: '#55575c', trim: '#c08a3e', accent: '#c08a3e' },
  // Tidepool Summer: sea green, coral, sand, sun yellow.
  'tidepool-hibiscus': { material: '#1f8a83', trim: '#ffd25e', accent: '#ff7a6b' },
  'tidepool-dots': { material: '#f4ead6', trim: '#ff7a6b', accent: '#fff6e6' },
  'tidepool-stripes': { material: '#f6f2e8', trim: '#2f6fb5', accent: '#ffffff' },
  'tidepool-sandals': { material: '#c79b62', trim: '#8a6338', accent: '#ffd25e' },
  'tidepool-flowers': { material: '#ff8fb1', trim: '#5b8a3c', accent: '#fff2a8' },
  'tidepool-shades': { material: '#4fd1b5', trim: '#2a9c84', accent: '#1d3b44' },
  'tidepool-lolly': { material: '#ff7a6b', trim: '#ffffff', accent: '#ffd25e' },
  // Codex Scholar: ink blue robes, old gold, parchment.
  'scholar-ink': { material: '#24304f', trim: '#c9a24a', accent: '#e9dcc0' },
  'scholar-sand': { material: '#cbb48a', trim: '#7a5a34', accent: '#f1e7d2' },
  'scholar-staff': { material: '#6a4a2e', trim: '#c9a24a', accent: '#8ff0e0' },
  'scholar-brass': { material: '#c9a24a', trim: '#8d6f2c', accent: '#e9f0ee' },
  'scholar-tome': { material: '#5b2a2a', trim: '#c9a24a', accent: '#efe4cc' },
  'scholar-cord': { material: '#c9a24a', trim: '#8d6f2c', accent: '#e9dcc0' },
  // Molt Street: black, volt, cream, safety orange.
  'street-black': { material: '#1b1c1f', trim: '#cfd3d8', accent: '#ff6a1a' },
  'street-volt': { material: '#c8f13a', trim: '#1b1c1f', accent: '#1b1c1f' },
  'street-cream': { material: '#ece4d3', trim: '#6b5a44', accent: '#6b5a44' },
  'street-cap': { material: '#1b1c1f', trim: '#1b1c1f', accent: '#ff6a1a' },
  'street-cap-orange': { material: '#ff6a1a', trim: '#1b1c1f', accent: '#ffffff' },
  'street-plaid': { material: '#a12a2a', trim: '#1b1c1f', accent: '#f1e7d2' },
  'street-denim': { material: '#4a6b94', trim: '#b8743a', accent: '#e8e2d4' },
  'street-hi-tops': { material: '#ff6a1a', trim: '#f4f4f1', accent: '#1b1c1f' },
  // Polar Shelf: oatmeal knit, navy, berry red, fleece white.
  'polar-oat': { material: '#d9cbb0', trim: '#b9a988', accent: '#f4efe4' },
  'polar-navy': { material: '#22345a', trim: '#f2ede2', accent: '#f2ede2' },
  'polar-scarf': { material: '#b4283f', trim: '#f2ede2', accent: '#f2ede2' },
  'polar-beanie': { material: '#22345a', trim: '#f2ede2', accent: '#b4283f' },
  'polar-boots': { material: '#6b4a32', trim: '#3a2a20', accent: '#f4efe4' },
  'polar-mug': { material: '#b4283f', trim: '#f2ede2', accent: '#fffaf0' },
  // Bioluminescent: near-black violet with cyan and magenta light.
  'lumen-violet': { material: '#1b1530', trim: '#3a2d63', accent: '#47f5ff' },
  'lumen-cyan': { material: '#121a2b', trim: '#2b3b5e', accent: '#ff5ce1' },
  'lumen-jelly': { material: '#3a2d63', trim: '#5a4a93', accent: '#47f5ff' },
  // Royal Reef: coral red, pearl, old gold, deep navy velvet.
  // Winter Molt: berry red, evergreen, snow white, candy stripe.
  'winter-red': { material: '#a3192f', trim: '#f6f2ea', accent: '#f6f2ea' },
  'winter-holly': { material: '#1f5a3a', trim: '#c8233b', accent: '#f6f2ea' },
  'winter-beanie': { material: '#f6f2ea', trim: '#c8233b', accent: '#c8233b' },
  'winter-boots': { material: '#efeae0', trim: '#6b4a32', accent: '#f8f6f0' },
  'winter-mug': { material: '#f6f2ea', trim: '#c8233b', accent: '#fffaf0' },
  'winter-gift': { material: '#1f5a3a', trim: '#e6c15c', accent: '#c8233b' },
  'winter-evergreen': { material: '#1d4a33', trim: '#f6f2ea', accent: '#a3192f' },
  'royal-coral': { material: '#e0533f', trim: '#e6c15c', accent: '#f6ecd9' },
  'royal-navy': { material: '#1d2547', trim: '#e6c15c', accent: '#b9283f' },
  'royal-pearl': { material: '#f1ead9', trim: '#e6c15c', accent: '#ff8f7a' },
  'royal-gold': { material: '#e0533f', trim: '#e6c15c', accent: '#ff8f7a' },
  'royal-plate': { material: '#e0533f', trim: '#e6c15c', accent: '#f6ecd9' },
}

/** A piece's colours, whether inline or named. Throws on an unknown palette name. */
export function resolveColours(colours: GearColours | string): GearColours {
  if (typeof colours !== 'string') return colours
  const palette = GEAR_PALETTES[colours]
  if (!palette) throw new Error(`Unknown gear palette "${colours}"`)
  return palette
}
