/**
 * Shell paint: gradients, finishes, and marking patterns, plus the `piece` painter that
 * gives every shell part the same outline, colour, marking, shading, and rim light.
 * Gradients use object bounding boxes so each part is lit consistently whatever its size.
 */
import type { ShellFinish, ShellMarking, ShellPalette } from './traits'

export interface PaintContext {
  /** Unique id prefix so several avatars can share one page. */
  uid: string
  palette: ShellPalette
  /** Second palette for split shells; null otherwise. */
  partner: ShellPalette | null
  finish: ShellFinish
  marking: ShellMarking
  /** Back-light colour picked up from the scene. */
  rim: string
}

export type PieceSide = 'left' | 'right' | 'center'

export const OUTLINE_WIDTH = 2.3

export const ids = (ctx: PaintContext) => ({
  shell: `${ctx.uid}-shell`,
  shellB: `${ctx.uid}-shell-b`,
  belly: `${ctx.uid}-belly`,
  ao: `${ctx.uid}-ao`,
  spec: `${ctx.uid}-spec`,
  rim: `${ctx.uid}-rim`,
  pearl: `${ctx.uid}-pearl`,
  mark: `${ctx.uid}-mark`,
  split: `${ctx.uid}-split`,
  glow: `${ctx.uid}-glow`,
  softShadow: `${ctx.uid}-soft-shadow`,
  blush: `${ctx.uid}-blush`,
})

function shellGradient(id: string, p: ShellPalette, finish: ShellFinish): string {
  if (finish === 'chrome') {
    return `<linearGradient id="${id}" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="${p.highlight}"/>
      <stop offset="0.32" stop-color="${p.base}"/>
      <stop offset="0.5" stop-color="${p.shade}"/>
      <stop offset="0.64" stop-color="${p.highlight}"/>
      <stop offset="0.82" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.deep}"/>
    </linearGradient>`
  }
  const mid = finish === 'satin' ? 0.5 : 0.42
  return `<linearGradient id="${id}" x1="0.2" y1="0" x2="0.75" y2="1">
      <stop offset="0" stop-color="${p.highlight}"/>
      <stop offset="${mid}" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.shade}"/>
    </linearGradient>`
}

function markingColor(ctx: PaintContext): string {
  if (ctx.finish === 'glow') return ctx.rim
  if (ctx.marking === 'stardust') return '#ffffff'
  return ctx.palette.marking
}

