/**
 * Format rules for bucket images. Dependency-free so the browser bundle can use them.
 *
 * Every raster site image under `images/` (except social media, which platforms want as
 * JPEG/PNG) is uploaded with a compressed `.webp` twin next to the original. Pages load the
 * twin; the original stays for og:image tags and the social and composite scripts.
 */

const RASTER_EXTENSION = /\.(jpe?g|png)$/i

/** Prefixes whose images keep their original format on the page. */
const ORIGINAL_FORMAT_PREFIXES = ['images/social/']

export function hasWebpTwin(key: string): boolean {
  const cleanKey = key.replace(/^\/+/, '').split('?')[0]
  if (!cleanKey.startsWith('images/')) return false
  if (ORIGINAL_FORMAT_PREFIXES.some((prefix) => cleanKey.startsWith(prefix))) return false
  return RASTER_EXTENSION.test(cleanKey)
}

/** `images/a/b.png?v=2` → `images/a/b.webp?v=2`. Leaves keys without a twin unchanged. */
export function webpTwinKey(key: string): string {
  if (!hasWebpTwin(key)) return key
  const [pathPart, query] = key.split('?')
  const twin = pathPart.replace(RASTER_EXTENSION, '.webp')
  return query === undefined ? twin : `${twin}?${query}`
}
