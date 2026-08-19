/**
 * Moltology Asset URL Resolver
 *
 * Centralizes resolution of public media and UI assets.
 * Lightweight brand assets (favicon, order emblem, canvas particles) remain local in `public/`.
 * Heavy content, quiz graphics, PBR textures, character cutouts, and guides resolve to Neon S3.
 */

export const S3_BASE_URL =
  process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_S3_BUCKET
    ? `${process.env.AWS_ENDPOINT_URL_S3.replace(/\/+$/, '')}/${process.env.AWS_S3_BUCKET}`
    : 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets'

/**
 * Local assets that stay in public/ for zero-latency initial HTML/CSS render
 */
const LOCAL_ASSET_WHITELIST = new Set([
  'favicon.ico',
  'favicon.png',
  'images/order_emblem.png',
  'images/scanline_pattern.png',
  'images/bubble_variant_1.jpg',
  'images/bubble_variant_2.jpg',
  'images/bubble_variant_3.jpg',
  'images/marketing/dashboard_desktop_preview.png',
  'images/marketing/dashboard_mobile_preview.png',
])

/**
 * Resolves an asset path to either a local static route or Neon S3 CDN URL.
 */
export function getAssetUrl(assetPath: string): string {
  if (!assetPath) return ''
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('data:')) {
    return assetPath
  }

  const cleanPath = assetPath.replace(/^\/+/, '')

  if (LOCAL_ASSET_WHITELIST.has(cleanPath)) {
    return `/${cleanPath}`
  }

  return `${S3_BASE_URL}/${cleanPath}`
}
