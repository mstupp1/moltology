/**
 * Title, chapter, word and end cards: the type-led beats.
 */
import React from 'react'
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import geometry from '@/components/ui/brand-geometry.json'
import { C, FONT, TYPE } from '../theme'
import { cueAt, useBeat } from '../timeline'
import { Appear, DeepWater, Eyebrow, useProgress } from '../ui/primitives'

export const Emblem: React.FC<{ size: number; color?: string }> = ({ size, color = C.crimson }) => {
  const art = geometry.parts.icon
  return (
    <svg width={size} height={size} viewBox={art.viewBox}>
      <g transform={art.transform} fill={color}>
        <path fillRule="evenodd" d={art.d} />
      </g>
    </svg>
  )
}

/** Slow push-in on a painted plate, darkened so type reads over it. */
export const Plate: React.FC<{ src: string; dim?: number; zoom?: number }> = ({ src, dim = 0.45, zoom = 0.06 }) => {
  const frame = useCurrentFrame()
  const { duration } = useBeat()
  const scale = interpolate(frame, [0, Math.max(1, duration)], [1, 1 + zoom], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(scale) }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(3,7,8,${dim * 0.6}) 0%, rgba(3,7,8,${dim}) 100%)` }} />
    </AbsoluteFill>
  )
}

export const TitleCard: React.FC<{ title: string; eyebrow?: string; plate?: string }> = ({ title, eyebrow = 'Molt Academy', plate }) => (
  <AbsoluteFill>
    {plate ? <Plate src={plate} dim={0.55} /> : <DeepWater />}
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 28 }}>
      <Appear start={4}>
        <Emblem size={96} />
      </Appear>
      <Appear start={10}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Appear>
      <Appear start={16} rise={36} length={24}>
        <div style={{ fontFamily: FONT.title, fontSize: TYPE.display, fontWeight: 500, color: C.ink, letterSpacing: '-0.02em' }}>{title}</div>
      </Appear>
    </AbsoluteFill>
  </AbsoluteFill>
)

export const ChapterCard: React.FC<{ number: number; title: string }> = ({ number, title }) => {
  const line = useProgress(6, 24)
  return (
    <AbsoluteFill>
      <DeepWater glow={0.7} />
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 200, gap: 24 }}>
        <Appear start={0}>
          <Eyebrow>Chapter {number}</Eyebrow>
        </Appear>
        <div style={{ width: 320 * line, height: 2, background: C.cyan }} />
        <Appear start={8} rise={30}>
          <div style={{ fontFamily: FONT.title, fontSize: TYPE.heading, fontWeight: 500, color: C.ink }}>{title}</div>
        </Appear>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** One word, typed on letter by letter as it is said, with a plain gloss underneath. */
export const WordReveal: React.FC<{ word: string; gloss?: string }> = ({ word, gloss }) => {
  const frame = useCurrentFrame()
  const beat = useBeat()
  const start = cueAt(beat, word, 0.45)
  const shown = Math.max(0, Math.min(word.length, Math.floor((frame - start) / 2)))
  return (
    <AbsoluteFill>
      <DeepWater />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 32 }}>
        <div style={{ fontFamily: FONT.title, fontSize: 150, fontWeight: 500, color: C.ink, letterSpacing: '-0.02em', minHeight: 190 }}>
          {word.slice(0, shown)}
          <span style={{ color: C.cyan, opacity: shown < word.length && frame % 20 < 12 ? 1 : 0 }}>|</span>
        </div>
        {gloss ? (
          <Appear start={start + word.length * 2 + 6}>
            <div style={{ fontFamily: FONT.text, fontSize: TYPE.label, color: C.inkBody }}>{gloss}</div>
          </Appear>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export const EndCard: React.FC<{ url: string }> = ({ url }) => (
  <AbsoluteFill>
    <DeepWater />
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 36 }}>
      <Appear start={2}>
        <Emblem size={140} />
      </Appear>
      <Appear start={10} rise={30}>
        <div style={{ fontFamily: FONT.title, fontSize: TYPE.display, fontWeight: 500, color: C.ink }}>{url}</div>
      </Appear>
      <Appear start={20}>
        <div style={{ fontFamily: FONT.text, fontSize: TYPE.label, color: C.inkBody }}>Free to join</div>
      </Appear>
    </AbsoluteFill>
  </AbsoluteFill>
)
