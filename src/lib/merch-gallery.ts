/** Reviewed selections and customer-facing image descriptions. Provenance stays in content/merch/. */
const root = 'images/merch/library/2026-10-21'
const square = `${root}/square-v2`
export const MERCH_PRODUCT_GALLERIES: Record<string, string[]> = {
  'moltology-mug-v2': [
    `${root}/moltology-mug-v2/mug-moltology-v2-default-1.jpg`,
    `${root}/moltology-mug-v2/mug-moltology-v2-default-3.jpg`,
    `${root}/moltology-mug-v2/mug-moltology-v2-15oz-default-2.jpg`,
    `${square}/moltology-mug-v2/mug-studio.jpg`,
    `${square}/moltology-mug-v2/mug-reading.jpg`,
    `${square}/moltology-mug-v2/mug-gallery.jpg`,
  ],
  'moltology-tee-v2': [
    `${root}/moltology-tee-v2/tee-moltology-v2-flat-2-2.jpg`,
    `${root}/moltology-tee-v2/tee-moltology-v2-ghost-3.jpg`,
    `${square}/moltology-tee-v2/tee-studio.jpg`,
    `${square}/moltology-tee-v2/tee-terrace.jpg`,
    `${square}/moltology-tee-v2/tee-gallery.jpg`,
  ],
}
const curatedImages = new Set(Object.values(MERCH_PRODUCT_GALLERIES).flat())
export function isCuratedMerchImage(key: string) { return curatedImages.has(key) }

type ImageDescription = { caption: string; alt: string }
const mug = (size: '11' | '15', view: string): ImageDescription => ({ caption: `${size} oz mug`, alt: `${size} oz white Moltology mug, ${view}` })
const tee = (view: string): ImageDescription => ({ caption: `Black tee · ${view}`, alt: `Black Moltology tee, ${view} view` })
const teeModel = (scene: string): ImageDescription => ({ caption: 'Black tee', alt: `Model wearing the black Moltology tee ${scene}` })

/** Explicit source sizes: never infer the pictured mug from the customer's size selection. */
export const MERCH_IMAGE_DESCRIPTIONS: Record<string, ImageDescription> = {
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
