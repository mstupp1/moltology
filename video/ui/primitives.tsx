/**
 * Shared pieces for the motion graphics: the deep-water ground, a fade-and-rise entrance keyed
 * to a frame, the small source credit, and the eyebrow label. Everything moves from
 * useCurrentFrame(), never CSS animation, so renders match the preview frame for frame.
 */
import React from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, FONT, TYPE } from '../theme'
import type { Source } from '../timeline'

const ease = Easing.bezier(0.16, 1, 0.3, 1)

/** 0 → 1 over `length` frames starting at `start`, eased out. */
export function useProgress(start: number, length = 18) {
  const frame = useCurrentFrame()
  return interpolate(frame, [start, start + length], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease })
}

/** Fades and rises its children in at `start`. */
export const Appear: React.FC<{ start: number; rise?: number; length?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  start,
  rise = 24,
  length = 18,
  style,
  children,
}) => {
  const p = useProgress(start, length)
  return <div style={{ opacity: p, translate: `0 ${(1 - p) * rise}px`, ...style }}>{children}</div>
}

/** The deep-water ground: abyss at the bottom, a teal glow from above and slow marine snow. */
export const DeepWater: React.FC<{ glow?: number; snow?: boolean }> = ({ glow = 1, snow = true }) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const flakes = snow ? 46 : 0
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% -10%, rgba(0, 120, 150, ${0.42 * glow}) 0%, ${C.deep} 38%, ${C.abyss} 100%)` }}>
      {Array.from({ length: flakes }, (_, i) => {
        const x = random(`x${i}`) * width
        const speed = 8 + random(`s${i}`) * 18
        const y = ((random(`y${i}`) * height + (frame / fps) * speed) % (height + 40)) - 20
        const size = 2 + random(`r${i}`) * 4
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.sin(frame / fps / 2 + i) * 12,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background: C.ink,
              opacity: 0.08 + random(`o${i}`) * 0.18,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.cyan }) => (
  <div style={{ fontFamily: FONT.text, fontSize: TYPE.eyebrow, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>{children}</div>
)

/** A small credit, bottom left, for a real-world claim. */
export const SourceTag: React.FC<{ source: Source; start?: number }> = ({ source, start = 10 }) => (
  <Appear start={start} rise={10} style={{ position: 'absolute', left: 96, bottom: 72 }}>
    <div
      style={{
        fontFamily: FONT.text,
        fontSize: TYPE.caption,
        color: C.inkBody,
        background: 'rgba(3, 7, 8, 0.72)',
        border: `1px solid ${C.lineSubtle}`,
        borderRadius: 12,
        padding: '12px 20px',
      }}
    >
      <span style={{ color: C.inkMuted }}>Source: </span>
      {source.label}
    </div>
  </Appear>
)
