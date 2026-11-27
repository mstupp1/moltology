/**
 * Explainer diagrams. Each piece lands on the word that names it (cueAt), so a script edit
 * re-times the picture with the voice.
 */
import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { MELT_VS_MOLT, MOLTMAXXING_MOVES } from '@/lib/moltmaxxing-content'
import { C, FONT, TYPE } from '../theme'
import { cueAt, useBeat } from '../timeline'
import { Appear, DeepWater, Eyebrow } from '../ui/primitives'

/** A plain crab outline: body, two claws, legs. */
export const CrabGlyph: React.FC<{ size: number; color: string; glow?: number }> = ({ size, color, glow = 0 }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 200 140" style={{ filter: glow ? `drop-shadow(0 0 ${18 * glow}px ${color})` : undefined }}>
    <g fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx={100} cy={82} rx={52} ry={34} fill={color} fillOpacity={0.18} />
      <path d="M58 70 C40 50 30 34 34 18 M34 18 l-10 -6 M34 18 l10 -8" />
      <path d="M142 70 C160 50 170 34 166 18 M166 18 l10 -6 M166 18 l-10 -8" />
      <path d="M56 92 l-30 12 M58 104 l-26 22 M144 92 l30 12 M142 104 l26 22" />
      <path d="M88 52 l-4 -14 M112 52 l4 -14" />
    </g>
  </svg>
)

