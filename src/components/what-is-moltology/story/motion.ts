import React, { useEffect, useState } from 'react'

export type ScrollProgressMode = 'through' | 'pin'

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/**
 * Scroll progress of an element relative to the viewport.
 * - `through`: 0 when the element's top reaches the viewport bottom, 1 when its bottom leaves the top.
 * - `pin`: 0 when the element's top reaches `offset`, 1 when its bottom reaches the viewport bottom.
 *   Used for tall sections with a sticky child.
 */
export function computeScrollProgress(
  mode: ScrollProgressMode,
  top: number,
  height: number,
  viewportHeight: number,
  offset = 0,
): number {
  if (mode === 'through') {
    const travel = viewportHeight + height
    if (travel <= 0) return 0
    return clamp01((viewportHeight - top) / travel)
  }
  const travel = height - (viewportHeight - offset)
  if (travel <= 0) return top <= offset ? 1 : 0
  return clamp01((offset - top) / travel)
}

/** Index of the active step when `count` steps share a 0..1 progress range. */
export function activeStepForProgress(progress: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(count - 1, Math.floor(clamp01(progress) * count))
}

/** Height of the fixed public header and section bar, published by the About subnav. */
export const CHROME_VAR = '--wim-chrome'

function readChromeOffset(): number {
  if (typeof document === 'undefined') return 0
  const raw = getComputedStyle(document.documentElement).getPropertyValue(CHROME_VAR)
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Calls `onProgress` (at most once per frame) with the element's scroll progress.
 * Callers write CSS variables or set state from the callback, so the hook itself never re-renders.
 */
export function useScrollProgress<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onProgress: (progress: number) => void,
  mode: ScrollProgressMode = 'through',
) {
  const callbackRef = React.useRef(onProgress)
  callbackRef.current = onProgress

  useEffect(() => {
    const node = ref.current
    if (!node || typeof window === 'undefined') return
    let frame = 0
    const update = () => {
      frame = 0
      const rect = node.getBoundingClientRect()
      const offset = mode === 'pin' ? readChromeOffset() : 0
      callbackRef.current(computeScrollProgress(mode, rect.top, rect.height, window.innerHeight, offset))
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ref, mode])
}

/** Writes scroll progress to a CSS custom property on the element (default `--p`). */
export function useScrollVar<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  mode: ScrollProgressMode = 'through',
  name = '--p',
) {
  useScrollProgress(
    ref,
    (progress) => {
      ref.current?.style.setProperty(name, progress.toFixed(4))
    },
    mode,
  )
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])
  return reduced
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia(query)
    const sync = () => setMatches(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [query])
  return matches
}

export function useInView<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  rootMargin = '0px',
): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, rootMargin])
  return inView
}
