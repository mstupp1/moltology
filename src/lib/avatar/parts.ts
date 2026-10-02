/**
 * Shared character parts: eyes, mouths, claws, arms, antennae, and accessories.
 * Every part is authored in the 100-unit design space the races are built in.
 */
import { taperedCurve, r2, type Pt } from './geometry'
import { ids, piece, glint, shellFill, outlineColor, type PaintContext, type PieceSide } from './paint'
import type { AvatarAccessory, AvatarAntennae, AvatarClaws, AvatarMouth } from './traits'

// ---------------------------------------------------------------------------
// Eyes
// ---------------------------------------------------------------------------

export const AVATAR_EYE_COLORS = ['amber', 'sapphire', 'emerald', 'amethyst', 'ruby', 'topaz'] as const
export type AvatarEyeColor = (typeof AVATAR_EYE_COLORS)[number]

export const EYE_COLOR_SWATCH: Readonly<Record<AvatarEyeColor, { inner: string; mid: string; outer: string; ring: string }>> = {
  amber: { inner: '#ffd98a', mid: '#e07a12', outer: '#7a3305', ring: '#2a1003' },
  sapphire: { inner: '#c4ecff', mid: '#2b8af0', outer: '#123f8f', ring: '#05152e' },
  emerald: { inner: '#cbffd9', mid: '#19b26b', outer: '#0b5a36', ring: '#03200f' },
  amethyst: { inner: '#f1d6ff', mid: '#a259ef', outer: '#4b1a8c', ring: '#170530' },
  ruby: { inner: '#ffd3da', mid: '#e8364f', outer: '#7d0f22', ring: '#2a040b' },
  topaz: { inner: '#fff4b5', mid: '#e8b416', outer: '#7a5405', ring: '#2a1a02' },
}

export type EyeShape = 'round' | 'wide' | 'tall'
export type PupilStyle = 'standard' | 'big' | 'sparkle' | 'keen'
export type Expression = 'open' | 'relaxed' | 'cheerful_squint' | 'focused' | 'chill' | 'angry' | 'worried'

interface LidLine {
  outer: number
  inner: number
  ctrl: number
  lower?: { outer: number; inner: number; ctrl: number }
  brow: { tilt: number; lift: number }
}

/** Lid heights as a fraction of the eye radius, from the outer to the inner corner. */
const LIDS: Readonly<Record<Expression, LidLine>> = {
  open: { outer: -0.74, inner: -0.74, ctrl: -0.98, brow: { tilt: -4, lift: 2.5 } },
  relaxed: { outer: -0.34, inner: -0.34, ctrl: -0.52, brow: { tilt: 0, lift: 0.5 } },
  cheerful_squint: { outer: -0.5, inner: -0.5, ctrl: -0.76, lower: { outer: 0.42, inner: 0.42, ctrl: 0.02 }, brow: { tilt: -6, lift: 2 } },
  focused: { outer: -0.2, inner: -0.12, ctrl: -0.24, brow: { tilt: 9, lift: -0.5 } },
  chill: { outer: 0.06, inner: 0.06, ctrl: -0.06, brow: { tilt: 0, lift: -1 } },
  angry: { outer: -0.72, inner: 0.02, ctrl: -0.42, brow: { tilt: 20, lift: -1 } },
  worried: { outer: -0.08, inner: -0.8, ctrl: -0.52, brow: { tilt: -18, lift: 1.5 } },
}

export interface EyeSpec {
  cx: number
  cy: number
  /** Which side of the face, so lids and brows mirror correctly. */
  side: 'left' | 'right'
  rx: number
  ry: number
  color: AvatarEyeColor
  pupil: PupilStyle
  expression: Expression
}

