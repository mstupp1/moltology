import React from 'react'

const CORE_FRAMES = ['/images/oracle-core-a.webp', '/images/oracle-core-b.webp'] as const

export interface OracleCoreGlyphProps {
  /** Diameter of the orb in pixels. */
  size: number
  /** Brighter halo, e.g. while on the Oracle page. */
  active?: boolean
  className?: string
}

/**
 * The synaptic core as a small, cheap button face: two cached stills of the
 * real 3D core, slowly turning and cross-fading inside a glass socket, with a
 * breathing halo. No WebGL; the live core only runs in Oracle's entity view.
 * Motion stops under prefers-reduced-motion (see hud-chrome.css).
 */
export function OracleCoreGlyph({ size, active = false, className = '' }: OracleCoreGlyphProps) {
  return (
    <span
      aria-hidden
      data-testid="oracle-core-glyph"
      data-active={active ? 'true' : undefined}
      className={`oracle-core ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="oracle-core__halo" />
      <span className="oracle-core__orb">
        <img src={CORE_FRAMES[0]} alt="" draggable={false} decoding="async" className="oracle-core__frame" />
        <img
          src={CORE_FRAMES[1]}
          alt=""
          draggable={false}
          decoding="async"
          loading="lazy"
          className="oracle-core__frame oracle-core__frame--b"
        />
        <span className="oracle-core__glass" />
      </span>
    </span>
  )
}
