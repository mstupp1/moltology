/** Reviewed selections and customer-facing image descriptions. Provenance stays in content/merch/. */
const root = 'images/merch/library/2026-10-21'
const square = `${root}/square-v2`
const expanded = 'images/merch/library/2026-11-01'

/** Complete six-image galleries: three official views followed by three lifestyle scenes. */
export const MERCH_PRODUCT_GALLERIES: Record<string, string[]> = {
  'moltology-mug': [
    'images/merch/moltology-mug-v2-1.jpg',
    `${root}/moltology-mug-v2/mug-moltology-v2-default-1.jpg`,
    'images/merch/moltology-mug-v2-2.jpg',
    `${square}/moltology-mug-v2/mug-studio.jpg`,
    `${square}/moltology-mug-v2/mug-reading.jpg`,
    `${square}/moltology-mug-v2/mug-gallery.jpg`,
  ],
  'moltology-tee': [
    'images/merch/moltology-tee-v2-black.jpg',
    `${root}/moltology-tee-v2/tee-moltology-v2-flat-2-2.jpg`,
    `${root}/moltology-tee-v2/tee-moltology-v2-ghost-3.jpg`,
    `${square}/moltology-tee-v2/tee-studio.jpg`,
    `${square}/moltology-tee-v2/tee-terrace.jpg`,
    `${square}/moltology-tee-v2/tee-gallery.jpg`,
  ],
  'moltology-hat': [
    'images/merch/moltology-hat-v1-black.jpg',
    `${expanded}/moltology-hat/hat-moltology-v1-flat-3.jpg`,
    `${expanded}/moltology-hat/hat-moltology-v1-flat-6.jpg`,
    `${expanded}/moltology-hat/hat-studio.jpg`,
    `${expanded}/moltology-hat/hat-terrace.jpg`,
    `${expanded}/moltology-hat/hat-gallery.jpg`,
  ],
  'moltology-desk-mat': [
    'images/merch/moltology-desk-mat-v1.jpg',
    `${expanded}/moltology-desk-mat/desk-mat-moltology-v1-product-details-1.jpg`,
    `${expanded}/moltology-desk-mat/desk-mat-moltology-v1-product-details-2.jpg`,
    `${expanded}/moltology-desk-mat/mat-studio.jpg`,
    `${expanded}/moltology-desk-mat/mat-reading-square.jpg`,
    `${expanded}/moltology-desk-mat/mat-workspace-square.jpg`,
  ],
}
// Primary images still belong to the normal mockup workflow.
const curatedImages = new Set(Object.values(MERCH_PRODUCT_GALLERIES).flat().filter(key => key.includes('/library/')))
export function isCuratedMerchImage(key: string) { return curatedImages.has(key) }

type ImageDescription = { caption: string; alt: string }
const mug = (size: '11' | '15', view: string): ImageDescription => ({ caption: `${size} oz mug`, alt: `${size} oz white Moltology mug, ${view}` })
const tee = (view: string): ImageDescription => ({ caption: `Black tee · ${view}`, alt: `Black Moltology tee, ${view} view` })
const teeModel = (scene: string): ImageDescription => ({ caption: 'Black tee', alt: `Model wearing the black Moltology tee ${scene}` })

