import React from 'react'

/**
 * The glass edge and outer glow for a round avatar that wears {@link GlassLens}. Put it on the
 * round, overflow-hidden frame itself.
 */
export const GLASS_FRAME_CLASS =
  'border border-white/20 shadow-[0_1px_4px_rgba(0,0,0,0.6),0_0_8px_rgba(0,195,255,0.22)]'

export interface GlassLensProps {
  /** Darken the rim like a lens (default true). */
  vignette?: boolean
  /** Light falling across the top, with its highlight line (default true). */
  sheen?: boolean
}

// One layer of light: sheen from above, the lens rim, and a cyan glow from below.
const SHEEN = 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.26) 0%, rgba(0,195,255,0.14) 35%, transparent 70%)'
const VIGNETTE = 'radial-gradient(circle at 50% 40%, transparent 58%, rgba(2,8,14,0.32) 80%, rgba(1,4,7,0.7) 100%)'
const UNDERGLOW = 'radial-gradient(ellipse 70% 28% at 50% 100%, rgba(0,195,255,0.2) 0%, transparent 100%)'

/**
 * The profile portrait's glass, scaled for small avatars: the same light, rim and glow, drawn in
 * percentages so it holds from 20px up, and in two plain layers (no blend modes) so a page
 * full of avatars stays cheap. Place it last inside a round, overflow-hidden, positioned frame.
 */
export function GlassLens({ vignette = true, sheen = true }: GlassLensProps) {
  const light = [sheen && SHEEN, vignette && VIGNETTE, UNDERGLOW].filter(Boolean).join(', ')
  return (
    <span
      aria-hidden
      data-testid="glass-lens"
      className="pointer-events-none absolute inset-0 z-20 rounded-full shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22),inset_0_0_6px_rgba(0,195,255,0.24)]"
      style={{ background: light }}
    >
      {sheen && (
        <span className="absolute top-0 left-[22%] right-[22%] h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      )}
    </span>
  )
}

/** The glass edge and outer glow for a full-character card that wears {@link GlassCase}. */
export const GLASS_CASE_FRAME_CLASS =
  'border border-white/[0.22] shadow-[0_10px_30px_rgba(0,0,0,0.55),0_0_22px_rgba(0,195,255,0.18)]'

// The portrait's light, stretched to a card: sheen across the top, a lens vignette, and a cyan glow below.
const CASE_LIGHT = [
  'radial-gradient(ellipse 90% 45% at 50% 0%, rgba(255,255,255,0.16) 0%, rgba(0,195,255,0.08) 40%, transparent 75%)',
  'radial-gradient(ellipse 75% 70% at 50% 46%, transparent 55%, rgba(2,8,14,0.42) 82%, rgba(1,4,7,0.78) 100%)',
  'radial-gradient(ellipse 70% 22% at 50% 100%, rgba(0,195,255,0.22) 0%, transparent 100%)',
].join(', ')

/**
 * The portrait glass for a full-character card: top sheen and highlight line, lens vignette, cyan
 * underglow and a lit inner edge. One plain layer over the 3D canvas; it never takes the pointer,
 * so dragging to turn the character still works. Place it after the canvas in a positioned frame.
 */
export function GlassCase() {
  return (
    <span
      aria-hidden
      data-testid="glass-case"
      className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2),inset_0_0_14px_rgba(0,195,255,0.22)]"
      style={{ background: CASE_LIGHT }}
    >
      <span className="absolute top-0 left-[18%] right-[18%] h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      <span className="absolute bottom-0 left-[24%] right-[24%] h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
    </span>
  )
}
