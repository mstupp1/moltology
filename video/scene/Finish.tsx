/**
 * The finishing pass every scene gets, as a compositor would add it last: a soft light leak that
 * breathes, volumetric shafts, a vignette and moving film grain. Seeded by the frame, so it is
 * the same on every render.
 */
import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export const Finish: React.FC<{ light?: string; grain?: number }> = ({ light = 'rgba(120, 220, 255, 0.22)', grain = 0.07 }) => {
  const frame = useCurrentFrame()
  const breathe = 0.75 + 0.25 * Math.sin(frame / 40)
  const shaft = interpolate(Math.sin(frame / 55), [-1, 1], [-30, 30])
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Light leak from the top right. */}
      <AbsoluteFill style={{ background: `radial-gradient(60% 55% at 82% 8%, ${light}, transparent 70%)`, mixBlendMode: 'screen', opacity: breathe }} />
      {/* Volumetric shafts. */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(${105 + shaft * 0.05}deg, rgba(180,240,255,0.0) 0px, rgba(180,240,255,0.05) 60px, rgba(180,240,255,0.0) 140px)`,
          mixBlendMode: 'screen',
          maskImage: 'linear-gradient(180deg, black 0%, transparent 65%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 65%)',
          translate: `${shaft}px 0`,
        }}
      />
      {/* Vignette. */}
      <AbsoluteFill style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
      {/* Grain: SVG noise with a new seed every two frames. */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: grain, mixBlendMode: 'overlay' }}>
        <filter id={`grain-${Math.floor(frame / 2)}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(frame / 2) % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${Math.floor(frame / 2)})`} />
      </svg>
    </AbsoluteFill>
  )
}
