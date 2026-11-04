/** Reviewed selections and customer-facing image descriptions. Provenance stays in content/merch/. */
const root = 'images/merch/library/2026-10-21'
const square = `${root}/square-v2`
const expanded = 'images/merch/library/2026-11-01'
const additions = 'images/merch/library/2026-11-04'

/** Complete six-image galleries: three official views followed by three lifestyle scenes. */
export const MERCH_PRODUCT_GALLERIES: Record<string, string[]> = {
  'moltology-hoodie': [
    'images/merch/moltology-hoodie-v1-black.jpg',
    'images/merch/moltology-hoodie-v1-black-back.jpg',
    `${additions}/hoodie-side.jpg`,
    `${additions}/hoodie-studio.jpg`,
    `${additions}/hoodie-terrace.jpg`,
    `${additions}/hoodie-reading.jpg`,
  ],
  'moltology-tote': [
    'images/merch/moltology-tote-v1-black.jpg',
    `${additions}/tote-hanger.jpg`,
    `${additions}/tote-detail.jpg`,
    `${additions}/tote-studio.jpg`,
    `${additions}/tote-terrace.jpg`,
    `${additions}/tote-reading.jpg`,
  ],
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
  'images/merch/moltology-hoodie-v1-black.jpg': { caption: 'Black hoodie · front', alt: 'Black Moltology pullover hoodie with a small red emblem on the left chest' },
  'images/merch/moltology-hoodie-v1-black-back.jpg': { caption: 'Black hoodie · back', alt: 'Black Moltology hoodie with the white wordmark below the hood on the back' },
  [`${additions}/hoodie-side.jpg`]: { caption: 'Black hoodie · side', alt: 'Black Moltology hoodie, side view showing the hood, sleeve, and pouch pocket' },
  [`${additions}/hoodie-studio.jpg`]: { caption: 'Black hoodie', alt: 'Model wearing the black Moltology hoodie in a sunlit studio' },
  [`${additions}/hoodie-terrace.jpg`]: { caption: 'Black hoodie · back', alt: 'Model wearing the black Moltology hoodie on a terrace, with the back wordmark visible' },
  [`${additions}/hoodie-reading.jpg`]: { caption: 'Black hoodie', alt: 'Model wearing the black Moltology hoodie seated beside a cafe window' },
  'images/merch/moltology-tote-v1-black.jpg': { caption: 'Black tote · front', alt: 'Black Moltology tote with a red emblem and white wordmark printed on the front' },
  [`${additions}/tote-hanger.jpg`]: { caption: 'Black tote · hanging', alt: 'Black Moltology tote hanging by its straps, printed front facing forward' },
  [`${additions}/tote-detail.jpg`]: { caption: 'Black tote · fabric detail', alt: 'Close view of the black cotton twill tote, side label, and printed wordmark' },
  [`${additions}/tote-studio.jpg`]: { caption: 'Black tote', alt: 'Model carrying the black Moltology tote in a sunlit studio' },
  [`${additions}/tote-terrace.jpg`]: { caption: 'Black tote', alt: 'Model carrying the black Moltology tote beside a concrete terrace' },
  [`${additions}/tote-reading.jpg`]: { caption: 'Black tote', alt: 'Black Moltology tote standing on a walnut reading table beside a book' },
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
