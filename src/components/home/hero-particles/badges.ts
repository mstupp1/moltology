/**
 * Alert badges for the hero noise: a few small notification, warning and error marks in the
 * brand's red, amber and orange that hover in the static around the shell, glitch now and
 * then, and get pulled in and absorbed as the shell forms. After that a stray one drifts in
 * every so often and is absorbed too.
 *
 * Pure scheduling lives here so it can be tested without a canvas; sprites are drawn once.
 */

export const BADGE_KINDS = ['count', 'warning', 'error', 'toast'] as const
export type BadgeKind = (typeof BADGE_KINDS)[number]

export const BADGE_COLORS = {
  red: '#ff453a',
  amber: '#f5a524',
  orange: '#ff7a3d',
} as const

export interface Badge {
  kind: BadgeKind
  /** Spawn point as an offset from the shell centre, in shell radii. */
  ox: number
  oy: number
  /** Where it lands on the shell, as an offset in shell radii. */
  tx: number
  ty: number
  born: number
  absorbAt: number
  /** Seconds the pull into the shell takes. */
  pull: number
  seed: number
  label: string
  landed: boolean
}

export interface BadgeFrame {
  x: number
  y: number
  scale: number
  alpha: number
}

const COUNT_LABELS = ['3', '9+', '12', '1', '27']
/** Seconds a badge takes to pop in. */
const POP = 0.28

