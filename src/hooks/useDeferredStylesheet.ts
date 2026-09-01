import { useEffect } from 'react'

function isVitest(): boolean {
  return (
    (typeof import.meta !== 'undefined' &&
      ((import.meta as { env?: { MODE?: string; VITEST?: boolean } }).env?.MODE === 'test' ||
        Boolean((import.meta as { env?: { VITEST?: boolean } }).env?.VITEST))) ||
    (typeof process !== 'undefined' && process.env?.VITEST === 'true')
  )
}

/**
 * Loads a CSS chunk after first paint so it stays off the render-blocking critical path.
 * Eager in Vitest so class-based styles exist during component tests.
 */
export function useDeferredStylesheet(loader: () => Promise<unknown>): void {
  useEffect(() => {
    const load = () => {
      void loader()
    }

    if (isVitest()) {
      load()
      return
    }

    // Double rAF: wait until after the next paint before fetching decorative CSS.
    let innerRaf = 0
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(load)
    })

    return () => {
      cancelAnimationFrame(outerRaf)
      if (innerRaf) cancelAnimationFrame(innerRaf)
    }
  }, [loader])
}