/** Three separate branches of the family tree, each ending in the same crab shape. */
export const FamilyTree: React.FC<{ branches: string[] }> = ({ branches }) => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  const W = 1920
  const rootX = W / 2
  const rootY = 940
  const shapeAt = cueAt(beat, 'same', 0.7)
  return (
    <AbsoluteFill>
      <DeepWater />
      <svg width={W} height={1080} style={{ position: 'absolute' }}>
        {branches.map((name, i) => {
          const x = 420 + i * 540
          const start = cueAt(beat, name.split(' ')[0], 0.1 + i * 0.15)
          const p = interpolate(frame, [start, start + 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const d = `M${rootX} ${rootY} C ${rootX} ${rootY - 200}, ${x} ${rootY - 240}, ${x} 520`
          return <path key={name} d={d} fill="none" stroke={C.line} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        })}
      </svg>
      {branches.map((name, i) => {
        const x = 420 + i * 540
        const start = cueAt(beat, name.split(' ')[0], 0.1 + i * 0.15) + 20
        const lit = interpolate(frame, [shapeAt + i * 6, shapeAt + i * 6 + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <Appear key={name} start={start} style={{ position: 'absolute', left: x - 220, top: 170, width: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <CrabGlyph size={280} color={lit > 0.5 ? C.shell : C.inkMuted} glow={lit} />
            <div style={{ fontFamily: FONT.text, fontSize: TYPE.label, color: C.ink }}>{name}</div>
          </Appear>
        )
      })}
      <Appear start={shapeAt + 24} style={{ position: 'absolute', bottom: 70, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.text, fontSize: TYPE.body, color: C.inkBody }}>Different ancestors, the same shape</div>
      </Appear>
    </AbsoluteFill>
  )
}

/** The molt as a loop: each step lights as it is described. */
export const MoltCycle: React.FC<{ steps: string[]; cues?: string[] }> = ({ steps, cues = ['', 'water', 'hardens', 'bigger'] }) => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  const cx = 960
  const cy = 540
  const r = 300
  return (
    <AbsoluteFill>
      <DeepWater />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.lineSubtle} strokeWidth={4} />
      </svg>
      {steps.map((step, i) => {
        const at = cues[i] ? cueAt(beat, cues[i], i / steps.length) : 0
        const angle = -Math.PI / 2 + (i / steps.length) * Math.PI * 2
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        const lit = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <div
            key={step}
            style={{
              position: 'absolute',
              left: x - 130,
              top: y - 56,
              width: 260,
              height: 112,
              borderRadius: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT.title,
              fontSize: TYPE.label,
              fontWeight: 500,
              color: lit > 0.5 ? C.abyss : C.inkMuted,
              background: lit > 0.5 ? C.cyan : C.surface2,
              border: `2px solid ${lit > 0.5 ? C.cyan : C.line}`,
              scale: String(1 + 0.08 * Math.sin(Math.min(1, lit) * Math.PI)),
            }}
          >
            {step}
          </div>
        )
      })}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Appear start={4}>
          <Eyebrow color={C.inkMuted}>How a crab grows</Eyebrow>
        </Appear>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** The four moves of the practice, one card per move, landing on its verb. */
export const FourMoves: React.FC = () => {
  const beat = useBeat()
  const cues = ['Shed', 'Harden', 'Grip', 'deep']
  return (
    <AbsoluteFill>
      <DeepWater />
      <AbsoluteFill style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 36, padding: '0 120px' }}>
        {MOLTMAXXING_MOVES.map((move, i) => (
          <Appear key={move.id} start={cueAt(beat, cues[i], 0.2 + i * 0.18)} rise={40}>
            <div style={{ width: 380, height: 420, borderRadius: 28, background: C.surface1, border: `1px solid ${C.line}`, padding: 44, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: FONT.text, fontSize: TYPE.eyebrow, color: C.cyan }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontFamily: FONT.title, fontSize: TYPE.heading, fontWeight: 500, color: C.ink }}>{move.verb}</div>
              <div style={{ fontFamily: FONT.text, fontSize: TYPE.body, color: C.inkBody, lineHeight: 1.3 }}>{move.plain}</div>
            </div>
          </Appear>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Three panels, each landing on its keyword, plus an optional pill at the end. */
export const ThreePanels: React.FC<{ panels: string[]; cues?: string[]; pill?: string; pillCue?: string }> = ({
  panels,
  cues = ['web', 'practice', 'community'],
  pill = 'Free to join',
  pillCue = 'free',
}) => {
  const beat = useBeat()
  return (
    <AbsoluteFill>
      <DeepWater />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 64 }}>
        <div style={{ display: 'flex', gap: 40 }}>
          {panels.map((panel, i) => (
            <Appear key={panel} start={cueAt(beat, cues[i] ?? panel, 0.2 + i * 0.15)} rise={40}>
              <div style={{ width: 460, height: 300, borderRadius: 28, background: C.surface1, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: FONT.title, fontSize: 60, fontWeight: 500, color: C.ink }}>{panel}</div>
              </div>
            </Appear>
          ))}
        </div>
        <Appear start={cueAt(beat, pillCue, 0.85)}>
          <div style={{ fontFamily: FONT.text, fontSize: TYPE.label, color: C.abyss, background: C.cyan, borderRadius: 40, padding: '14px 36px' }}>{pill}</div>
        </Appear>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

const STAGES = [
  { name: 'Larval', note: 'Noise audit, first routine, first shed', cue: 'Larval' },
  { name: 'Soft-Shed', note: 'Shedding the audience, first grip', cue: 'Soft' },
  { name: 'Exoshell Born', note: 'Armor under load, mentorship', cue: 'Exoshell' },
  { name: 'Full Carcinization', note: 'Flow, a sealed boundary, stewardship', cue: 'Full' },
]

/** The four stages as a descent from the surface into the deep. */
export const StageLadder: React.FC = () => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  const top = 170
  const step = 200
  const last = cueAt(beat, 'Full', 0.6)
  const depth = interpolate(frame, [cueAt(beat, 'Larval', 0.2), last + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <DeepWater glow={1.2 - depth * 0.6} />
      <div style={{ position: 'absolute', left: 520, top: top + 30, width: 4, height: step * 3 * depth, background: `linear-gradient(${C.cyan}, ${C.crimson})` }} />
      {STAGES.map((stage, i) => {
        const at = cueAt(beat, stage.cue, 0.2 + i * 0.12)
        return (
          <Appear key={stage.name} start={at} rise={0} style={{ position: 'absolute', left: 500, top: top + i * step, display: 'flex', alignItems: 'center', gap: 48 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: C.abyss, border: `4px solid ${i === 3 ? C.crimson : C.cyan}` }} />
            <div>
              <div style={{ fontFamily: FONT.text, fontSize: TYPE.eyebrow, color: C.inkMuted }}>Stage {i + 1}</div>
              <div style={{ fontFamily: FONT.title, fontSize: 64, fontWeight: 500, color: C.ink }}>{stage.name}</div>
              <div style={{ fontFamily: FONT.text, fontSize: TYPE.caption, color: C.inkBody }}>{stage.note}</div>
            </div>
          </Appear>
        )
      })}
      <Appear start={cueAt(beat, 'earned', 0.85)} style={{ position: 'absolute', right: 160, bottom: 120, width: 520 }}>
        <div style={{ fontFamily: FONT.text, fontSize: TYPE.body, color: C.inkBody, lineHeight: 1.35 }}>In order, none skipped. Earned by doing the work.</div>
      </Appear>
    </AbsoluteFill>
  )
}

/** The same day lived two ways, one row per pair, landing in turn across the beat. */
export const MeltVsMolt: React.FC = () => {
  const beat = useBeat()
  const start = cueAt(beat, 'same', 0.35)
  const gap = Math.max(10, Math.round((beat.duration - start) / 5))
  return (
    <AbsoluteFill>
      <DeepWater />
      <AbsoluteFill style={{ padding: '120px 160px', gap: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <Appear start={start - 10}>
            <Eyebrow color={C.crimson}>The melt</Eyebrow>
          </Appear>
          <Appear start={start - 10}>
            <Eyebrow>The molt</Eyebrow>
          </Appear>
        </div>
        {MELT_VS_MOLT.melt.map((melt, i) => (
          <div key={melt} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            <Appear start={start + i * gap}>
              <div style={{ fontFamily: FONT.text, fontSize: TYPE.label, color: C.inkMuted, padding: '28px 0', borderTop: `1px solid ${C.lineSubtle}` }}>{melt}</div>
            </Appear>
            <Appear start={start + i * gap + 8}>
              <div style={{ fontFamily: FONT.text, fontSize: TYPE.label, color: C.ink, padding: '28px 0', borderTop: `1px solid ${C.line}` }}>{MELT_VS_MOLT.molt[i]}</div>
            </Appear>
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** A Tuesday in numbers: the tab count climbs, pings stack up, four bars stall. */
export const MeltDay: React.FC<{ tabs?: number; started?: number }> = ({ tabs = 47, started = 4 }) => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  const tabsAt = cueAt(beat, 'Forty', 0.05)
  const pingAt = cueAt(beat, 'ping', 0.25)
  const barsAt = cueAt(beat, 'Four', 0.45)
  const tiredAt = cueAt(beat, 'tired', 0.75)
  const count = Math.round(interpolate(frame, [tabsAt, tabsAt + 30], [1, tabs], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const dim = interpolate(frame, [tiredAt, tiredAt + 30], [0, 0.45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <DeepWater />
      <div style={{ position: 'absolute', left: 160, right: 160, top: 150, display: 'flex', gap: 4 }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 44, borderRadius: '8px 8px 0 0', background: i === count - 1 ? C.surface3 : C.surface2, border: `1px solid ${C.lineSubtle}` }} />
        ))}
      </div>
      <Appear start={tabsAt} style={{ position: 'absolute', left: 160, top: 220 }}>
        <div style={{ fontFamily: FONT.title, fontSize: TYPE.display, fontWeight: 500, color: C.ink }}>
          {count} <span style={{ fontSize: TYPE.heading, color: C.inkBody }}>tabs</span>
        </div>
      </Appear>
      {Array.from({ length: 6 }, (_, i) => (
        <Appear key={i} start={pingAt + i * 5} rise={14} style={{ position: 'absolute', right: 160 + (i % 2) * 40, top: 240 + i * 74 }}>
          <div style={{ fontFamily: FONT.text, fontSize: TYPE.caption, color: C.ink, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 24px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: C.crimson }} />
            {['Quick question', 'Are you free at 3?', 'Re: re: re: notes', 'New comment', 'Reminder', 'Did you see this?'][i]}
          </div>
        </Appear>
      ))}
      <div style={{ position: 'absolute', left: 160, top: 500, width: 900, display: 'flex', flexDirection: 'column', gap: 34 }}>
        {Array.from({ length: started }, (_, i) => {
          const stop = [0.62, 0.35, 0.5, 0.18][i % 4]
          const w = interpolate(frame, [barsAt + i * 6, barsAt + i * 6 + 28], [0, stop], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <div key={i} style={{ height: 26, borderRadius: 13, background: C.surface2 }}>
              <div style={{ width: `${w * 100}%`, height: '100%', borderRadius: 13, background: C.amber }} />
            </div>
          )
        })}
        <Appear start={barsAt + 30}>
          <div style={{ fontFamily: FONT.text, fontSize: TYPE.body, color: C.inkBody }}>Four started. None finished.</div>
        </Appear>
      </div>
      <AbsoluteFill style={{ background: C.abyss, opacity: dim }} />
    </AbsoluteFill>
  )
}

/** Attention with no shell: each ping is a ripple that dents a soft shape. */
export const PingWaves: React.FC = () => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  const meltAt = cueAt(beat, 'Melt', 0.3)
  const waves = Array.from({ length: 7 }, (_, i) => 8 + i * Math.max(10, Math.round(beat.duration / 8)))
  const dent = waves.reduce((sum, at) => sum + Math.max(0, 1 - Math.abs(frame - at - 18) / 12) * 0.08, 0)
  const sag = interpolate(frame, [0, beat.duration], [0, 0.18], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <DeepWater />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        {waves.map((at, i) => {
          const t = frame - at
          if (t < 0 || t > 40) return null
          const r = 40 + t * 14
          return <circle key={i} cx={i % 2 ? 1500 : 420} cy={260 + (i % 3) * 180} r={r} fill="none" stroke={C.cyan} strokeOpacity={0.6 * (1 - t / 40)} strokeWidth={4} />
        })}
        <ellipse cx={960} cy={600 + sag * 120} rx={220 * (1 + sag * 0.6 + dent)} ry={220 * (1 - sag - dent)} fill="#f2a6a0" fillOpacity={0.28} stroke="#f2a6a0" strokeWidth={4} />
      </svg>
      <Appear start={meltAt} style={{ position: 'absolute', bottom: 120, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.title, fontSize: TYPE.heading, fontWeight: 500, color: C.ink }}>The Great Melt</div>
      </Appear>
    </AbsoluteFill>
  )
}
