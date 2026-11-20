import React from 'react'

/**
 * Last indicator position per tab row, kept across mounts. Section pages like Character's
 * Customize / Shop / Progress are separate routes, so the band (and its tab row) remounts on
 * every switch; remembering where the bar was lets the new row slide it from there.
 */
const lastPosition = new Map<string, { left: number; width: number }>()

const MOVE_MS = 440
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** The bar is 1px wide and scaled, so moving it is transform only (runs off the main thread). */
function barTransform(left: number, width: number) {
  return `translateX(${left}px) scaleX(${Math.max(width, 0)})`
}

/**
 * Positions a sliding bar under the active tab of a row. `listRef` is the positioned row,
 * `barRef` the absolutely positioned 1px bar inside it, and the active tab carries
 * `data-tab-active`. The bar slides with a soft ease-out; its leading edge goes first and the
 * trailing edge catches up, so it stretches a little toward the new tab. It animates only
 * transform, so a page that is busy mounting (a section that is its own route) can't stall it.
 * No motion with reduced motion on.
 */
export function useTabIndicator(
  listRef: React.RefObject<HTMLElement | null>,
  barRef: React.RefObject<HTMLElement | null>,
  memoryKey: string,
  activeKey: string | null,
) {
  const place = React.useCallback(
    (animate: boolean) => {
      const list = listRef.current
      const bar = barRef.current
      if (!list || !bar) return
      const active = list.querySelector<HTMLElement>('[data-tab-active="true"]')
      if (!active) {
        bar.style.opacity = '0'
        return
      }
      const left = active.offsetLeft
      const width = active.offsetWidth
      const from = lastPosition.get(memoryKey)
      lastPosition.set(memoryKey, { left, width })

      // The resting place. A running slide ends here too, so a resize mid-slide is safe.
      bar.style.transform = barTransform(left, width)
      bar.style.opacity = '1'

      if (
        !animate ||
        !from ||
        typeof bar.animate !== 'function' ||
        prefersReducedMotion() ||
        (from.left === left && from.width === width)
      ) {
        return
      }

      // Stretch: partway through, the leading edge is most of the way there and the trailing
      // edge has barely left.
      const fromRight = from.left + from.width
      const toRight = left + width
      const movingRight = left > from.left
      const lead = 0.75
      const trail = 0.2
      const midLeft = from.left + (left - from.left) * (movingRight ? trail : lead)
      const midRight = fromRight + (toRight - fromRight) * (movingRight ? lead : trail)
      bar.getAnimations?.().forEach((animation) => animation.cancel())
      bar.animate(
        [
          { transform: barTransform(from.left, from.width) },
          { transform: barTransform(midLeft, midRight - midLeft), offset: 0.4 },
          { transform: barTransform(left, width) },
        ],
        { duration: MOVE_MS, easing: EASE },
      )
    },
    [listRef, barRef, memoryKey],
  )

  // Runs before paint, so a remounted row never flashes the bar at its final spot first.
  React.useLayoutEffect(() => {
    place(true)
  }, [place, activeKey])

  // Labels can change width when fonts load or the window resizes: follow along.
  React.useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => place(false))
    observer.observe(list)
    return () => observer.disconnect()
  }, [listRef, place])
}
