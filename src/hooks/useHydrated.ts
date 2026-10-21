import { useSyncExternalStore } from 'react'

const subscribeNoop = () => () => {}

/**
 * False on the server and during the hydration pass, true right after.
 * Use it to switch to browser-only values (local time zone, storage) without
 * making the hydration render differ from the server HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false)
}
