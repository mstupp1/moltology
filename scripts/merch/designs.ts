/**
 * Print file designs for merch. Each design is a canvas (Printful print area at 300 dpi) and
 * layers placed on it. Layers are repo SVGs from the Synaptic Path kit or bucket images
 * (fetched through moltology.org/media so the bucket's transfer quota is spared).
 *
 * Add a design here, point a catalog variant's `design` at it, then run
 * `npm run merch -- print --only <key>`.
 */

export type MerchLayerSource = { repo: string } | { media: string }

export interface MerchLayer {
  source: MerchLayerSource
  /** Center of the layer, as a fraction of the canvas. */
  cx: number
  cy: number
  /** Box the layer is fitted inside, as a fraction of the canvas. */
  maxWidth: number
  maxHeight: number
}

export interface MerchDesign {
  key: string
  /** What the mockup generator should call the blank. */
  blank: 'mug' | 'tee' | 'hat' | 'deskMat'
  width: number
  height: number
  /** Solid wrap color, or null for a transparent print file. */
  background: string | null
  layers: MerchLayer[]
}

const KIT = 'content/brand/synaptic-path'

/** 11 oz mug wrap. The two faces sit at a quarter and three quarters across. */
const MUG = { width: 2700, height: 1050 }
/** Tee front print area, 12 x 16 in. */
const TEE = { width: 3600, height: 4800 }

const face = (side: 'left' | 'right', source: MerchLayerSource, scale = 0.72): MerchLayer => ({
  source,
  cx: side === 'left' ? 0.25 : 0.75,
  cy: 0.5,
  maxWidth: 0.42,
  maxHeight: scale,
})

