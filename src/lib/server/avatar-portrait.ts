/**
 * Static avatar portraits for kit (painted) characters.
 *
 * Lists, feeds, and headers show dozens of portraits, so they load one small cached webp
 * instead of composing layers in the browser. The server renders it from the same SVG the
 * full-body view uses (kit images embedded as PNG data URIs, since librsvg cannot decode
 * webp), and stores it content-addressed so identical looks share one file and the CDN
 * can cache it forever.
 */
import { createHash } from 'node:crypto'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getAbsoluteAssetUrl } from '../assets'
import { isKitRaceReady } from '../avatar/kit/compose'
import type { KitAsset } from '../avatar/kit/manifest'
import {
  buildAvatarSvg,
  resolveAvatarTraits,
  stripSvgSmilAnimation,
  type LobsterAvatarConfig,
} from '../lobster-avatar'
import { DEFAULT_BUCKET, getS3Client } from '../s3-client'

/** Output edge in px. Covers the 128 CSS px display slot at 2×. */
export const AVATAR_PORTRAIT_PX = 256
export const AVATAR_PORTRAIT_PREFIX = 'images/avatar-portraits/'

const partCache = new Map<string, string>()
const MAX_PART_CACHE = 160

async function loadSharp() {
  const mod = await import('sharp')
  return mod.default
}

async function fetchKitPart(src: string): Promise<Buffer> {
  try {
    const res = await fetch(getAbsoluteAssetUrl(src))
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  } catch {
    // fall through to the bucket
  }
  const out = await getS3Client().send(new GetObjectCommand({ Bucket: DEFAULT_BUCKET, Key: src }))
  const bytes = await out.Body?.transformToByteArray()
  if (!bytes) throw new Error(`Kit part missing: ${src}`)
  return Buffer.from(bytes)
}

/** Kit part as a PNG data URI, cached per warm server. */
async function partDataUri(src: string): Promise<string> {
  const hit = partCache.get(src)
  if (hit) return hit
  const sharp = await loadSharp()
  const png = await sharp(await fetchKitPart(src)).png({ compressionLevel: 6 }).toBuffer()
  const uri = `data:image/png;base64,${png.toString('base64')}`
  if (partCache.size >= MAX_PART_CACHE) {
    const oldest = partCache.keys().next().value
    if (oldest !== undefined) partCache.delete(oldest)
  }
  partCache.set(src, uri)
  return uri
}

function stillConfig(config: LobsterAvatarConfig): LobsterAvatarConfig {
  const { portraitKey: _portraitKey, ...rest } = config
  return { ...rest, backgroundMotion: 'static', patternPulse: 'steady', patternSparkles: 'none' }
}

/** True when this config would be drawn with kit art (so it needs a rendered portrait). */
export function needsKitPortrait(config: LobsterAvatarConfig): boolean {
  return isKitRaceReady(resolveAvatarTraits(config).race)
}

/**
 * Render and upload the portrait. Returns its bucket key, or null when the race still uses
 * the vector rig (whose portrait is generated on the client for free).
 */
export async function renderAvatarPortrait(config: LobsterAvatarConfig): Promise<string | null> {
  if (!config?.seed || !needsKitPortrait(config)) return null
  const still = stillConfig(config)

  // Pass 1 collects which parts the portrait uses; its markup (with bucket keys) is the identity.
  const used = new Set<string>()
  const keyed = buildAvatarSvg(still, AVATAR_PORTRAIT_PX, 'portrait', 'portrait', {
    kit: true,
    kitHref: (asset: KitAsset) => {
      used.add(asset.src)
      return asset.src
    },
  })
  const hash = createHash('sha256').update(keyed).digest('hex').slice(0, 32)
  const key = `${AVATAR_PORTRAIT_PREFIX}${hash}.webp`

  const embedded = new Map<string, string>()
  await Promise.all([...used].map(async (src) => embedded.set(src, await partDataUri(src))))
  const svg = stripSvgSmilAnimation(
    buildAvatarSvg(still, AVATAR_PORTRAIT_PX, 'portrait', 'portrait', {
      kit: true,
      kitHref: (asset: KitAsset) => embedded.get(asset.src) ?? '',
    })
  )

  const sharp = await loadSharp()
  const webp = await sharp(Buffer.from(svg), { density: 192 })
    .resize(AVATAR_PORTRAIT_PX, AVATAR_PORTRAIT_PX, { fit: 'cover' })
    .webp({ quality: 86, alphaQuality: 90 })
    .toBuffer()

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: DEFAULT_BUCKET,
      Key: key,
      Body: webp,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )
  return key
}
