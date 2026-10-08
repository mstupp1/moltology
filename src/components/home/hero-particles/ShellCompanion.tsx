import React, { useEffect, useRef } from 'react'

/**
 * A small shell docked in the corner below the hero that grows a plate for each homepage section
 * you pass. Decorative and pointer-transparent; the code loads after the page is idle.
 */
export const ShellCompanion: React.FC = () => {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    const canvas = canvasRef.current
    if (!frame || !canvas || typeof canvas.getContext !== 'function' || typeof IntersectionObserver !== 'function') return
    let cancelled = false
    let handle: { destroy: () => void } | null = null
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const boot = () => {
      // Hidden below desktop widths, where the floating field manual pill and content need the edges.
      if (cancelled || getComputedStyle(frame).display === 'none') return
      import('./companion')
        .then(({ startShellCompanion }) => {
          if (cancelled) return
          const sections = Array.from(document.querySelectorAll('main section[aria-labelledby]')).filter(
            (el) => (el as HTMLElement).offsetParent !== null,
          )
          handle = startShellCompanion({
            canvas,
            frame,
            hero: document.querySelector('section[aria-labelledby="home-hero-title"]'),
            sections,
            footer: document.querySelector('footer'),
            reducedMotion,
          })
        })
        .catch(() => {})
    }
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300))
    if (document.readyState === 'complete') idle(boot)
    else window.addEventListener('load', () => idle(boot), { once: true })

    return () => {
      cancelled = true
      handle?.destroy()
    }
  }, [])

  return (
    <div
      ref={frameRef}
      data-visible="false"
      className="home-shell-companion fixed bottom-5 left-5 z-30 hidden lg:block pointer-events-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-[132px] w-[132px]" />
    </div>
  )
}