export function eyeDefs(ctx: PaintContext, color: AvatarEyeColor): string {
  const c = EYE_COLOR_SWATCH[color] ?? EYE_COLOR_SWATCH.amber
  return `
    <radialGradient id="${ctx.uid}-sclera" cx="0.4" cy="0.36" r="0.7">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.7" stop-color="#f1f4fa"/>
      <stop offset="1" stop-color="#c4cddd"/>
    </radialGradient>
    <radialGradient id="${ctx.uid}-iris" cx="0.5" cy="0.62" r="0.62">
      <stop offset="0" stop-color="${c.inner}"/>
      <stop offset="0.45" stop-color="${c.mid}"/>
      <stop offset="0.92" stop-color="${c.outer}"/>
      <stop offset="1" stop-color="${c.ring}"/>
    </radialGradient>`
}

export function eyeSize(shape: EyeShape, base: number): { rx: number; ry: number } {
  if (shape === 'wide') return { rx: base * 1.08, ry: base * 0.92 }
  if (shape === 'tall') return { rx: base * 0.92, ry: base * 1.1 }
  return { rx: base, ry: base }
}

function lidPath(e: EyeSpec, l: { outer: number; inner: number; ctrl: number }, upper: boolean): string {
  const dir = e.side === 'left' ? 1 : -1
  const xOuter = e.cx - dir * (e.rx + 3)
  const xInner = e.cx + dir * (e.rx + 3)
  const yOuter = e.cy + l.outer * e.ry
  const yInner = e.cy + l.inner * e.ry
  const yCtrl = e.cy + l.ctrl * e.ry
  const edge = upper ? e.cy - e.ry - 6 : e.cy + e.ry + 6
  return `M${r2(xOuter)},${r2(edge)} L${r2(xInner)},${r2(edge)} L${r2(xInner)},${r2(yInner)} Q${r2(e.cx)},${r2(yCtrl)} ${r2(xOuter)},${r2(yOuter)} Z`
}

function lidEdge(e: EyeSpec, l: { outer: number; inner: number; ctrl: number }): string {
  const dir = e.side === 'left' ? 1 : -1
  const xOuter = e.cx - dir * (e.rx + 3)
  const xInner = e.cx + dir * (e.rx + 3)
  return `M${r2(xInner)},${r2(e.cy + l.inner * e.ry)} Q${r2(e.cx)},${r2(e.cy + l.ctrl * e.ry)} ${r2(xOuter)},${r2(e.cy + l.outer * e.ry)}`
}

