/**
 * Draws a member's share card (og:image) from their saved 3D portrait. See src/lib/share-card.ts.
 */
import { SHARE_CARD_LENS } from '../share-card'

/** Sets the portrait into the card's porthole and returns the card as a JPEG. */
export async function composeMemberCard(base: Uint8Array, glass: Uint8Array, portrait: Uint8Array): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const { x, y, size } = SHARE_CARD_LENS
  const round = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`,
  )
  const face = await sharp(portrait)
    .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
    .ensureAlpha()
    .composite([{ input: round, blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(base)
    .composite([
      { input: face, left: x, top: y },
      { input: Buffer.from(glass), left: x, top: y },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()
}

function dataUrlBytes(url: string): Uint8Array {
  return new Uint8Array(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))
}

async function cardArtwork(): Promise<{ base: Uint8Array; glass: Uint8Array }> {
  const [{ default: base }, { default: glass }] = await Promise.all([
    import('./share-card-art/member-card-base.webp?inline'),
    import('./share-card-art/member-card-glass.webp?inline'),
  ])
  return { base: dataUrlBytes(base), glass: dataUrlBytes(glass) }
}

type Fetcher = (url: string) => Promise<Response>

/**
 * The card for the portrait with this name, or null when no portrait is stored under it. Tries
 * the sharp 512px copy first, then the 256px portrait every saved character has.
 */
export async function memberCardForStill(still: string, mediaOrigin: string, fetcher: Fetcher = fetch): Promise<Buffer | null> {
  const { storedStillKey, largeStillKey } = await import('../avatar-still')
  let portrait: Uint8Array | null = null
  for (const key of [largeStillKey(still), storedStillKey(still)]) {
    const response = await fetcher(`${mediaOrigin}/media/${key}`).catch(() => null)
    if (response?.ok) {
      portrait = new Uint8Array(await response.arrayBuffer())
      break
    }
  }
  if (!portrait) return null
  const { base, glass } = await cardArtwork()
  return composeMemberCard(base, glass, portrait)
}

const YEAR = 60 * 60 * 24 * 365

/**
 * GET /api/share/member/v{version}/{still}.jpg. The name is a hash of exactly what the portrait
 * shows, so a card never changes once drawn and is cached for a year. A name with no portrait
 * behind it sends the crab card instead, cached briefly in case the portrait is still uploading.
 */
export async function handleMemberCardRequest(version: string, card: string, fetcher: Fetcher = fetch): Promise<Response> {
  const { isStillHash, MEMBER_SHARE_FALLBACK_IMAGE, SHARE_CARD_VERSION } = await import('../share-card')
  const { SITE_ORIGIN } = await import('../site-origin')
  const still = card.endsWith('.jpg') ? card.slice(0, -4) : ''
  const fallback = () =>
    new Response(null, {
      status: 302,
      headers: { Location: `/${MEMBER_SHARE_FALLBACK_IMAGE}`, 'Cache-Control': 'public, max-age=300', 'CDN-Cache-Control': 'max-age=300' },
    })
  if (version !== `v${SHARE_CARD_VERSION}` || !isStillHash(still)) return fallback()
  let image: Buffer | null = null
  try {
    image = await memberCardForStill(still, SITE_ORIGIN, fetcher)
  } catch (error) {
    console.warn('[share-card] card not drawn:', error instanceof Error ? error.message : error)
  }
  if (!image) return fallback()
  return new Response(new Uint8Array(image), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': String(image.length),
      'Cache-Control': `public, max-age=${YEAR}, immutable`,
      'CDN-Cache-Control': `max-age=${YEAR}`,
    },
  })
}
