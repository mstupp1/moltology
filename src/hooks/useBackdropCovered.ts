import { useEffect, useState } from 'react'

const CHECK_INTERVAL_MS = 750

/**
 * True when a full-screen overlay hides the app background: a dialog marked
 * aria-modal, or a sheet/menu that locked body scroll.
 */
export function isBackdropCovered(doc: Document = document): boolean {
  if (doc.body?.style.overflow === 'hidden') return true
  return doc.querySelector('[aria-modal="true"]') !== null
}

/**
 * Polls isBackdropCovered so the bubble canvas can stop animating behind
 * overlays. A cheap check on a slow interval; only re-renders on a change.
 */
export function useBackdropCovered(): boolean {
  const [covered, setCovered] = useState(false)

  useEffect(() => {
    const check = () => setCovered(isBackdropCovered())
    check()
    const id = window.setInterval(check, CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  return covered
}
