/**
 * Idle animation helpers for layered lobster avatar SVGs.
 * Keyframes live in index.css (`.lobster-avatar-animated`) for reliable SVG `<g>` transforms.
 */

export const LOBSTER_IDLE_LAYER_IDS = [
  'lobster-carapace-layer',
  'lobster-abdomen-layer',
  'lobster-brow-layer',
  'lobster-arm-left',
  'lobster-arm-right',
  'lobster-claw-left',
  'lobster-claw-right',
  'lobster-tail-fan-layer',
  'lobster-antennae-layer',
  'lobster-legs-layer',
] as const

export const LOBSTER_IDLE_LAYER_CLASS = 'lobster-idle-layer'

export function decodeSvgDataUri(src: string): string | null {
  if (!src.startsWith('data:image/svg+xml')) return null

  const commaIndex = src.indexOf(',')
  if (commaIndex === -1) return null

  const payload = src.slice(commaIndex + 1)
  const isBase64 = src.includes(';base64,')

  try {
    if (isBase64) {
      if (typeof atob === 'undefined') return null
      return atob(payload)
    }
    return decodeURIComponent(payload)
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

/** Max radial eye shift in CSS px when cursor is at avatar edge */
export const LOBSTER_EYE_TRACK_RADIUS = 2

/** Per-frame lerp toward cursor target — lower = more resistance/lag */
export const LOBSTER_EYE_TRACK_FOLLOW = 0.04

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