export function renderEye(e: EyeSpec, ctx: PaintContext, shellSide: PieceSide): string {
  const clipId = `${ctx.uid}-eye-${e.side}`
  const lid = LIDS[e.expression] ?? LIDS.relaxed
  const look = e.side === 'left' ? 0.5 : -0.5
  const ix = r2(e.cx + look)
  const iy = r2(e.cy + 1.4)
  const irisR = Math.min(e.rx, e.ry) * (e.pupil === 'big' ? 0.7 : 0.64)
  const pupilR = irisR * (e.pupil === 'big' ? 0.62 : e.pupil === 'keen' ? 0.36 : 0.5)
  const c = EYE_COLOR_SWATCH[e.color] ?? EYE_COLOR_SWATCH.amber
  const fill = shellFill(ctx, shellSide)
  const deep = outlineColor(ctx, shellSide)
  const eyeShape = `<ellipse cx="${r2(e.cx)}" cy="${r2(e.cy)}" rx="${r2(e.rx)}" ry="${r2(e.ry)}"/>`

  let catch1 = `<ellipse cx="${r2(ix + irisR * 0.38)}" cy="${r2(iy - irisR * 0.4)}" rx="${r2(irisR * 0.32)}" ry="${r2(irisR * 0.24)}" transform="rotate(-30 ${r2(ix + irisR * 0.38)} ${r2(iy - irisR * 0.4)})" fill="#ffffff"/>`
  catch1 += `<circle cx="${r2(ix - irisR * 0.36)}" cy="${r2(iy + irisR * 0.38)}" r="${r2(irisR * 0.13)}" fill="#ffffff" opacity="0.8"/>`
  if (e.pupil === 'sparkle') {
    const sx = ix - irisR * 0.05
    const sy = iy - irisR * 0.05
    const s = irisR * 0.34
    catch1 += `<path d="M${r2(sx)},${r2(sy - s)} Q${r2(sx)},${r2(sy)} ${r2(sx + s)},${r2(sy)} Q${r2(sx)},${r2(sy)} ${r2(sx)},${r2(sy + s)} Q${r2(sx)},${r2(sy)} ${r2(sx - s)},${r2(sy)} Q${r2(sx)},${r2(sy)} ${r2(sx)},${r2(sy - s)} Z" fill="#ffffff" opacity="0.95"/>`
  }

  const upperLid = `<path d="${lidPath(e, lid, true)}" fill="${fill}"/><path d="${lidPath(e, lid, true)}" fill="url(#${ids(ctx).ao})"/>`
  const lowerLid = lid.lower
    ? `<path d="${lidPath(e, lid.lower, false)}" fill="${fill}"/><path d="${lidEdge(e, lid.lower)}" fill="none" stroke="${deep}" stroke-width="1.6" stroke-linecap="round"/>`
    : ''

  const browDir = e.side === 'left' ? 1 : -1
  const bw = e.rx * 0.62
  const by = e.cy - e.ry * 0.86 - lid.brow.lift
  const brow = `<path d="M${r2(e.cx - bw)},${r2(by + 1.6)} Q${r2(e.cx)},${r2(by - 2.4)} ${r2(e.cx + bw)},${r2(by + 1.6)}" fill="none" stroke="${deep}" stroke-width="3.2" stroke-linecap="round" transform="rotate(${lid.brow.tilt * browDir} ${r2(e.cx)} ${r2(by)})"/>`

  return `<g class="avatar-eye" data-eye-side="${e.side}">
    <clipPath id="${clipId}">${eyeShape}</clipPath>
    <ellipse cx="${r2(e.cx)}" cy="${r2(e.cy)}" rx="${r2(e.rx)}" ry="${r2(e.ry)}" fill="url(#${ctx.uid}-sclera)" stroke="${deep}" stroke-width="2.3"/>
    <g clip-path="url(#${clipId})">
      <circle cx="${ix}" cy="${iy}" r="${r2(irisR)}" fill="url(#${ctx.uid}-iris)"/>
      <circle cx="${ix}" cy="${iy}" r="${r2(irisR - 0.4)}" fill="none" stroke="${c.ring}" stroke-width="0.8"/>
      <circle cx="${ix}" cy="${iy}" r="${r2(pupilR)}" fill="#07070c"/>
      ${catch1}
      <g class="lobster-idle-layer lobster-idle-eyelid-${e.side}">${upperLid}<path d="${lidEdge(e, lid)}" fill="none" stroke="${deep}" stroke-width="1.8" stroke-linecap="round"/></g>
      ${lowerLid}
      <g class="lobster-idle-layer lobster-idle-blink" opacity="0"><rect x="${r2(e.cx - e.rx - 2)}" y="${r2(e.cy - e.ry - 2)}" width="${r2(e.rx * 2 + 4)}" height="${r2(e.ry * 2 + 4)}" fill="${fill}"/></g>
    </g>
    <ellipse cx="${r2(e.cx)}" cy="${r2(e.cy)}" rx="${r2(e.rx)}" ry="${r2(e.ry)}" fill="none" stroke="${deep}" stroke-width="2.3"/>
    <g class="lobster-idle-layer lobster-idle-brow-${e.side}">${brow}</g>
  </g>`
}

// ---------------------------------------------------------------------------
// Mouth and cheeks
// ---------------------------------------------------------------------------

const MOUTH_DARK = '#3b0b14'
const TONGUE = '#ff6f86'
const TEETH = '#fffaf2'

