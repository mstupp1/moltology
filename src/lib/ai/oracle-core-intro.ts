import { useEffect, useState, useSyncExternalStore } from 'react'

/**
 * First-visit tip for the synaptic core ("Ask the Oracle anything").
 *
 * Shown once per device, guests included: it goes away for good the first
 * time the Oracle opens in any mode, or when the tip's close button is
 * pressed. It waits while the welcome flow is open, then appears after a
 * short pause so it doesn't land on top of the page loading.
 */
export const ORACLE_CORE_INTRO_KEY = 'moltology:oracle-core-intro-seen'
export const ORACLE_CORE_INTRO_DELAY_MS = 1500

let seen: boolean | null = null
let blocked = false
const listeners = new Set<() => void>()

function readSeen(): boolean {
  if (seen !== null) return seen
  if (typeof window === 'undefined') return true
  try {
    seen = window.localStorage.getItem(ORACLE_CORE_INTRO_KEY) === '1'
  } catch {
    // Storage blocked: treat as seen so the tip never nags on every load.
    seen = true
  }
  return seen
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Records that this device has found the Oracle; the tip never shows again. */
export function markOracleCoreIntroSeen() {
  if (readSeen()) return
  seen = true
  try {
    window.localStorage.setItem(ORACLE_CORE_INTRO_KEY, '1')
  } catch {}
  emit()
}

/** Holds the tip back while something covers the app, such as the welcome flow. */
export function setOracleCoreIntroBlocked(next: boolean) {
  if (blocked === next) return
  blocked = next
  emit()
}

/** Test helper: forget cached state so each test reads storage fresh. */
export function resetOracleCoreIntroForTests() {
  seen = null
  blocked = false
  emit()
}

const getSnapshot = () => (readSeen() ? 'seen' : blocked ? 'blocked' : 'ready')
const getServerSnapshot = () => 'seen' as const

/**
 * True once the tip should be on screen. Pass `enabled: false` while the core
 * itself is hidden or busy (its panel open, the More sheet up).
 */
export function useOracleCoreIntro(enabled = true): boolean {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const ready = enabled && state === 'ready'
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!ready) {
      setShown(false)
      return
    }
    const timer = window.setTimeout(() => setShown(true), ORACLE_CORE_INTRO_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [ready])

  return ready && shown
}
