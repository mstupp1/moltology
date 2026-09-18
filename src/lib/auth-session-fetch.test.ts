import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_SESSION_MOUNT_SHORT_CIRCUIT_MS } from './auth-config'
import {
  beginOAuthSignIn,
  beginSignOut,
  clearOAuthPending,
  endSignOut,
  setCachedUser,
} from './auth-session'
import {
  createAuthSessionFetch,
  isGetSessionRequest,
  resetGetSessionMountShortCircuitForTests,
  takeCachedGetSessionPayload,
} from './auth-session-fetch'

describe('get-session mount short-circuit', () => {
  beforeEach(() => {
    endSignOut()
    clearOAuthPending()
    resetGetSessionMountShortCircuitForTests()
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear()
    }
  })

  afterEach(() => {
    endSignOut()
    clearOAuthPending()
    resetGetSessionMountShortCircuitForTests()
  })

  it('recognizes get-session URLs and ignores other auth paths', () => {
    expect(isGetSessionRequest('https://moltology.org/api/auth/get-session')).toBe(true)
    expect(isGetSessionRequest('/api/auth/get-session?disableCookieCache=true')).toBe(true)
    expect(isGetSessionRequest(new URL('https://moltology.org/api/auth/get-session'))).toBe(true)
    expect(isGetSessionRequest('https://moltology.org/api/auth/token')).toBe(false)
    expect(isGetSessionRequest('https://moltology.org/api/auth/sign-in/email')).toBe(false)
  })

  it('returns null when there is no cached member so guests still hit get-session', () => {
    expect(takeCachedGetSessionPayload()).toBeNull()
  })

  it('reuses a fresh cached member once, then lets later fetches hit the network', () => {
    setCachedUser({ id: 'usr_hud', name: 'Probe' })
    const first = takeCachedGetSessionPayload()
    expect(first?.user.id).toBe('usr_hud')
    expect(first?.session.expiresAt).toBeTruthy()
    expect(takeCachedGetSessionPayload()).toBeNull()
  })

  it('does not skip get-session when the chrome cache is older than the cookie-cache window', () => {
    const now = Date.now()
    setCachedUser({ id: 'usr_stale', name: 'Probe' }, now - AUTH_SESSION_MOUNT_SHORT_CIRCUIT_MS - 1)
    expect(takeCachedGetSessionPayload(now)).toBeNull()
  })

  it('does not skip get-session during OAuth settlement or sign-out', () => {
    setCachedUser({ id: 'usr_oauth', name: 'Probe' })
    beginOAuthSignIn('/dashboard')
    expect(takeCachedGetSessionPayload()).toBeNull()
    clearOAuthPending()
    resetGetSessionMountShortCircuitForTests()
    beginSignOut()
    setCachedUser({ id: 'usr_out', name: 'Probe' })
    expect(takeCachedGetSessionPayload()).toBeNull()
  })

  it('serves a local JSON body for the first get-session and forwards later ones', async () => {
    setCachedUser({ id: 'usr_fetch', email: 'probe@moltology.org' })
    const baseFetch = vi.fn().mockResolvedValue(new Response('null', { status: 200 }))
    const wrapped = createAuthSessionFetch(baseFetch)

    const first = await wrapped('https://moltology.org/api/auth/get-session')
    expect(baseFetch).not.toHaveBeenCalled()
    expect(await first.json()).toMatchObject({ user: { id: 'usr_fetch' } })

    const second = await wrapped('https://moltology.org/api/auth/get-session')
    expect(baseFetch).toHaveBeenCalledTimes(1)
    expect(await second.text()).toBe('null')

    await wrapped('https://moltology.org/api/auth/token')
    expect(baseFetch).toHaveBeenCalledTimes(2)
  })
})
