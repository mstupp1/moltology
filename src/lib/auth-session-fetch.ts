import { AUTH_SESSION_MOUNT_SHORT_CIRCUIT_MS } from './auth-config'
import {
  getCachedUser,
  getCachedUserAgeMs,
  isOAuthPending,
  isSignOutInFlight,
  type AuthSessionUser,
} from './auth-session'

let mountShortCircuitConsumed = false

export function resetGetSessionMountShortCircuitForTests(): void {
  mountShortCircuitConsumed = false
}

export function isGetSessionRequest(input: RequestInfo | URL): boolean {
  const href =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : typeof Request !== 'undefined' && input instanceof Request
          ? input.url
          : String(input)
  try {
    const path = href.includes('://') ? new URL(href).pathname : href.split('?')[0]
    return path.replace(/\/+$/, '').toLowerCase().endsWith('/get-session')
  } catch {
    return /\/get-session(?:\?|$)/i.test(href)
  }
}

export type CachedGetSessionPayload = {
  user: AuthSessionUser
  session: { expiresAt: string }
}

/**
 * One-shot: the first `/get-session` in this JS context may reuse a fresh
 * local member instead of waking `/api/auth/get-session`. Sign-in, sign-out,
 * OAuth, and later cross-tab refetches still hit the network.
 */
export function takeCachedGetSessionPayload(
  now = Date.now(),
): CachedGetSessionPayload | null {
  if (mountShortCircuitConsumed) return null
  if (typeof window === 'undefined') return null
  if (isOAuthPending() || isSignOutInFlight()) return null
  const age = getCachedUserAgeMs(now)
  if (age == null || age > AUTH_SESSION_MOUNT_SHORT_CIRCUIT_MS) return null
  const user = getCachedUser()
  if (!user) return null
  mountShortCircuitConsumed = true
  return {
    user,
    session: { expiresAt: new Date(now + AUTH_SESSION_MOUNT_SHORT_CIRCUIT_MS).toISOString() },
  }
}

export function createAuthSessionFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    if (isGetSessionRequest(input)) {
      const cached = takeCachedGetSessionPayload()
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
    }
    return baseFetch(input, init)
  }
}