export function renderMouth(type: AvatarMouth, cx: number, cy: number, ctx: PaintContext, scale = 1): string {
  const deep = ctx.palette.deep
  const t = `translate(${r2(cx)} ${r2(cy)}) scale(${scale})`
  const dimples = `<path d="M-14.5,-3.6 Q-16,-1.6 -14.2,0.4" fill="none" stroke="${deep}" stroke-width="1.5" stroke-linecap="round"/><path d="M14.5,-3.6 Q16,-1.6 14.2,0.4" fill="none" stroke="${deep}" stroke-width="1.5" stroke-linecap="round"/>`
  const clipId = `${ctx.uid}-mouth`
  const open = (d: string, teethH: number, tongue: string) => `
    <clipPath id="${clipId}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${MOUTH_DARK}"/>
    <g clip-path="url(#${clipId})">
      ${tongue}
      <rect x="-20" y="-6" width="40" height="${teethH + 6}" fill="${TEETH}"/>
      <path d="M-6,-6 V${teethH} M0,-6 V${teethH + 0.4} M6,-6 V${teethH}" stroke="#e6d9cc" stroke-width="0.7"/>
    </g>
    <path d="${d}" fill="none" stroke="${deep}" stroke-width="2.2" stroke-linejoin="round"/>`
  let body = ''
  switch (type) {
    case 'smile':
      body = `<path d="M-12.5,-2.5 Q0,10 12.5,-2.5" fill="none" stroke="${deep}" stroke-width="2.6" stroke-linecap="round"/>${dimples}`
      break
    case 'smirk':
      body = `<path d="M-10,1 Q3,7.5 12.5,-4" fill="none" stroke="${deep}" stroke-width="2.6" stroke-linecap="round"/><path d="M14.5,-5.6 Q16,-3.4 14,-1.8" fill="none" stroke="${deep}" stroke-width="1.5" stroke-linecap="round"/>`
      break
    case 'tongue':
      body = `<path d="M-3.8,2.6 Q-5,11 0,11.4 Q5,11 3.8,2.6 Z" fill="${TONGUE}" stroke="${deep}" stroke-width="1.6" stroke-linejoin="round"/><path d="M0,4.5 V8.5" stroke="#d94a64" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M-12.5,-2.5 Q0,8 12.5,-2.5" fill="none" stroke="${deep}" stroke-width="2.6" stroke-linecap="round"/>${dimples}`
      break
    case 'fang':
      body = `<path d="M-5.5,2.2 L-3.4,6.6 L-1.6,2.8 Z" fill="${TEETH}" stroke="${deep}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M-12.5,-2.5 Q0,8.5 12.5,-2.5" fill="none" stroke="${deep}" stroke-width="2.6" stroke-linecap="round"/>${dimples}`
      break
    case 'oh':
      body = `<clipPath id="${clipId}"><ellipse cx="0" cy="2.5" rx="5.2" ry="6.4"/></clipPath>
        <ellipse cx="0" cy="2.5" rx="5.2" ry="6.4" fill="${MOUTH_DARK}"/>
        <ellipse cx="0" cy="8" rx="4" ry="2.8" fill="${TONGUE}" clip-path="url(#${clipId})"/>
        <ellipse cx="0" cy="2.5" rx="5.2" ry="6.4" fill="none" stroke="${deep}" stroke-width="2.2"/>`
      break
    case 'beam':
      body = open('M-16,-4.5 Q0,-2 16,-4.5 Q14,16 0,17 Q-14,16 -16,-4.5 Z', -0.2, `<ellipse cx="0" cy="15" rx="9" ry="6.5" fill="${TONGUE}"/>`)
      break
    case 'grin':
    default:
      body = open('M-14,-3.2 Q0,-1.2 14,-3.2 Q12,12.5 0,13.2 Q-12,12.5 -14,-3.2 Z', 0.6, `<ellipse cx="0" cy="12" rx="7" ry="4.8" fill="${TONGUE}"/>`)
      break
  }
  return `<g class="avatar-mouth" data-mouth="${type}" transform="${t}">${body}</g>`
}

export function renderCheeks(ctx: PaintContext, lx: number, rx: number, y: number): string {
  const b = ids(ctx).blush
  return `<ellipse cx="${lx}" cy="${y}" rx="8" ry="5" fill="url(#${b})"/><ellipse cx="${rx}" cy="${y}" rx="8" ry="5" fill="url(#${b})"/>`
}

