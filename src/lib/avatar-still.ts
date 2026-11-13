/**
 * Saved portraits. When a member's portrait has been drawn once it is stored as an image, named
 * by a hash of exactly what the picture shows, and that name is written into the member's saved
 * character as `still`. Any browser can then show the stored image instead of drawing the
 * character in 3D, and a look that has changed since simply no longer matches its `still`.
 *
 * Shared by the browser and the server, so it must not import the 3D renderer.
 */
import { parseLobsterAvatarConfig, type LobsterAvatarConfig } from './lobster-avatar'

/**
 * Bump when the 3D character's look changes (shapes, materials, lighting or framing), so stills
 * kept from an older drawing are thrown away instead of shown.
 */
export const STILL_VERSION = 3

/** Size of a stored portrait, in pixels. Smaller avatars scale it down. */
export const STORED_STILL_PX = 256

/** JSON with every object's keys in order, at every depth, so equal characters match. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined)
    return `{${entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/** FNV-1a over 53 bits: short, stable, and plenty to tell characters apart. */
export function shortHash(text: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193)
    h2 = Math.imul(h2 ^ c, 0x5bd1e995)
  }
  return ((h2 >>> 0) * 0x200000 + ((h1 >>> 0) & 0x1fffff)).toString(36)
}

/**
 * The name of this character's portrait: the same for any two configs that draw the same face,
 * however they were stored or sent. Backdrop, pose and temperament do not show in a portrait.
 */
export function avatarStillHash(config: LobsterAvatarConfig): string | null {
  const parsed = parseLobsterAvatarConfig(config)
  if (!parsed) return null
  const { still: _s, style: _y, accessory: _a, claws: _c, pose: _p, temperament: _t, backgroundTheme: _b1, backgroundPattern: _b2, backgroundTexture: _b3, backgroundMotion: _b4, patternDensity: _b5, patternGlow: _b6, patternPulse: _b7, patternSparkles: _b8, transparentBackground: _b9, equipment, ...look } = parsed
  const worn = equipment && Object.keys(equipment).length ? equipment : undefined
  return shortHash(`v${STILL_VERSION}|${canonical({ ...look, equipment: worn })}`)
}

/** Where a portrait with this name is kept in the public bucket. */
export function storedStillKey(hash: string): string {
  return `avatars/v${STILL_VERSION}/${hash}.webp`
}

/** The stored portrait for this character, if one was saved for exactly this look. */
export function storedStillUrl(config: LobsterAvatarConfig | null | undefined): string | null {
  if (!config?.still) return null
  return config.still === avatarStillHash(config) ? `/media/${storedStillKey(config.still)}` : null
}

/** Width and height of a WebP image, or null if the bytes are not one. */
export function webpSize(bytes: Uint8Array): { width: number; height: number } | null {
  const tag = (at: number) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3])
  if (bytes.length < 30 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return null
  const kind = tag(12)
  if (kind === 'VP8X') return { width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)), height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) }
  if (kind === 'VP8L') {
    if (bytes[20] !== 0x2f) return null
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) }
  }
  if (kind === 'VP8 ') return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff }
  return null
}
