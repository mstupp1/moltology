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
 * chunk loaded once the page has loaded and gone idle, and the canvas fades in after its first
 * frame, so the headline and copy paint first and never wait on it.
 */
export const HeroParticleField: React.FC<HeroParticleFieldProps> = ({ anchorRef, hostRef, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const anchor = anchorRef.current
    if (!canvas || !anchor || typeof canvas.getContext !== 'function') return
    let handle: HeroParticlesHandle | null = null
    let cancelled = false
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    // Data saver gets the still frame; low-end devices get a lighter field.
    const reducedMotion =
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) || nav.connection?.saveData === true
    const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4

    const boot = () => {
      if (cancelled) return
      import('./engine')
        .then(({ startHeroParticles }) => {
          if (cancelled) return
          handle = startHeroParticles({
            canvas,
            anchor,
            host: hostRef?.current,
            reducedMotion,
            budget: lowEnd ? 0.6 : 1,
            onReady: () => canvas.setAttribute('data-ready', 'true'),
          })
        })
        .catch(() => {
          // Decorative only: without the engine the hero keeps its static glow.
        })
    }
    // Wait for the page to finish loading and go idle, so the field never competes with first
    // paint or hydration.
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(boot, { timeout: 1200 })
      else timeoutId = setTimeout(boot, 200)
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('load', schedule)
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      handle?.destroy()
    }
  }, [anchorRef, hostRef])

  return <canvas ref={canvasRef} className={`home-hero-particles ${className}`} aria-hidden="true" data-testid="hero-particles" />
}