function smooth(x: number): number {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/**
 * Picks a spawn angle on the side of the shell away from the copy: to the right on wide
 * layouts (copy on the left), below and to the sides on phones (copy above).
 */
export function spawnAngle(rand: () => number, copyAbove: boolean, slot?: [number, number]): number {
  // `slot` = [index, count] spreads a set evenly across the range so badges never pile up.
  const u = slot ? (slot[0] + 0.25 + rand() * 0.5) / slot[1] : rand()
  if (copyAbove) return (-0.05 + u * 1.1) * Math.PI
  return (-0.4 + u * 0.8) * Math.PI
}

/** The opening set: badges that hover in the static and are absorbed one by one as the shell grows. */
export function introBadges(count: number, rand: () => number, copyAbove: boolean, holdUntil: number): Badge[] {
  const badges: Badge[] = []
  // Shuffle the slots so neighbours on screen don't appear one after the other.
  const slots = Array.from({ length: count }, (_, i) => i).sort(() => rand() - 0.5)
  for (let i = 0; i < count; i++) {
    badges.push(makeBadge(BADGE_KINDS[i % BADGE_KINDS.length], rand, copyAbove, 0.15 + i * 0.16, holdUntil + 0.25 + i * 0.32, [slots[i], count]))
  }
  return badges
}

export function makeBadge(kind: BadgeKind, rand: () => number, copyAbove: boolean, born: number, absorbAt: number, slot?: [number, number]): Badge {
  const angle = spawnAngle(rand, copyAbove, slot)
  const reach = 0.95 + rand() * 0.3
  const landAngle = rand() * Math.PI * 2
  return {
    kind,
    ox: Math.cos(angle) * reach * 1.15,
    oy: Math.sin(angle) * reach * 0.85,
    tx: Math.cos(landAngle) * 0.25,
    ty: Math.sin(landAngle) * 0.18,
    born,
    absorbAt,
    pull: 0.95 + rand() * 0.3,
    seed: rand() * 1000,
    label: COUNT_LABELS[Math.floor(rand() * COUNT_LABELS.length)],
    landed: false,
  }
}

/**
 * Where a badge is at time `t`, relative to the shell centre in shell radii, or null when it is
 * not on screen. Hovering badges bob and glitch sideways now and then; absorbed ones curl in,
 * shrink and fade.
 */
export function badgeFrame(b: Badge, t: number): BadgeFrame | null {
  const age = t - b.born
  if (age < 0) return null
  const end = b.absorbAt + b.pull
  if (t >= end) return null
  const pop = smooth(age / POP)
  // A small overshoot as it appears, like a notification landing.
  const popScale = pop < 1 ? 0.6 + 0.55 * pop - 0.15 * pop * pop : 1
  const bobX = Math.sin(t * 1.3 + b.seed) * 0.03
  const bobY = Math.cos(t * 1.1 + b.seed * 1.7) * 0.04
  // A sideways glitch for a few frames every couple of seconds.
  const glitchPhase = (t * 0.55 + b.seed) % 1
  const glitch = glitchPhase < 0.035 ? (glitchPhase < 0.0175 ? 0.05 : -0.035) : 0
  const flicker = glitchPhase < 0.035 ? 0.55 : 1
  if (t < b.absorbAt) {
    return { x: b.ox + bobX + glitch, y: b.oy + bobY, scale: popScale, alpha: pop * flicker }
  }
  const k = smooth((t - b.absorbAt) / b.pull)
  // Curl in: ease toward the landing point while swinging a little around the centre.
  const swing = (1 - k) * 0.6
  const dx = b.ox - b.tx
  const dy = b.oy - b.ty
  const cs = Math.cos(swing * k * 1.5)
  const sn = Math.sin(swing * k * 1.5)
  const rx = (dx * cs - dy * sn) * (1 - k)
  const ry = (dx * sn + dy * cs) * (1 - k)
  return {
    x: b.tx + rx + bobX * (1 - k),
    y: b.ty + ry + bobY * (1 - k),
    scale: 1 - 0.75 * k,
    alpha: 1 - k * k,
  }
}

/** Sprite size in CSS pixels for each kind, before the shell's point scale. */
export const BADGE_SIZE: Record<BadgeKind, [number, number]> = {
  count: [24, 24],
  warning: [26, 24],
  error: [24, 24],
  toast: [58, 22],
}

/** Draws one badge sprite at `ratio` device pixels per CSS pixel. Browser only. */
export function drawBadgeSprite(kind: BadgeKind, label: string, ratio: number): HTMLCanvasElement {
  const [w, h] = BADGE_SIZE[kind]
  const pad = 6
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil((w + pad * 2) * ratio)
  canvas.height = Math.ceil((h + pad * 2) * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.scale(ratio, ratio)
  ctx.translate(pad, pad)
  const font = (size: number) => `700 ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const glow = (color: string) => {
    ctx.shadowColor = color
    ctx.shadowBlur = 8
  }
  if (kind === 'count') {
    glow(BADGE_COLORS.red)
    ctx.fillStyle = BADGE_COLORS.red
    const r = h / 2
    const bw = Math.max(h, 10 + label.length * 7)
    ctx.beginPath()
    ctx.roundRect((w - bw) / 2, 0, bw, h, r)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.font = font(label.length > 1 ? 11 : 13)
    ctx.fillText(label, w / 2, h / 2 + 0.5)
  } else if (kind === 'warning') {
    glow(BADGE_COLORS.amber)
    ctx.fillStyle = BADGE_COLORS.amber
    ctx.lineJoin = 'round'
    ctx.lineWidth = 4
    ctx.strokeStyle = BADGE_COLORS.amber
    ctx.beginPath()
    ctx.moveTo(w / 2, 2)
    ctx.lineTo(w - 2, h - 2)
    ctx.lineTo(2, h - 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#1a1204'
    ctx.font = font(14)
    ctx.fillText('!', w / 2, h / 2 + 3)
  } else if (kind === 'error') {
    glow(BADGE_COLORS.orange)
    ctx.fillStyle = BADGE_COLORS.orange
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, h / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    const s = 4.5
    ctx.beginPath()
    ctx.moveTo(w / 2 - s, h / 2 - s)
    ctx.lineTo(w / 2 + s, h / 2 + s)
    ctx.moveTo(w / 2 + s, h / 2 - s)
    ctx.lineTo(w / 2 - s, h / 2 + s)
    ctx.stroke()
  } else {
    // A tiny toast: dark card, orange edge, an alert dot and two lines of "text".
    glow(BADGE_COLORS.orange)
    ctx.fillStyle = 'rgba(28, 12, 8, 0.92)'
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 5)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = BADGE_COLORS.orange
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.fillStyle = BADGE_COLORS.red
    ctx.beginPath()
    ctx.arc(11, h / 2, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = font(8)
    ctx.fillText('!', 11, h / 2 + 0.5)
    ctx.fillStyle = 'rgba(255, 214, 190, 0.75)'
    ctx.fillRect(21, 6, 28, 3)
    ctx.fillStyle = 'rgba(255, 214, 190, 0.4)'
    ctx.fillRect(21, 12.5, 20, 2.5)
  }
  return canvas
}