function markingPattern(ctx: PaintContext): string {
  const id = ids(ctx).mark
  const c = markingColor(ctx)
  const glow = ctx.finish === 'glow'
  const op = glow ? 0.95 : 0.62
  switch (ctx.marking) {
    case 'spots':
      return `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
        <g fill="${c}" opacity="${op}">
          <circle cx="5" cy="6" r="3.3"/><circle cx="16.5" cy="4" r="1.8"/><circle cx="14" cy="15" r="2.7"/>
          <circle cx="4" cy="17.5" r="1.5"/><circle cx="20.5" cy="20" r="1.2"/>
        </g></pattern>`
    case 'freckles':
      return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
        <g fill="${c}" opacity="${op}"><circle cx="2" cy="2" r="0.85"/><circle cx="6.5" cy="5.4" r="0.65"/><circle cx="3" cy="7.6" r="0.5"/></g>
      </pattern>`
    case 'bands':
      return `<pattern id="${id}" width="40" height="13" patternUnits="userSpaceOnUse">
        <path d="M0,3 Q10,0.6 20,3 T40,3 V7.2 Q30,9.8 20,7.2 T0,7.2 Z" fill="${c}" opacity="${op}"/>
      </pattern>`
    case 'tiger':
      return `<pattern id="${id}" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <g fill="${c}" opacity="${op}">
          <path d="M1,7 Q9,2.5 17,7.5 Q9,5.6 1,9 Z"/>
          <path d="M13,19 Q21,13.5 29.5,18.5 Q21,16.8 13,21.5 Z"/>
          <path d="M-2,26 Q4,23 9,26.5 Q4,25.5 -2,28 Z"/>
        </g></pattern>`
    case 'stardust':
      return `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse">
        <g fill="${c}">
          <circle cx="3" cy="4" r="0.7" opacity="0.9"/><circle cx="14" cy="9" r="0.45" opacity="0.7"/>
          <circle cx="21" cy="3" r="0.55" opacity="0.8"/><circle cx="8" cy="18" r="0.5" opacity="0.75"/>
          <circle cx="19" cy="21" r="0.8" opacity="0.9"/><circle cx="24" cy="13" r="0.4" opacity="0.6"/>
          <path d="M11,13 L11.6,14.4 L13,15 L11.6,15.6 L11,17 L10.4,15.6 L9,15 L10.4,14.4 Z" opacity="0.95"/>
        </g></pattern>`
    case 'calico':
      return `<pattern id="${id}" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
        <path d="M6,8 C14,2 26,6 24,15 C22,24 10,24 6,19 C2,15 1,11 6,8 Z" fill="${c}" opacity="${op}"/>
        <path d="M38,30 C48,24 60,32 56,42 C52,50 40,48 36,42 C33,37 33,33 38,30 Z" fill="${ctx.palette.belly}" opacity="0.75"/>
        <path d="M14,44 C20,40 28,44 26,51 C24,57 16,57 13,53 C10,50 10,46 14,44 Z" fill="${c}" opacity="${op}"/>
        <path d="M44,4 C49,2 54,6 52,10 C50,14 44,13 43,10 C42,8 42,5 44,4 Z" fill="${ctx.palette.belly}" opacity="0.7"/>
      </pattern>`
    case 'circuit':
      return `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="${glow ? c : ctx.rim}" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" opacity="${glow ? 0.95 : 0.7}">
          <path d="M2,6 H12 L17,11 V20"/><path d="M22,2 V8 L28,14 H33"/><path d="M6,33 V26 L11,21 H20"/>
          <path d="M26,22 V30"/>
        </g>
        <g fill="${glow ? c : ctx.rim}" opacity="${glow ? 1 : 0.85}">
          <circle cx="2" cy="6" r="1.3"/><circle cx="17" cy="20" r="1.3"/><circle cx="22" cy="2" r="1.1"/>
          <circle cx="20" cy="21" r="1.1"/><circle cx="26" cy="30" r="1.3"/>
        </g></pattern>`
    default:
      return ''
  }
}

/** All shared paint defs for one avatar. */
export function paintDefs(ctx: PaintContext): string {
  const i = ids(ctx)
  const p = ctx.palette
  const specOpacity = { glossy: 0.85, satin: 0.38, pearl: 0.7, chrome: 0.95, glow: 0.5 }[ctx.finish]
  const aoOpacity = ctx.finish === 'satin' ? 0.42 : 0.55
  const rimOpacity = ctx.finish === 'glow' ? 1 : 0.85
  const partner = ctx.partner
  return `
    ${shellGradient(i.shell, p, ctx.finish)}
    ${partner ? shellGradient(i.shellB, partner, ctx.finish) : ''}
    <linearGradient id="${i.belly}" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${p.belly}"/>
      <stop offset="1" stop-color="${p.bellyShade}"/>
    </linearGradient>
    <radialGradient id="${i.ao}" cx="0.42" cy="0.34" r="0.78">
      <stop offset="0.55" stop-color="${p.deep}" stop-opacity="0"/>
      <stop offset="1" stop-color="${p.deep}" stop-opacity="${aoOpacity}"/>
    </radialGradient>
    <radialGradient id="${i.spec}" cx="0.33" cy="0.2" r="0.42">
      <stop offset="0" stop-color="#ffffff" stop-opacity="${specOpacity}"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="${(specOpacity * 0.3).toFixed(2)}"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${i.rim}" x1="0" y1="0.2" x2="1" y2="0.8">
      <stop offset="0.55" stop-color="${ctx.rim}" stop-opacity="0"/>
      <stop offset="1" stop-color="${ctx.rim}" stop-opacity="${rimOpacity}"/>
    </linearGradient>
    ${ctx.finish === 'pearl' ? `<linearGradient id="${i.pearl}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9be6" stop-opacity="0.55"/>
      <stop offset="0.35" stop-color="#9ef3ff" stop-opacity="0.35"/>
      <stop offset="0.65" stop-color="#fff0a0" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#c79bff" stop-opacity="0.5"/>
    </linearGradient>` : ''}
    ${markingPattern(ctx)}
    ${ctx.marking === 'split' && partner ? `<pattern id="${i.split}" x="-350" y="-200" width="800" height="800" patternUnits="userSpaceOnUse">
      <rect x="400" width="400" height="800" fill="${partner.base}"/>
    </pattern>` : ''}
    <filter id="${i.glow}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="${i.softShadow}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#01050a" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#01050a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${i.blush}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${p.blush}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${p.blush}" stop-opacity="0"/>
    </radialGradient>`
}

export interface PieceOptions {
  side?: PieceSide
  belly?: boolean
  /** Skip markings (small joints, eyelids). */
  plain?: boolean
  /** Skip the rim light stroke. */
  noRim?: boolean
  attrs?: string
}

/** Fill used for a shell part on the given side (split shells swap the right side). */
export function shellFill(ctx: PaintContext, side: PieceSide = 'center'): string {
  const i = ids(ctx)
  return ctx.marking === 'split' && ctx.partner && side === 'right' ? `url(#${i.shellB})` : `url(#${i.shell})`
}

export function outlineColor(ctx: PaintContext, side: PieceSide = 'center'): string {
  return ctx.marking === 'split' && ctx.partner && side === 'right' ? ctx.partner.deep : ctx.palette.deep
}

/** Paint one closed shell part with outline, marking, shading, sheen, and rim light. */
export function piece(d: string, ctx: PaintContext, opts: PieceOptions = {}): string {
  const i = ids(ctx)
  const side = opts.side ?? 'center'
  const fill = opts.belly ? `url(#${i.belly})` : shellFill(ctx, side)
  const outline = outlineColor(ctx, side)
  const layers: string[] = []
  layers.push(`<path d="${d}" fill="${fill}" stroke="${outline}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>`)
  if (!opts.belly && !opts.plain) {
    if (ctx.marking === 'split' && ctx.partner && side === 'center') {
      layers.push(`<path d="${d}" fill="url(#${i.split})"/>`)
    } else if (ctx.marking !== 'none' && ctx.marking !== 'split') {
      const glowAttr = ctx.finish === 'glow' ? ` filter="url(#${i.glow})"` : ''
      layers.push(`<path d="${d}" fill="url(#${i.mark})"${glowAttr}/>`)
    }
  }
  if (!opts.belly && ctx.finish === 'pearl') {
    layers.push(`<path d="${d}" fill="url(#${i.pearl})"/>`)
  }
  layers.push(`<path d="${d}" fill="url(#${i.ao})"/>`)
  layers.push(`<path d="${d}" fill="url(#${i.spec})"/>`)
  if (!opts.noRim) {
    const glowAttr = ctx.finish === 'glow' ? ` filter="url(#${i.glow})"` : ''
    layers.push(`<path d="${d}" fill="none" stroke="url(#${i.rim})" stroke-width="2.2" stroke-linejoin="round"${glowAttr}/>`)
  }
  return `<g${opts.attrs ? ` ${opts.attrs}` : ''}>${layers.join('')}</g>`
}

/** A crisp specular streak for big glossy parts. */
export function glint(d: string, ctx: PaintContext, opacity = 0.75): string {
  if (ctx.finish === 'satin') opacity *= 0.45
  return `<path d="${d}" fill="#ffffff" opacity="${opacity.toFixed(2)}"/>`
}
