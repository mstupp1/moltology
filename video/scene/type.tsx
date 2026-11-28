/**
 * Kinetic type for scenes. Every style reveals with masks and eased offsets (never fades alone),
 * lands on the words the voice says, and sits in the frame's calm third. One type system for
 * the whole series: Space Grotesk titles at 500, Inter labels, sentence case, cyan as the signal.
 */
import React from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { C, FONT } from '../theme'
import { cueAt, useBeat } from '../timeline'

export type TypeSpec =
  | { style: 'title'; text: string; eyebrow?: string }
  | { style: 'kicker'; text: string; source?: string }
  | { style: 'statement'; text: string }
  | { style: 'chapter-move'; number: number; text: string; sub?: string }
  | { style: 'list'; items: string[] }
  | { style: 'split'; left: string; right: string }
  | { style: 'quote'; text: string }
  | { style: 'meter'; from: number; to: number; label: string }
  | { style: 'timer'; minutes: number }
  | { style: 'depth-readings'; items: string[]; focus?: number[] }

const out = Easing.bezier(0.16, 1, 0.3, 1)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** A line that rises out of a mask: the motion-design reveal. */
const MaskLine: React.FC<{ at: number; children: React.ReactNode; size: number; style?: React.CSSProperties; length?: number }> = ({ at, children, size, style, length = 22 }) => {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [at, at + length], [0, 1], { ...clamp, easing: out })
  return (
    <div style={{ overflow: 'hidden', paddingBottom: size * 0.12, ...style }}>
      <div style={{ translate: `0 ${(1 - p) * size * 1.15}px`, opacity: Math.min(1, p * 3) }}>{children}</div>
    </div>
  )
}

/** Words that land one at a time as they are said. */
const SpokenWords: React.FC<{ text: string; size: number; color?: string; weight?: number; font?: string; fallbackSpread?: number }> = ({ text, size, color = C.ink, weight = 500, font = FONT.title, fallbackSpread = 0.5 }) => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  const words = text.split(' ')
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: size * 0.28, fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1.02, letterSpacing: '-0.025em' }}>
      {words.map((w, i) => {
        // The phrase starts on its first spoken word and finishes in a quick cascade, so the whole
        // statement holds on screen while the line lands.
        const first = cueAt(beat, words[0].replace(/[^a-z0-9]/gi, '') || 'x', 0.08)
        const own = cueAt(beat, w.replace(/[^a-z0-9]/gi, '') || 'x', 0.08 + (i / words.length) * fallbackSpread)
        const at = Math.min(own, first + i * 5)
        const p = interpolate(frame, [at - 2, at + 14], [0, 1], { ...clamp, easing: out })
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.1 }}>
            <span style={{ display: 'inline-block', translate: `0 ${(1 - p) * 130}%`, filter: `blur(${(1 - p) * 6}px)` }}>{w}</span>
          </span>
        )
      })}
    </div>
  )
}

const Eyebrow: React.FC<{ at: number; text: string; color?: string }> = ({ at, text, color = C.cyan }) => {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [at, at + 20], [0, 1], { ...clamp, easing: out })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: p }}>
      <div style={{ width: 60 * p, height: 2, background: color }} />
      <div style={{ fontFamily: FONT.text, fontSize: 26, letterSpacing: '0.16em', textTransform: 'uppercase', color }}>{text}</div>
    </div>
  )
}

const Left: React.FC<{ children: React.ReactNode; top?: boolean }> = ({ children, top }) => (
  <AbsoluteFill style={{ justifyContent: top ? 'flex-start' : 'center', padding: top ? '120px 140px' : '0 140px', gap: 26 }}>{children}</AbsoluteFill>
)