/** Explicit source sizes: never infer the pictured mug from the customer's size selection. */
export const MERCH_IMAGE_DESCRIPTIONS: Record<string, ImageDescription> = {
  [`${expanded}/moltology-hat/hat-moltology-v1-flat-3.jpg`]: { caption: 'Black hat · angled front', alt: 'Black Moltology dad hat, angled front view with red embroidered emblem' },
  [`${expanded}/moltology-hat/hat-moltology-v1-flat-6.jpg`]: { caption: 'Black hat · back', alt: 'Black Moltology dad hat, back view with adjustable buckle strap' },
  [`${expanded}/moltology-hat/hat-studio.jpg`]: { caption: 'Black hat', alt: 'Model wearing the black Moltology hat in a sunlit studio' },
  [`${expanded}/moltology-hat/hat-terrace.jpg`]: { caption: 'Black hat', alt: 'Model wearing the black Moltology hat on an architectural terrace' },
  [`${expanded}/moltology-hat/hat-gallery.jpg`]: { caption: 'Black hat', alt: 'Model wearing the black Moltology hat in a gallery cafe' },
  [`${expanded}/moltology-desk-mat/desk-mat-moltology-v1-product-details-1.jpg`]: { caption: 'Desk mat · surface detail', alt: 'Moltology desk mat, close view of the printed surface and stitched edge' },
  [`${expanded}/moltology-desk-mat/desk-mat-moltology-v1-product-details-2.jpg`]: { caption: 'Desk mat · edge detail', alt: 'Moltology desk mat, rolled edge showing the textured backing and white wordmark' },
  [`${expanded}/moltology-desk-mat/mat-studio.jpg`]: { caption: '16″ × 32″ desk mat', alt: 'Moltology desk mat with keyboard and mouse on an oak studio desk' },
  [`${expanded}/moltology-desk-mat/mat-reading-square.jpg`]: { caption: '16″ × 32″ desk mat', alt: 'Moltology desk mat with a notebook on a walnut desk beside a window' },
  [`${expanded}/moltology-desk-mat/mat-workspace-square.jpg`]: { caption: '16″ × 32″ desk mat', alt: 'Moltology desk mat in a minimal home workspace' },

  'images/merch/moltology-hat-v1-black.jpg': { caption: 'Black hat · front', alt: 'Black Moltology dad hat with a red embroidered emblem on the front' },
  'images/merch/moltology-desk-mat-v1.jpg': { caption: '16″ × 32″ desk mat', alt: 'Dark Moltology desk mat with depth contours and a small red emblem and white wordmark in one corner' },
  'images/merch/moltology-mug-v2-1.jpg': mug('11', 'red emblem facing forward'),
  'images/merch/moltology-mug-v2-2.jpg': mug('15', 'wordmark facing forward'),
  'images/merch/moltology-tee-v2-black.jpg': tee('front'),
  [`${root}/moltology-mug-v2/mug-moltology-v2-default-1.jpg`]: mug('11', 'wordmark facing forward'),
  [`${root}/moltology-mug-v2/mug-moltology-v2-default-3.jpg`]: mug('11', 'wraparound design'),
  [`${root}/moltology-mug-v2/mug-moltology-v2-15oz-default-1.jpg`]: mug('15', 'wordmark facing forward'),
  [`${root}/moltology-mug-v2/mug-moltology-v2-15oz-default-2.jpg`]: mug('15', 'red emblem facing forward'),
  [`${square}/moltology-mug-v2/mug-studio.jpg`]: mug('11', 'held by a model in a studio'),
  [`${square}/moltology-mug-v2/mug-reading.jpg`]: mug('11', 'held by a model beside a window'),
  [`${square}/moltology-mug-v2/mug-gallery.jpg`]: mug('15', 'held by a model in a gallery cafe'),
  [`${root}/moltology-tee-v2/tee-moltology-v2-flat-2-2.jpg`]: tee('back'),
  [`${root}/moltology-tee-v2/tee-moltology-v2-ghost-3.jpg`]: tee('side'),
  [`${square}/moltology-tee-v2/tee-studio.jpg`]: teeModel('in a sunlit studio'),
  [`${square}/moltology-tee-v2/tee-terrace.jpg`]: teeModel('on a terrace'),
  [`${square}/moltology-tee-v2/tee-gallery.jpg`]: teeModel('seated in a gallery'),
}
export function merchGalleryCaption(key: string | null | undefined): string | null {
  return key ? MERCH_IMAGE_DESCRIPTIONS[key]?.caption ?? null : null
}
export function merchGalleryAlt(key: string | null | undefined, fallback: string): string {
  return key ? MERCH_IMAGE_DESCRIPTIONS[key]?.alt ?? fallback : fallback
}
