import React, { useEffect, useRef } from 'react'
import type { HeroParticlesHandle } from './engine'
import type { HeroWaterHandle } from './water'

export interface HeroParticleFieldProps {
  /** Box the shell is drawn into. */
  anchorRef: React.RefObject<HTMLElement | null>
  /** Element that reports the pointer for parallax; also the box the water canvas is placed in. */
  hostRef?: React.RefObject<HTMLElement | null>
  /** Canvas for the WebGL water below the horizon. Without it (or WebGL) the CSS sea stays. */
  waterRef?: React.RefObject<HTMLCanvasElement | null>
  className?: string
}

/**
 * Canvas for the homepage hero particles. Nothing runs on the server: the engine is a separate
 * chunk loaded once the page has loaded and gone idle, and the canvas fades in after its first
 * frame, so the headline and copy paint first and never wait on it.
 */
export const HeroParticleField: React.FC<HeroParticleFieldProps> = ({ anchorRef, hostRef, waterRef, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const anchor = anchorRef.current
    if (!canvas || !anchor || typeof canvas.getContext !== 'function') return
    let handle: HeroParticlesHandle | null = null
    let water: HeroWaterHandle | null = null
    let cancelled = false
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    // Data saver gets the still frame; low-end devices get a lighter field.
    const reducedMotion =
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) || nav.connection?.saveData === true
    const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
    // The CSS ripples and glints wait for this, so first paint matches the WebGL water and they
    // only fade in when that water isn't coming.
    const showCssSea = () => {
      const host = hostRef?.current
      if (host && host.getAttribute('data-water') !== 'webgl') host.setAttribute('data-water', 'css')
    }
    if (reducedMotion) showCssSea()
    // Nothing after a few seconds (slow network, background tab): give the CSS sea its detail.
    const fallbackId = setTimeout(showCssSea, 4000)

    const boot = () => {
      if (cancelled) return
      const waterCanvas = waterRef?.current
      const host = hostRef?.current
      const sea = anchor.querySelector<HTMLElement>('.home-hero-sea')
      // The water mirrors the moving field, so a still frame keeps the CSS sea instead.
      const wantWater = !reducedMotion && waterCanvas && host && sea
      Promise.all([import('./engine'), wantWater ? import('./water').catch(() => null) : null])
        .then(([{ startHeroParticles }, waterModule]) => {
          if (cancelled) return
          handle = startHeroParticles({
            canvas,
            anchor,
            host,
            reducedMotion,
            budget: lowEnd ? 0.6 : 1,
            onReady: () => canvas.setAttribute('data-ready', 'true'),
            onFrame: (time, flash) => water?.render(time, flash),
            // A device that can't hold the frame rate gets the CSS sea back.
            onSlow: () => {
              water?.destroy()
              water = null
              showCssSea()
            },
          })
          if (waterModule && waterCanvas && host && sea) {
            water = waterModule.startHeroWater({
              canvas: waterCanvas,
              source: canvas,
              sea,
              host,
              anchor,
              moon: host.querySelector<HTMLElement>('.home-hero-moon'),
            })
          }
          if (!water) showCssSea()
        })
        .catch(() => {
          // Decorative only: without the engine the hero keeps its static glow and CSS sea.
          showCssSea()
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
      clearTimeout(fallbackId)
      window.removeEventListener('load', schedule)
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      handle?.destroy()
      water?.destroy()
    }
  }, [anchorRef, hostRef, waterRef])

  return <canvas ref={canvasRef} className={`home-hero-particles ${className}`} aria-hidden="true" data-testid="hero-particles" />
}
