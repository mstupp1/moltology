/** Reviewed supplementary images; originals and provenance live in content/merch/image-library-2026-10-21.json. */
const root = 'images/merch/library/2026-10-21'
export const MERCH_PRODUCT_GALLERIES: Record<string, string[]> = {
  'moltology-mug-v2': [
    `${root}/moltology-mug-v2/mug-moltology-v2-default-1.jpg`,
    `${root}/moltology-mug-v2/mug-moltology-v2-default-3.jpg`,
    `${root}/moltology-mug-v2/mug-moltology-v2-15oz-default-1.jpg`,
    `${root}/moltology-mug-v2/mug-moltology-v2-15oz-default-2.jpg`,
    `${root}/moltology-mug-v2/mug-studio.jpg`,
    `${root}/moltology-mug-v2/mug-reading.jpg`,
  ],
  'moltology-tee-v2': [
    `${root}/moltology-tee-v2/tee-moltology-v2-flat-2-2.jpg`,
    `${root}/moltology-tee-v2/tee-moltology-v2-ghost-1.jpg`,
    `${root}/moltology-tee-v2/tee-moltology-v2-ghost-3.jpg`,
    `${root}/moltology-tee-v2/tee-moltology-v2-on-hanger-1.jpg`,
    `${root}/moltology-tee-v2/tee-studio.jpg`,
    `${root}/moltology-tee-v2/tee-terrace.jpg`,
    `${root}/moltology-tee-v2/tee-gallery.jpg`,
  ],
}
const curatedImages = new Set(Object.values(MERCH_PRODUCT_GALLERIES).flat())
export function isCuratedMerchImage(key: string) { return curatedImages.has(key) }

/** Caption follows the selected asset, independently of the currently selected purchase size. */
export function merchGalleryCaption(key: string | null | undefined): string | null {
  if (!key || !isCuratedMerchImage(key)) return null
  if (/\/(tee-(studio|terrace|gallery)|mug-(studio|reading))\.jpg$/.test(key)) return 'AI-generated lifestyle image.'
  if (key.includes('/moltology-mug-v2/')) return key.includes('-15oz-') ? 'Official Printful mockup · 15 oz.' : 'Official Printful mockup · 11 oz.'
  return 'Official Printful mockup · size M.'
}