export const MERCH_DESIGNS: MerchDesign[] = [
  {
    key: 'hat-moltology-v1', blank: 'hat', width: 1650, height: 600, background: null,
    layers: [{ source: { repo: `${KIT}/parts/icon.svg` }, cx: 0.5, cy: 0.5, maxWidth: 0.31, maxHeight: 0.85 }],
  },
  {
    key: 'desk-mat-moltology-v1', blank: 'deskMat', width: 9921, height: 5197, background: '#0b1114',
    layers: [
      { source: { repo: 'content/merch/art/desk-mat-contours-v1.svg' }, cx: 0.5, cy: 0.5, maxWidth: 1, maxHeight: 1 },
      { source: { repo: `${KIT}/parts/icon.svg` }, cx: 0.785, cy: 0.80, maxWidth: 0.045, maxHeight: 0.09 },
      { source: { repo: `${KIT}/parts/merch-v2/moltology-stacked-dark.svg` }, cx: 0.88, cy: 0.80, maxWidth: 0.115, maxHeight: 0.12 },
    ],
  },
  // Approved site wordmark: 54 source pixels of clear space below the g/y descenders.
  ...[{ key: 'mug-moltology-v2', height: 1050 }, { key: 'mug-moltology-v2-15oz', height: 1140 }].map(({ key, height }): MerchDesign => ({
    key, blank: 'mug', width: 2700, height, background: '#ffffff',
    layers: [
      face('left', { repo: `${KIT}/parts/icon.svg` }, 0.72),
      { source: { repo: `${KIT}/parts/merch-v2/moltology-stacked-light.svg` }, cx: 0.75, cy: 0.5, maxWidth: 0.43, maxHeight: 0.60 },
    ],
  })),
  {
    key: 'tee-moltology-v2', blank: 'tee', ...TEE, background: null,
    layers: [
      { source: { repo: `${KIT}/parts/icon.svg` }, cx: 0.5, cy: 0.24, maxWidth: 0.42, maxHeight: 0.30 },
      { source: { repo: `${KIT}/parts/merch-v2/moltology-stacked-dark.svg` }, cx: 0.5, cy: 0.51, maxWidth: 0.70, maxHeight: 0.21 },
    ],
  },

  {
    key: 'mug-synaptic-mark',
    blank: 'mug',
    ...MUG,
    background: '#ffffff',
    layers: [
      face('left', { repo: `${KIT}/parts/icon.svg` }, 0.72),
      face('right', { repo: `${KIT}/parts/primary.svg` }, 0.32),
    ],
  },
  {
    key: 'mug-synaptic-mark-15oz',
    blank: 'mug',
    width: 2700,
    height: 1140,
    background: '#ffffff',
    layers: [
      face('left', { repo: `${KIT}/parts/icon.svg` }, 0.72),
      face('right', { repo: `${KIT}/parts/primary.svg` }, 0.32),
    ],
  },
  {
    key: 'tee-synaptic-mark',
    blank: 'tee',
    ...TEE,
    background: null,
    layers: [
      { source: { repo: `${KIT}/parts/icon.svg` }, cx: 0.5, cy: 0.24, maxWidth: 0.42, maxHeight: 0.30 },
      { source: { repo: `${KIT}/parts/variants/primary-white.svg` }, cx: 0.5, cy: 0.44, maxWidth: 0.7, maxHeight: 0.10 },
    ],
  },
  {
    key: 'mug-synaptic-path',
    blank: 'mug',
    ...MUG,
    background: '#0b1114',
    layers: [
      face('left', { repo: `${KIT}/lockups/stacked-none-dark.svg` }),
      face('right', { repo: `${KIT}/lockups/stacked-none-dark.svg` }),
    ],
  },
  {
    key: 'mug-circuit-claw',
    blank: 'mug',
    ...MUG,
    background: '#0b1114',
    layers: [
      face('left', { media: 'images/ascended_claw_vector_transparent.png' }, 0.8),
      face('right', { repo: `${KIT}/lockups/stacked-none-dark.svg` }, 0.6),
    ],
  },
  {
    key: 'mug-foundation',
    blank: 'mug',
    ...MUG,
    background: '#ffffff',
    layers: [
      face('left', { repo: `${KIT}/lockups/horizontal-foundation-light.svg` }, 0.5),
      face('right', { repo: `${KIT}/lockups/horizontal-foundation-light.svg` }, 0.5),
    ],
  },
  {
    key: 'mug-navigator',
    blank: 'mug',
    ...MUG,
    background: '#ffffff',
    layers: [
      face('left', { media: 'images/characters/char_lobster_navigator_adult_v2.webp' }, 0.86),
      face('right', { repo: `${KIT}/lockups/stacked-none-light.svg` }, 0.6),
    ],
  },
  {
    key: 'tee-emblem-chest',
    blank: 'tee',
    ...TEE,
    background: null,
    // Wearer's left chest is the viewer's right.
    layers: [{ source: { repo: `${KIT}/parts/icon.svg` }, cx: 0.7, cy: 0.12, maxWidth: 0.26, maxHeight: 0.18 }],
  },
  {
    key: 'tee-lockup-dark',
    blank: 'tee',
    ...TEE,
    background: null,
    layers: [{ source: { repo: `${KIT}/lockups/stacked-none-dark.svg` }, cx: 0.5, cy: 0.2, maxWidth: 0.7, maxHeight: 0.3 }],
  },
  {
    key: 'tee-lockup-light',
    blank: 'tee',
    ...TEE,
    background: null,
    layers: [{ source: { repo: `${KIT}/lockups/stacked-none-light.svg` }, cx: 0.5, cy: 0.2, maxWidth: 0.7, maxHeight: 0.3 }],
  },
  {
    key: 'tee-circuit-claw',
    blank: 'tee',
    ...TEE,
    background: null,
    layers: [
      { source: { media: 'images/ascended_claw_vector_transparent.png' }, cx: 0.5, cy: 0.3, maxWidth: 0.94, maxHeight: 0.42 },
      { source: { repo: `${KIT}/parts/variants/primary-white.svg` }, cx: 0.5, cy: 0.57, maxWidth: 0.6, maxHeight: 0.05 },
    ],
  },
]

export function getMerchDesign(key: string): MerchDesign | undefined {
  return MERCH_DESIGNS.find((design) => design.key === key)
}
