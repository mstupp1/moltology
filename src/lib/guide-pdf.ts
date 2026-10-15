import { getAssetUrl } from './assets'

/** Bucket key of the Moltmaxxing Field Manual PDF (built by `npm run guide:pdf`). */
export const GUIDE_PDF_KEY = 'downloads/the-2026-moltmaxxing-protocol-guide.pdf'
export const GUIDE_PDF_FILENAME = 'the-2026-moltmaxxing-protocol-guide.pdf'
/** Bump after uploading a new PDF so browsers and the CDN fetch the new file. */
export const GUIDE_PDF_VERSION = '20261015-descent'
export const GUIDE_PDF_PAGES = 14

/** Versioned download URL, preferring the one the lead endpoint returned. */
export function guidePdfUrl(downloadUrl?: string | null): string {
  if (downloadUrl) return `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}v=${GUIDE_PDF_VERSION}`
  return getAssetUrl(`${GUIDE_PDF_KEY}?v=${GUIDE_PDF_VERSION}`)
}
