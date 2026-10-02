/**
 * Idle animation helpers for layered lobster avatar SVGs.
 * Keyframes live in avatar-animations.css (`.lobster-avatar-animated`) for reliable SVG `<g>` transforms.
 */

/** Classes the avatar rigs put on each idle-animated layer. */
export const LOBSTER_IDLE_LAYER_CLASSES = [
  'lobster-idle-carapace',
  'lobster-idle-abdomen',
  'lobster-idle-tail',
  'lobster-idle-flank-limbs',
  'lobster-idle-legs',
  'lobster-idle-arm-left',
  'lobster-idle-arm-right',
  'lobster-idle-claw-left',
  'lobster-idle-claw-right',
  'lobster-idle-antennae',
  'lobster-idle-antenna-left',
  'lobster-idle-antenna-right',
  'lobster-idle-eyes',
  'lobster-idle-eyelid-left',
  'lobster-idle-eyelid-right',
  'lobster-idle-brow-left',
  'lobster-idle-brow-right',
  'lobster-idle-blink',
] as const

export const LOBSTER_IDLE_LAYER_CLASS = 'lobster-idle-layer'

const MAX_DECODED_SVG_CACHE = 64
const decodedSvgCache = new Map<string, string>()

export function clearDecodedSvgCache(): void {
  decodedSvgCache.clear()
}

export function decodeSvgDataUri(src: string): string | null {
  if (!src.startsWith('data:image/svg+xml')) return null

  const cached = decodedSvgCache.get(src)
  if (cached !== undefined) {
    // Refresh LRU order
    decodedSvgCache.delete(src)
    decodedSvgCache.set(src, cached)
    return cached
  }

  const commaIndex = src.indexOf(',')
  if (commaIndex === -1) return null

  const payload = src.slice(commaIndex + 1)
  const isBase64 = src.includes(';base64,')

  try {
    let decoded: string | null = null
    if (isBase64) {
      if (typeof atob === 'undefined') return null
      decoded = atob(payload)
    } else {
      decoded = decodeURIComponent(payload)
    }

    if (decoded) {
      if (decodedSvgCache.size >= MAX_DECODED_SVG_CACHE) {
        const oldestKey = decodedSvgCache.keys().next().value
        if (oldestKey !== undefined) {
          decodedSvgCache.delete(oldestKey)
        }
      }
      decodedSvgCache.set(src, decoded)
    }
    return decoded
  } catch {
    return null
  }
}

export function getIdleAnimationPhaseOffset(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

export function resolveIdleAnimationPhase(svg: string, seed?: string): number {
  if (seed) return getIdleAnimationPhaseOffset(seed)
  return getIdleAnimationPhaseOffset(svg)
}