// ---------------------------------------------------------------------------
// Claws and arms
// ---------------------------------------------------------------------------

const CLAW_SHAPES = {
  classic: {
    palm: 'M-6,2 C-16,0 -20,-12 -19,-24 C-18,-36 -14,-48 -6,-56 C-3,-58 -1,-56 -2,-52 C-6,-44 -6,-34 -1,-28 C4,-26 9,-28 12,-30 C15,-20 13,-6 6,0 C3,3 -2,3 -6,2 Z',
    finger: 'M12,-30 C16,-38 14,-50 6,-58 C3,-61 0,-60 1,-57 C6,-50 6,-42 2,-34 C5,-31 9,-30 12,-30 Z',
    teeth: [[-4.4, -42, 1.1], [-3.8, -35, 1.1], [4.4, -47, 1], [4.4, -40, 1]],
    glint: 'M-15.5,-20 C-15.5,-30 -12,-40 -8,-46 C-10,-38 -12,-30 -12.5,-20 Z',
  },
  crusher: {
    palm: 'M-7,3 C-21,1 -25,-14 -23,-28 C-21,-40 -15,-50 -6,-52 C-2,-53 0,-50 -2,-46 C-5,-40 -5,-34 -1,-30 C5,-28 11,-30 15,-33 C19,-20 16,-5 7,1 C3,4 -3,4 -7,3 Z',
    finger: 'M15,-33 C19,-42 15,-52 6,-56 C2,-57 0,-55 2,-52 C6,-48 6,-42 2,-35 C6,-32 11,-31 15,-33 Z',
    teeth: [[-4, -43, 1.7], [-3.2, -36, 1.8], [4.6, -46, 1.5], [4.4, -40, 1.6]],
    glint: 'M-19,-22 C-19,-32 -15,-41 -10,-46 C-12,-38 -15,-30 -16,-22 Z',
  },
} as const

export interface ClawPlacement {
  x: number
  y: number
  rot: number
  scale: number
  side: 'left' | 'right'
}

export function renderClaw(p: ClawPlacement, style: AvatarClaws, ctx: PaintContext): string {
  const heavy = style === 'crusher' && p.side === 'right'
  const shape = heavy ? CLAW_SHAPES.crusher : CLAW_SHAPES.classic
  let s = p.scale
  if (style === 'crusher') s *= heavy ? 1.2 : 0.9
  const stretch = style === 'slim' ? 'scale(0.8 1.14)' : style === 'mitten' ? 'scale(1.14 0.84)' : ''
  const mirror = p.side === 'right' ? ' scale(-1 1)' : ''
  const transform = `translate(${r2(p.x)} ${r2(p.y)}) rotate(${r2(p.rot)}) scale(${r2(s)})${mirror}${stretch ? ` ${stretch}` : ''}`
  const teeth = shape.teeth
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ctx.palette.belly}" stroke="${outlineColor(ctx, p.side)}" stroke-width="0.6"/>`)
    .join('')
  return `<g class="lobster-idle-layer lobster-idle-claw-${p.side}" data-claw="${heavy ? 'crusher' : style}">
    <g transform="${transform}">
      ${piece(shape.finger, ctx, { side: p.side })}
      ${teeth}
      ${piece(shape.palm, ctx, { side: p.side })}
      ${glint(shape.glint, ctx, 0.55)}
      ${piece('M-8.5,4 C-8.5,0 8.5,0 8.5,4 C8.5,8.6 -8.5,8.6 -8.5,4 Z', ctx, { side: p.side, plain: true, noRim: true })}
    </g>
  </g>`
}

export interface ArmCurve {
  p0: Pt
  p1: Pt
  p2: Pt
  p3: Pt
}

export function renderArm(a: ArmCurve, side: 'left' | 'right', ctx: PaintContext, width = 10): string {
  const d = taperedCurve(a.p0, a.p1, a.p2, a.p3, width, width * 0.78)
  return `<g class="lobster-idle-layer lobster-idle-arm-${side}">${piece(d, ctx, { side, plain: true })}</g>`
}

