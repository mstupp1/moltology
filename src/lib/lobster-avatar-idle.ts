/**
 * Idle animation helpers for layered lobster avatar SVGs.
 * Keyframes live in index.css (`.lobster-avatar-animated`) for reliable SVG `<g>` transforms.
 */

export const LOBSTER_IDLE_LAYER_IDS = [
  'lobster-carapace-layer',
  'lobster-abdomen-layer',
  'lobster-brow-layer',
  'lobster-brow-left',
  'lobster-brow-right',
  'lobster-eyelids-layer',
  'lobster-eyelid-left',
  'lobster-eyelid-right',
  'lobster-arm-left',
  'lobster-arm-right',
  'lobster-claw-left',
  'lobster-claw-right',
  'lobster-flank-limbs',
  'lobster-flank-left',
  'lobster-flank-right',
  'lobster-tail-fan-layer',
  'lobster-antennae-layer',
  'lobster-antenna-left',
  'lobster-antenna-right',
  'lobster-legs-layer',
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

/** Max radial pupil shift in CSS px when cursor is at avatar edge */
export const LOBSTER_EYE_TRACK_RADIUS = 2.5

/** Per-frame lerp toward cursor target — lower = more resistance/lag */
export const LOBSTER_EYE_TRACK_FOLLOW = 0.04

/** Slightly asymmetric follow so eyes do not move in perfect lockstep */
export const LOBSTER_EYE_TRACK_FOLLOW_LEFT = 0.045
export const LOBSTER_EYE_TRACK_FOLLOW_RIGHT = 0.038

/** DiceBear eyes `<use>` placement within the expanded avatar viewBox */
export const LOBSTER_EYE_FACE_OFFSET = { x: 27, y: 36 }

/** Eye socket centers inside the eyes symbol (before face offset) */
export const LOBSTER_EYE_SOCKETS = {
  left: { x: 10, y: 13 },
  right: { x: 36, y: 13 },
} as const

export type LobsterPupilSide = keyof typeof LOBSTER_EYE_SOCKETS

/** Expanded avatar viewBox width/height used to map sockets to screen space */
export const LOBSTER_AVATAR_VIEWBOX_SIZE = 230

export function getLobsterEyeSocketScreenPoint(
  anchorRect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  side: LobsterPupilSide
): { x: number; y: number } {
  const socket = LOBSTER_EYE_SOCKETS[side]
  const scale = anchorRect.width / LOBSTER_AVATAR_VIEWBOX_SIZE
  return {
    x: anchorRect.left + (LOBSTER_EYE_FACE_OFFSET.x + socket.x) * scale,
    y: anchorRect.top + (LOBSTER_EYE_FACE_OFFSET.y + socket.y) * scale,
  }
}

export function computeLobsterPupilOffset(
  clientX: number,
  clientY: number,
  anchorRect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  side: LobsterPupilSide
): { x: number; y: number } {
  const eye = getLobsterEyeSocketScreenPoint(anchorRect, side)
  let dx = clientX - eye.x
  let dy = clientY - eye.y
  const distance = Math.hypot(dx, dy)

  if (distance < 0.001) {
    return { x: 0, y: 0 }
  }

  const refDistance = anchorRect.width * 0.45
  const intensity = Math.min(1, Math.sqrt(distance / refDistance))

  // Horizontal gaze is stronger than vertical — closer to natural eye scan
  const maxR = LOBSTER_EYE_TRACK_RADIUS
  return {
    x: (dx / distance) * maxR * intensity,
    y: (dy / distance) * maxR * intensity * 0.72,
  }
}

export function computeLobsterEyeOffset(
  clientX: number,
  clientY: number,
  anchorRect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
): { x: number; y: number } {
  const halfW = anchorRect.width / 2 || 1
  const halfH = anchorRect.height / 2 || 1
  const cx = anchorRect.left + halfW
  const cy = anchorRect.top + halfH
  let nx = (clientX - cx) / halfW
  let ny = (clientY - cy) / halfH

  const length = Math.hypot(nx, ny)
  if (length > 1) {
    nx /= length
    ny /= length
  }

  return {
    x: nx * LOBSTER_EYE_TRACK_RADIUS,
    y: ny * LOBSTER_EYE_TRACK_RADIUS,
  }
}

export function stepLobsterEyeOffset(
  current: { x: number; y: number },
  target: { x: number; y: number },
  followStrength = LOBSTER_EYE_TRACK_FOLLOW
): { x: number; y: number } {
  const dx = target.x - current.x
  const dy = target.y - current.y
  const distance = Math.hypot(dx, dy)

  if (distance < 0.001) {
    return { x: target.x, y: target.y }
  }

  // Ease-out: drift faster when far, settle gently when close
  const progress = Math.min(1, distance / LOBSTER_EYE_TRACK_RADIUS)
  const easedStrength = followStrength * (0.2 + 0.8 * progress * progress)

  return {
    x: current.x + dx * easedStrength,
    y: current.y + dy * easedStrength,
  }
}
