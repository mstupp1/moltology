import React, { useEffect, useRef } from 'react'
import type { HeroParticlesHandle } from './engine'

export interface HeroParticleFieldProps {
  /** Box the shell is drawn into. */
  anchorRef: React.RefObject<HTMLElement | null>
  /** Element that reports the pointer for parallax. */
  hostRef?: React.RefObject<HTMLElement | null>
  className?: string
}

/**
 * Canvas for the homepage hero particles. Nothing runs on the server: the engine is a separate
 * chunk loaded after hydration, and the canvas fades in once its first frame is drawn, so the
 * headline and copy paint first and never wait on it.
 */
export const HeroParticleField: React.FC<HeroParticleFieldProps> = ({ anchorRef, hostRef, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const anchor = anchorRef.current
    if (!canvas || !anchor || typeof canvas.getContext !== 'function') return
    let handle: HeroParticlesHandle | null = null
    let cancelled = false
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    import('./engine')
      .then(({ startHeroParticles }) => {
        if (cancelled) return
        handle = startHeroParticles({
          canvas,
          anchor,
          host: hostRef?.current,
          reducedMotion,
          onReady: () => canvas.setAttribute('data-ready', 'true'),
        })
      })
      .catch(() => {
        // Decorative only: without the engine the hero keeps its static glow.
      })

    return () => {
      cancelled = true
      handle?.destroy()
    }
  }, [anchorRef, hostRef])

  return <canvas ref={canvasRef} className={`home-hero-particles ${className}`} aria-hidden="true" data-testid="hero-particles" />
}
