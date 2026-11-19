import React from 'react'
import { EMBLEM_TURNTABLE } from '@/lib/emblem-light'

export interface GlowEmblemProps {
  /** Emblem size in CSS pixels. The glow spreads past it, so leave room around it. */
  size: number
  /** Accessible label. Leave it out when a heading next to it already names the page. */
  label?: string
  /** A slow, faint swell of the glow (page loader). Still when the visitor prefers less motion. */
  breathe?: boolean
  className?: string
  /** Extra classes for the mark itself, under the glow (the loader's light pass). */
  markClassName?: string
  children?: React.ReactNode
}

/**
 * The emblem in its own light: the crimson mark with a soft red halo behind it, as on the site's
 * link-preview card. Use it for a page's one hero mark (loader, not-found, sign-in, certificates),
 * never in lists or rows.
 *
 * The mark is the 3D emblem, baked: a strip of pre-rendered frames of it rocking slowly
 * (`npm run emblem:bake`), stepped through with a CSS transform, so it costs no WebGL. Visitors
 * who prefer less motion see the first frame, still.
 */
export function GlowEmblem({ size, label, breathe = false, className = '', markClassName = '', children }: GlowEmblemProps) {
  return (
    <span
      className={`glow-emblem relative inline-flex shrink-0 items-center justify-center ${breathe ? 'glow-emblem-breathe' : ''} ${className}`}
      style={{ width: size, height: size, ['--glow-emblem-size' as string]: `${size}px` }}
    >
      <span aria-hidden="true" className="glow-emblem-halo pointer-events-none absolute rounded-full" />
      {/* The glow sits on a wrapper so a mask on the mark (the loader's light pass) cannot clip it. */}
      <span className="glow-emblem-mark relative block h-full w-full">
        <span
          role={label ? 'img' : undefined}
          aria-label={label}
          aria-hidden={label ? undefined : true}
          className={`emblem-turntable ${markClassName}`}
        >
          <img
            src={EMBLEM_TURNTABLE.src}
            alt=""
            draggable={false}
            decoding="async"
            className="emblem-turntable-strip"
            style={{ width: `${EMBLEM_TURNTABLE.frames * 100}%` }}
          />
        </span>
      </span>
      {children}
    </span>
  )
}
