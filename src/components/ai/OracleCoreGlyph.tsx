import React, { useEffect, useRef, useState } from 'react'

const CORE_FRAMES = ['/images/oracle-core-a.webp', '/images/oracle-core-b.webp'] as const

/** How long the orb takes to pour back in after the core view closes (see hud-chrome.css). */
const REFILL_MS = 850

export interface OracleCoreGlyphProps {
  /** Diameter of the orb in pixels. */
  size: number
  /** Brighter halo, e.g. while on the Oracle page. */
  active?: boolean
  /** Stronger, faster rings while the first-visit tip points at the core. */
  beacon?: boolean
  /**
   * Emptied into the chat's big core (phone bottom bar while core view is on): the
   * liquid drains from the top down and leaves a dark socket with a faint ember.
   * Turning it off pours it back.
   */
  drained?: boolean
  /** Faded while the Oracle it opens is already open (phone bottom bar). */
  dimmed?: boolean
  /** No idle rings, for small copies such as the chat header toggle. */
  quiet?: boolean
  className?: string
}

type DrainPhase = 'full' | 'drained' | 'refilling'

/**
 * The synaptic core as a small, cheap button face: two cached stills of the
 * real 3D core, slowly turning and cross-fading inside a glass socket, with a
 * breathing halo and one slow ring every few seconds so it reads as alive.
 * No WebGL; the live core only runs in Oracle's entity view. Motion stops under
 * prefers-reduced-motion, and the idle ring stops on low-power devices
 * (see hud-chrome.css).
 */
export function OracleCoreGlyph({
  size,
  active = false,
  beacon = false,
  drained = false,
  dimmed = false,
  quiet = false,
  className = '',
}: OracleCoreGlyphProps) {
  const [phase, setPhase] = useState<DrainPhase>(drained ? 'drained' : 'full')
  const wasDrained = useRef(drained)

  useEffect(() => {
    if (drained === wasDrained.current) return
    wasDrained.current = drained
    if (drained) {
      setPhase('drained')
      return
    }
    setPhase('refilling')
    const timer = window.setTimeout(() => setPhase('full'), REFILL_MS)
    return () => window.clearTimeout(timer)
  }, [drained])

  return (
    <span
      aria-hidden
      data-testid="oracle-core-glyph"
      data-active={active ? 'true' : undefined}
      data-beacon={beacon ? 'true' : undefined}
      data-drain={phase === 'full' ? undefined : phase}
      data-dimmed={dimmed && phase !== 'drained' ? 'true' : undefined}
      data-quiet={quiet ? 'true' : undefined}
      className={`oracle-core ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="oracle-core__halo" />
      <span className="oracle-core__ring" />
      <span className="oracle-core__ring oracle-core__ring--b" />
      <span className="oracle-core__orb">
        {/* Holds the turning stills so the drain's straight edge stays level while they rotate. */}
        <span className="oracle-core__liquid">
          <img src={CORE_FRAMES[0]} alt="" draggable={false} decoding="async" className="oracle-core__frame" />
          <img
            src={CORE_FRAMES[1]}
            alt=""
            draggable={false}
            decoding="async"
            loading="lazy"
            className="oracle-core__frame oracle-core__frame--b"
          />
        </span>
        <span className="oracle-core__level" />
        <span className="oracle-core__ember" />
        <span className="oracle-core__glass" />
      </span>
    </span>
  )
}