export const TypeLayer: React.FC<{ spec: TypeSpec }> = ({ spec }) => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  switch (spec.style) {
    case 'title':
      return (
        <Left>
          {spec.eyebrow ? <Eyebrow at={6} text={spec.eyebrow} /> : null}
          <MaskLine at={12} size={150} length={28}>
            <div style={{ fontFamily: FONT.title, fontSize: 150, fontWeight: 500, color: C.ink, letterSpacing: '-0.035em', textShadow: '0 10px 60px rgba(0,0,0,0.45)' }}>{spec.text}</div>
          </MaskLine>
        </Left>
      )
    case 'kicker':
      return (
        <Left>
          <Eyebrow at={4} text="Molt Academy" color={C.inkMuted} />
          <MaskLine at={cueAt(beat, spec.text.split(' ')[0], 0.15)} size={110}>
            <div style={{ fontFamily: FONT.title, fontSize: 110, fontWeight: 500, color: C.ink, letterSpacing: '-0.03em', textShadow: '0 8px 50px rgba(0,0,0,0.5)' }}>{spec.text}</div>
          </MaskLine>
        </Left>
      )
    case 'statement':
      return (
        <Left>
          <div style={{ maxWidth: 1100 }}>
            <SpokenWords text={spec.text} size={118} />
          </div>
        </Left>
      )
    case 'chapter-move': {
      const at = cueAt(beat, spec.text.split(' ')[0], 0.12)
      const p = interpolate(frame, [at - 10, at + 30], [0, 1], { ...clamp, easing: out })
      return (
        <Left>
          <div style={{ position: 'relative', height: 420 }}>
            <div
              style={{
                position: 'absolute',
                left: -20,
                top: -60,
                fontFamily: FONT.title,
                fontSize: 520,
                fontWeight: 500,
                lineHeight: 1,
                color: 'transparent',
                WebkitTextStroke: `2px rgba(0, 195, 255, ${0.55 * p})`,
                scale: String(0.9 + 0.1 * p),
                transformOrigin: 'left center',
              }}
            >
              {spec.number}
            </div>
            <div style={{ position: 'absolute', left: 300, top: 120 }}>
              <MaskLine at={at} size={140}>
                <div style={{ fontFamily: FONT.title, fontSize: 140, fontWeight: 500, color: C.ink, letterSpacing: '-0.03em' }}>{spec.text}</div>
              </MaskLine>
              {spec.sub ? (
                <MaskLine at={at + 10} size={44}>
                  <div style={{ fontFamily: FONT.text, fontSize: 44, color: C.inkBody }}>{spec.sub}</div>
                </MaskLine>
              ) : null}
            </div>
          </div>
        </Left>
      )
    }
    case 'list':
      return (
        <Left>
          {spec.items.map((item, i) => {
            // Each item lands on its own word if the line says it; otherwise they cascade from the first.
            const own = beat.words.some((w) => w.text.toLowerCase().startsWith(item.split(' ')[0].toLowerCase()))
            const at = own ? cueAt(beat, item.split(' ')[0], 0.3) : Math.round(beat.duration * 0.2) + i * 9
            const p = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: out })
            return (
              <div key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 28 }}>
                <div style={{ fontFamily: FONT.text, fontSize: 30, color: C.cyan, opacity: p, width: 50 }}>{String(i + 1).padStart(2, '0')}</div>
                <MaskLine at={at} size={96}>
                  <div style={{ fontFamily: FONT.title, fontSize: 96, fontWeight: 500, color: C.ink, letterSpacing: '-0.03em' }}>{item}</div>
                </MaskLine>
              </div>
            )
          })}
        </Left>
      )
    case 'split': {
      const wipe = interpolate(frame, [6, 40], [0, 1], { ...clamp, easing: out })
      const rightAt = cueAt(beat, spec.right.split(' ')[0], 0.5)
      return (
        <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '0 90px 0 140px' }}>
            <MaskLine at={8} size={82}>
              <div style={{ fontFamily: FONT.title, fontSize: 82, fontWeight: 500, color: C.inkMuted, textShadow: '0 4px 30px rgba(0,0,0,0.85)', textDecoration: frame > rightAt + 10 ? 'line-through' : undefined, textDecorationColor: C.crimson }}>{spec.left}</div>
            </MaskLine>
          </div>
          <div style={{ width: 2, height: 420 * wipe, background: `linear-gradient(${C.crimson}, ${C.cyan})` }} />
          <div style={{ flex: 1, padding: '0 140px 0 90px' }}>
            <MaskLine at={rightAt} size={82}>
              <div style={{ fontFamily: FONT.title, fontSize: 82, fontWeight: 500, color: C.ink, textShadow: '0 4px 30px rgba(0,0,0,0.85)' }}>{spec.right}</div>
            </MaskLine>
          </div>
        </AbsoluteFill>
      )
    }
    case 'quote':
      return (
        <Left>
          <div style={{ fontFamily: FONT.title, fontSize: 200, color: C.cyan, lineHeight: 0.6, opacity: interpolate(frame, [0, 16], [0, 1], clamp) }}>“</div>
          <div style={{ maxWidth: 1150 }}>
            <SpokenWords text={spec.text} size={92} />
          </div>
        </Left>
      )
    case 'meter': {
      const p = interpolate(frame, [10, Math.max(20, beat.duration - 20)], [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.3, 1) })
      const value = Math.round(spec.from + (spec.to - spec.from) * p)
      const r = 230
      const arc = Math.PI * r
      return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <svg width={620} height={360} viewBox="-310 -300 620 360">
            <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke="rgba(150,170,170,0.25)" strokeWidth={26} strokeLinecap="round" />
            <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke={p > 0.7 ? C.crimson : C.amber} strokeWidth={26} strokeLinecap="round" strokeDasharray={arc} strokeDashoffset={arc * (1 - p)} />
          </svg>
          <div style={{ marginTop: -170, fontFamily: FONT.title, fontSize: 170, fontWeight: 500, color: C.ink }}>{value}%</div>
          <div style={{ fontFamily: FONT.text, fontSize: 40, color: C.inkBody }}>{spec.label}</div>
        </AbsoluteFill>
      )
    }
    case 'timer': {
      const p = interpolate(frame, [12, beat.duration - 10], [0, 1], clamp)
      const left = Math.max(0, spec.minutes * 60 * (1 - p))
      const r = 200
      const circ = 2 * Math.PI * r
      return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-end', paddingRight: 220 }}>
          <div style={{ position: 'relative', width: 480, height: 480 }}>
            <svg width={480} height={480} viewBox="-240 -240 480 480" style={{ position: 'absolute' }}>
              <circle r={r} fill="rgba(3,7,8,0.35)" stroke="rgba(150,170,170,0.2)" strokeWidth={10} />
              <circle r={r} fill="none" stroke={C.cyan} strokeWidth={10} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * p} transform="rotate(-90)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: FONT.title, fontSize: 120, fontWeight: 500, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                {Math.floor(left / 60)}:{String(Math.floor(left % 60)).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: FONT.text, fontSize: 32, color: C.inkBody }}>one task</div>
            </div>
          </div>
        </AbsoluteFill>
      )
    }
    case 'depth-readings': {
      const line = interpolate(frame, [0, beat.duration * 0.8], [0, 1], { ...clamp, easing: out })
      return (
        <AbsoluteFill>
          {/* The depth gauge: a line descending past each reading, with ticks. */}
          <div style={{ position: 'absolute', left: 160, top: 150, width: 2, height: 860 * line, background: `linear-gradient(${C.cyan}, ${C.crimson})`, boxShadow: `0 0 18px ${C.cyan}` }} />
          {Array.from({ length: 22 }, (_, k) => (
            <div key={k} style={{ position: 'absolute', left: k % 5 === 0 ? 146 : 152, top: 150 + k * 40, width: k % 5 === 0 ? 30 : 18, height: 1, background: 'rgba(150,170,170,0.35)', opacity: line * 860 > k * 40 ? 1 : 0 }} />
          ))}
          {spec.items.map((item, i) => {
            const at = cueAt(beat, item.split(' ')[0].replace('-', ''), 0.2 + i * 0.15)
            const p = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: out })
            const dim = spec.focus && !spec.focus.includes(i) ? 0.35 : 1
            const y = 170 + i * 215
            return (
              <div key={item} style={{ position: 'absolute', left: 150, top: y, display: 'flex', alignItems: 'center', gap: 34, opacity: p * dim }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, marginLeft: -10, background: C.abyss, border: `3px solid ${i === 3 ? C.crimson : C.cyan}`, boxShadow: `0 0 24px ${i === 3 ? C.crimson : C.cyan}` }} />
                <div style={{ width: 90 * p, height: 2, background: i === 3 ? C.crimson : C.cyan }} />
                <div>
                  <div style={{ fontFamily: FONT.text, fontSize: 26, color: C.inkMuted, letterSpacing: '0.1em' }}>{`Reading ${i + 1}`}</div>
                  <div style={{ fontFamily: FONT.title, fontSize: 76, fontWeight: 500, color: C.ink, letterSpacing: '-0.02em' }}>{item}</div>
                </div>
              </div>
            )
          })}
        </AbsoluteFill>
      )
    }
  }
}
