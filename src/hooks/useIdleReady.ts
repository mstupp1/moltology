import { useEffect, useState } from 'react'

/**
 * Becomes true after the browser is idle (or a timeout), or on first user input.
 * Used to defer auth-vendor and other non-critical hydration off the LCP path.
 * Always true immediately under Vitest so component tests stay sync-friendly.
 */
export function useIdleReady(timeoutMs = 2500): boolean {
  const isTest =
    (typeof import.meta !== 'undefined' &&
      ((import.meta as { env?: { MODE?: string; VITEST?: boolean } }).env?.MODE === 'test' ||
        Boolean((import.meta as { env?: { VITEST?: boolean } }).env?.VITEST))) ||
    (typeof process !== 'undefined' && process.env?.VITEST === 'true')

  const [ready, setReady] = useState(isTest)

  useEffect(() => {
    if (isTest || ready) return

    let cancelled = false
    const enable = () => {
      if (!cancelled) setReady(true)
    }

    const onInteract = () => enable()
    window.addEventListener('pointerdown', onInteract, { once: true, passive: true })
    window.addEventListener('keydown', onInteract, { once: true })

    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let rafId = requestAnimationFrame(() => {
      const ric = window.requestIdleCallback
      if (typeof ric === 'function') {
        idleId = ric.call(window, enable, { timeout: timeoutMs })
      } else {
        timeoutId = setTimeout(enable, Math.min(timeoutMs, 200))
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('keydown', onInteract)
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [isTest, ready, timeoutMs])

  return ready
}
