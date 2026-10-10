/**
 * Moltology Asset URL Resolver
 *
 * Centralizes resolution of public media and UI assets.
 * Lightweight brand assets (favicon, order emblem, canvas particles) remain local in `public/`.
 * Heavy content, quiz graphics, PBR textures, character cutouts, and guides live in Neon S3,
 * but pages load them through `/media/*`, a Vercel rewrite that caches the bucket at the CDN.
 * Every byte read straight from the bucket counts against Neon's monthly public network
 * transfer, which the database shares, so pages should never point at the bucket directly.
 */

import { MARKETING_ASSET_VERSION } from './marketing-assets-version'
import { SITE_ORIGIN } from './seo'

export { MARKETING_ASSET_VERSION }

const getEndpoint = () => {
  if (typeof process !== 'undefined' && process.env?.AWS_ENDPOINT_URL_S3 && process.env?.AWS_S3_BUCKET) {
    return `${process.env.AWS_ENDPOINT_URL_S3.replace(/\/+$/, '')}/${process.env.AWS_S3_BUCKET}`
  }
  return 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets'
}

/** Direct bucket origin. For uploads and off-site consumers (social publishing, scripts). */
export const S3_BASE_URL = getEndpoint()

/** The bucket as served through the CDN rewrite in vercel.json (and the Vite dev proxy). */
export const MEDIA_BASE_PATH = '/media'

const BUCKET_URL_PREFIXES = Array.from(
  new Set([
    `${S3_BASE_URL}/`,
    'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/',
  ]),
)

/**
 * Local assets that stay in public/ for zero-latency initial HTML/CSS render
 */
const LOCAL_ASSET_WHITELIST = new Set([
  'favicon.svg',
  'favicon.ico',
  'favicon.png',
  'images/order_emblem.png',
  'images/order_emblem.webp',
  'images/order_emblem.svg',
  'images/scanline_pattern.png',
  'images/bubble_variant_1.jpg',
  'images/bubble_variant_2.jpg',
  'images/bubble_variant_3.jpg',
  'images/marketing/dashboard_desktop_preview.webp',
  'images/marketing/dashboard_desktop_preview_sm.webp',
  'images/marketing/dashboard_mobile_preview.webp',
  'images/marketing/dashboard_mobile_preview_sm.webp',
  'images/marketing/dashboard_feature_preview.webp',
  'images/marketing/dashboard_feature_preview_sm.webp',
  'images/marketing/forum_feature_preview.webp',
  'images/marketing/forum_feature_preview_sm.webp',
  'images/marketing/oracle_feature_preview.webp',
  'images/marketing/oracle_feature_preview_sm.webp',
  'images/forum/forum_rules_bg.jpg',
  'images/forum/forum_doctrine_bg.jpg',
  'images/forum/forum_hardware_bg.jpg',
  'images/forum/forum_moltmax_bg.jpg',
  'images/forum/forum_general_bg.jpg',
  'images/forum/forum_market_bg.jpg',
])

/**
 * Resolves an asset path to either a local static route or the CDN-cached `/media/*` route.
 * Absolute bucket URLs (as stored on blog posts) are folded into `/media/*` too.
 */
export function getAssetUrl(assetPath: string): string {
  if (!assetPath) return ''
  const bucketPrefix = BUCKET_URL_PREFIXES.find((prefix) => assetPath.startsWith(prefix))
  if (bucketPrefix) {
    return `${MEDIA_BASE_PATH}/${assetPath.slice(bucketPrefix.length)}`
  }
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('data:')) {
    return assetPath
  }

  const cleanPath = assetPath.replace(/^\/+/, '')
  if (cleanPath.startsWith('media/')) return `/${cleanPath}`
  const pathWithoutQuery = cleanPath.split('?')[0]

  if (
    LOCAL_ASSET_WHITELIST.has(pathWithoutQuery) ||
    cleanPath.startsWith('images/chassis/') ||
    cleanPath.startsWith('images/marketing/')
  ) {
    if (cleanPath.startsWith('images/marketing/') && !cleanPath.includes('?')) {
      return `/${cleanPath}?v=${MARKETING_ASSET_VERSION}`
    }
    return `/${cleanPath}`
  }

  return `${MEDIA_BASE_PATH}/${cleanPath}`
}

/**
 * Absolute form of `getAssetUrl` for places that leave the site: emails, og:image, download links.
 */
export function getAbsoluteAssetUrl(assetPath: string): string {
  const url = getAssetUrl(assetPath)
  return url.startsWith('/') ? `${SITE_ORIGIN}${url}` : url
}
