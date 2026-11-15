/**
 * Link-preview images (og:image): the site card and the member share card.
 *
 * The member card is a fixed background with the member's saved 3D portrait set into a glass
 * porthole. `npm run share:cards` draws the background, the glass and the fallback card from
 * scripts/build-share-cards.ts; the server only places the portrait (src/lib/server/share-card.ts).
 */
import { getAbsoluteAssetUrl } from './assets'
import { SITE_ORIGIN } from './site-origin'

/** Bump when the card artwork changes, so link unfurlers and the CDN fetch the new picture. */
export const SHARE_CARD_VERSION = 2

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const

/** Where the portrait porthole sits on the member card, in card pixels. */
export const SHARE_CARD_LENS = { x: 688, y: 95, size: 440 } as const

/** The site-wide preview: the glowing emblem over the wordmark. */
export const SITE_SHARE_IMAGE = 'images/sharing/site-card-v2.jpg'
export const SITE_SHARE_IMAGE_ALT = 'The glowing Moltology emblem above the Moltology wordmark, The Synaptic Path'

/** The member card for members without a saved portrait: a generic crimson crab. */
export const MEMBER_SHARE_FALLBACK_IMAGE = `images/sharing/member-card-v${SHARE_CARD_VERSION}.jpg`
export const MEMBER_SHARE_IMAGE_ALT = 'Add me on Moltology. A friend beneath the surface.'

/** Saved portraits are short base-36 names (see shortHash in avatar-still.ts). */
const STILL_HASH = /^[0-9a-z]{4,16}$/

export function isStillHash(value: string | null | undefined): value is string {
  return typeof value === 'string' && STILL_HASH.test(value)
}

/** Path of the member card drawn from the portrait with this name. */
export function memberShareCardPath(still: string): string {
  return `/api/share/member/v${SHARE_CARD_VERSION}/${still}.jpg`
}

/** Absolute og:image URL for a member: their own card, or the crab card when they have no portrait. */
export function memberShareImageUrl(still?: string | null): string {
  return isStillHash(still) ? `${SITE_ORIGIN}${memberShareCardPath(still)}` : getAbsoluteAssetUrl(MEMBER_SHARE_FALLBACK_IMAGE)
}
