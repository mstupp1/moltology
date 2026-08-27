import { useSyncExternalStore } from 'react'
import { authClient } from '@/lib/auth-client'
import { resolveAuthSession, type AuthSessionState } from '@/lib/auth-session'

const subscribeNoop = () => () => {}

/**
 * Server snapshot is false so SSR and the hydration frame hold chrome.
 * After hydration, the client snapshot is true and the session hook may settle.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false)
}

export function useAuthSession(): AuthSessionState {
  const sessionRes = authClient.useSession()
  const clientReady = useIsClient()
  return resolveAuthSession(sessionRes, { clientReady })
}

export type { AuthSessionState, AuthSessionUser } from '@/lib/auth-session'
