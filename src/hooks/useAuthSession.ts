import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useHydrated } from '@/hooks/useHydrated'
import {
  isOAuthPending,
  resolveAuthSession,
  settleOAuthSessionIfPending,
  type AuthSessionState,
} from '@/lib/auth-session'

function readAuthClientSession(): Promise<unknown> {
  const client = authClient as { getSession?: () => Promise<unknown> }
  if (typeof client.getSession === 'function') {
    return client.getSession()
  }
  return Promise.resolve(null)
}

export function useAuthSession(): AuthSessionState {
  const sessionRes = authClient.useSession()
  // Server snapshot is false so SSR and the hydration frame hold chrome.
  const clientReady = useHydrated()
  const [, setOauthEpoch] = useState(0)

  useEffect(() => {
    if (!clientReady || !isOAuthPending()) return
    let cancelled = false
    void settleOAuthSessionIfPending(readAuthClientSession).finally(() => {
      if (!cancelled) setOauthEpoch((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [clientReady])

  return resolveAuthSession(sessionRes, { clientReady })
}

export type { AuthSessionState, AuthSessionUser } from '@/lib/auth-session'