// ---------------------------------------------------------------------------
// Antennae (authored for the left side, root at 0,0, sweeping up and out)
// ---------------------------------------------------------------------------

function thin(d: string, ctx: PaintContext, side: PieceSide): string {
  return `<path d="${d}" fill="${shellFill(ctx, side)}" stroke="${outlineColor(ctx, side)}" stroke-width="1.3" stroke-linejoin="round"/>`
}

function glowBulb(x: number, y: number, r: number, ctx: PaintContext): string {
  return `<circle cx="${x}" cy="${y}" r="${r * 2.1}" fill="${ctx.rim}" opacity="0.22"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${ctx.rim}" stroke="#ffffff" stroke-width="0.8" filter="url(#${ids(ctx).glow})"/>
    <circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#ffffff"/>`
}

function antennaShapes(style: AvatarAntennae, ctx: PaintContext, side: PieceSide): string {
  const antennule = thin(taperedCurve([2, -2], [2, -14], [-1, -24], [-7, -30], 2.6, 1), ctx, side)
  switch (style) {
    case 'curl':
      return `${antennule}
        ${thin(taperedCurve([0, 0], [-2, -22], [-14, -40], [-32, -46], 3.4, 1.8), ctx, side)}
        ${thin(taperedCurve([-32, -46], [-46, -50], [-50, -36], [-40, -33], 1.8, 1.1), ctx, side)}
        ${thin(taperedCurve([-40, -33], [-34, -31], [-34, -38], [-38, -39], 1.1, 0.8), ctx, side)}`
    case 'plume': {
      const barbs: [Pt, Pt, Pt][] = [
        [[-22, -44], [-26, -52], [-30, -55]],
        [[-28, -46], [-30, -40], [-36, -38]],
        [[-32, -48], [-38, -55], [-42, -56]],
        [[-37, -49], [-41, -44], [-46, -43]],
      ]
      const barbMarkup = barbs
        .map(([a, b, c]) => thin(taperedCurve(a, b, b, c, 1.8, 0.6), ctx, side))
        .join('')
      return `${antennule}${thin(taperedCurve([0, 0], [-2, -22], [-16, -44], [-46, -50], 3.4, 1), ctx, side)}${barbMarkup}`
    }
    case 'bolt': {
      const pts: Pt[] = [[0, 0], [-6, -16], [0, -24], [-16, -38], [-28, -50]]
      const segs = pts
        .slice(0, -1)
        .map((a, idx) => {
          const b = pts[idx + 1]
          const w0 = 3.4 - idx * 0.55
          return thin(taperedCurve(a, a, b, b, w0, w0 - 0.55), ctx, side)
        })
        .join('')
      return `${antennule}${segs}<path d="M-28,-55 L-24,-50 L-28,-45 L-32,-50 Z" fill="${ctx.rim}" stroke="#ffffff" stroke-width="0.7" filter="url(#${ids(ctx).glow})"/>`
    }
    case 'beacon':
      return `${antennule}${thin(taperedCurve([0, 0], [0, -18], [-6, -30], [-16, -38], 3.4, 2), ctx, side)}${glowBulb(-18, -40, 4.2, ctx)}`
    case 'whip':
    default:
      return `${antennule}${thin(taperedCurve([0, 0], [-2, -24], [-18, -46], [-44, -52], 3.4, 0.9), ctx, side)}`
  }
}

export function renderAntennae(
  style: AvatarAntennae,
  ctx: PaintContext,
  roots: { left: Pt; right: Pt },
  scale = 1
): string {
  const one = (side: 'left' | 'right') => {
    const [x, y] = roots[side]
    const flip = side === 'right' ? ' scale(-1 1)' : ''
    return `<g class="lobster-idle-layer lobster-idle-antenna-${side}"><g transform="translate(${x} ${y}) scale(${scale})${flip}">${antennaShapes(style, ctx, side)}</g></g>`
  }
  return `<g class="lobster-idle-layer lobster-idle-antennae" data-antennae="${style}">${one('left')}${one('right')}</g>`
}

// ---------------------------------------------------------------------------
// Accessories (anchored on the top centre of the eyes, mouth for the headset mic)
// ---------------------------------------------------------------------------

export function renderAccessory(
  acc: AvatarAccessory,
  ctx: PaintContext,
  anchor: { x: number; top: number; eyeY: number; mouth: Pt }
): string {
  if (acc === 'none') return ''
  const { x, top } = anchor
  const at = (dx: number, dy: number) => `translate(${r2(x + dx)} ${r2(top + dy)})`
  const uid = ctx.uid
  let body = ''
  switch (acc) {
    case 'hard_hat':
      body = `<defs><linearGradient id="${uid}-hat" x1="0.2" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#fff2a1"/><stop offset="0.45" stop-color="#ffc928"/><stop offset="1" stop-color="#d48e00"/></linearGradient></defs>
        <g transform="${at(0, 2)} rotate(-6)">
          <path d="M-31,2 C-31,-2 31,-2 31,2 C31,6.5 -31,6.5 -31,2 Z" fill="url(#${uid}-hat)" stroke="#5c3d00" stroke-width="2"/>
          <path d="M-22,0 C-22,-20 -10,-27 0,-27 C10,-27 22,-20 22,0 Z" fill="url(#${uid}-hat)" stroke="#5c3d00" stroke-width="2" stroke-linejoin="round"/>
          <path d="M-4,-26.5 C-4,-14 -4,-6 -4,0 L4,0 C4,-6 4,-14 4,-26.5 Z" fill="#ffd84a" stroke="#5c3d00" stroke-width="1.2"/>
          <path d="M-17,-8 C-16,-16 -11,-21 -6,-23" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" opacity="0.75"/>
          <circle cx="0" cy="-9" r="3.2" fill="${ctx.rim}" stroke="#5c3d00" stroke-width="1" filter="url(#${ids(ctx).glow})"/>
        </g>`
      break
    case 'crown':
      body = `<defs><linearGradient id="${uid}-crown" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset="0.5" stop-color="#ffcf3a"/><stop offset="1" stop-color="#c98a0a"/></linearGradient></defs>
        <g transform="${at(3, 0)} rotate(10)">
          <path d="M-14,2 L-16,-15 L-7,-6 L0,-19 L7,-6 L16,-15 L14,2 Z" fill="url(#${uid}-crown)" stroke="#6b4300" stroke-width="1.8" stroke-linejoin="round"/>
          <rect x="-14.5" y="-2" width="29" height="5" rx="1.5" fill="#f3b622" stroke="#6b4300" stroke-width="1.5"/>
          <circle cx="0" cy="0.5" r="1.9" fill="#ff3f6c"/><circle cx="-8" cy="0.5" r="1.4" fill="${ctx.rim}"/><circle cx="8" cy="0.5" r="1.4" fill="${ctx.rim}"/>
          <circle cx="-16" cy="-15" r="1.6" fill="#fff6c2"/><circle cx="0" cy="-19" r="1.8" fill="#fff6c2"/><circle cx="16" cy="-15" r="1.6" fill="#fff6c2"/>
        </g>`
      break
    case 'halo':
      body = `<g transform="${at(0, -10)}" filter="url(#${ids(ctx).glow})">
          <ellipse cx="0" cy="0" rx="20" ry="5.5" fill="none" stroke="#fff3b0" stroke-width="3.6" opacity="0.95"/>
          <ellipse cx="0" cy="0" rx="20" ry="5.5" fill="none" stroke="${ctx.rim}" stroke-width="1.2"/>
        </g>`
      break
    case 'visor': {
      const y = anchor.eyeY - top
      body = `<defs><linearGradient id="${uid}-visor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ctx.rim}" stop-opacity="0.75"/><stop offset="1" stop-color="#0a1c2e" stop-opacity="0.8"/></linearGradient></defs>
        <g transform="${at(0, y)}">
          <path d="M-32,-7 C-32,-12 32,-12 32,-7 L30,7 C29,11 -29,11 -30,7 Z" fill="url(#${uid}-visor)" stroke="#0b1520" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M-22,-6 L-14,6 M-14,-7 L-9,0" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
          <path d="M-28,2 H28" stroke="${ctx.rim}" stroke-width="0.8" opacity="0.7"/>
          <rect x="-35" y="-4" width="5" height="8" rx="2" fill="#1d2a38" stroke="#0b1520" stroke-width="1.2"/>
          <rect x="30" y="-4" width="5" height="8" rx="2" fill="#1d2a38" stroke="#0b1520" stroke-width="1.2"/>
        </g>`
      break
    }
    case 'headset': {
      const [mx, my] = anchor.mouth
      const ex = x + 31
      const ey = anchor.eyeY + 6
      body = `<path d="M${r2(x - 30)},${r2(ey)} C${r2(x - 30)},${r2(top - 14)} ${r2(x + 30)},${r2(top - 14)} ${r2(x + 30)},${r2(ey)}" fill="none" stroke="#18212c" stroke-width="4" stroke-linecap="round"/>
        <path d="M${r2(ex)},${r2(ey + 4)} C${r2(ex + 2)},${r2(my)} ${r2(mx + 18)},${r2(my + 2)} ${r2(mx + 11)},${r2(my + 1)}" fill="none" stroke="#18212c" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="${r2(mx + 6)}" y="${r2(my - 2)}" width="7" height="5" rx="2.5" fill="#18212c"/>
        <circle cx="${r2(ex)}" cy="${r2(ey)}" r="7.5" fill="#1d2a38" stroke="#0b1520" stroke-width="1.8"/>
        <circle cx="${r2(ex)}" cy="${r2(ey)}" r="4" fill="none" stroke="${ctx.rim}" stroke-width="1.6" filter="url(#${ids(ctx).glow})"/>`
      break
    }
    case 'bow':
      body = `<g transform="${at(20, 0)} rotate(18)">
          <path d="M0,0 C-6,-9 -15,-8 -14,0 C-15,8 -6,9 0,0 Z" fill="#ff4f8f" stroke="#7a1040" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M0,0 C6,-9 15,-8 14,0 C15,8 6,9 0,0 Z" fill="#ff4f8f" stroke="#7a1040" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M-11,-2.5 C-9,-5 -6,-5 -4,-3" fill="none" stroke="#ffd0e4" stroke-width="1.4" stroke-linecap="round"/>
          <circle cx="0" cy="0" r="3.2" fill="#ff6fa5" stroke="#7a1040" stroke-width="1.4"/>
        </g>`
      break
    case 'beanie':
      body = `<defs><linearGradient id="${uid}-beanie" x1="0.2" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#7cf0ff"/><stop offset="1" stop-color="#1a6a96"/></linearGradient></defs>
        <g transform="${at(0, 4)}">
          <path d="M-24,0 C-24,-22 -12,-28 0,-28 C12,-28 24,-22 24,0 Z" fill="url(#${uid}-beanie)" stroke="#0a2a40" stroke-width="2" stroke-linejoin="round"/>
          <path d="M-12,-25 V-2 M0,-28 V-2 M12,-25 V-2" stroke="#0a2a40" stroke-width="1" opacity="0.35"/>
          <rect x="-26" y="-5" width="52" height="9" rx="4" fill="#ff7a59" stroke="#0a2a40" stroke-width="2"/>
          <path d="M-20,-4 V3 M-14,-4 V3 M-8,-4 V3 M-2,-4 V3 M4,-4 V3 M10,-4 V3 M16,-4 V3 M22,-4 V3" stroke="#a83a24" stroke-width="0.9" opacity="0.6"/>
          <circle cx="0" cy="-30" r="6" fill="#ffffff" stroke="#0a2a40" stroke-width="1.8"/>
          <circle cx="-2" cy="-32" r="2" fill="#ffffff" opacity="0.9"/>
        </g>`
      break
  }
  return `<g class="avatar-accessory" data-accessory="${acc}">${body}</g>`
}
