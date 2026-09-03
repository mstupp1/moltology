import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  resolveAuthSession,
  setCachedUser,
  clearCachedUser,
  getCachedUser,
  beginSignOut,
  endSignOut,
  isSignOutInFlight,
  beginOAuthSignIn,
  clearOAuthPending,
  isOAuthPending,
  settleOAuthSession,
  startGoogleSignIn,
  rememberSessionUser,
  SESSION_CACHE_GRACE_MS,
} from './auth-session'

describe('resolveAuthSession', () => {
  beforeEach(() => {
    endSignOut()
    clearOAuthPending()
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear()
    }
  })

  it('treats a missing session object as pending, not guest, when no cached user is present', () => {
    const state = resolveAuthSession(undefined)
    expect(state.isPending).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.isAuthenticated).toBe(false)
    expect(state.userId).toBeNull()
  })

  it('does not paint guest chrome for the first-paint { data: null } shape', () => {
    const state = resolveAuthSession({ data: null })
    expect(state.isPending).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.isAuthenticated).toBe(false)
    expect(state.userId).toBeNull()
  })

  it('holds chrome when the hook explicitly reports isPending and no cached user', () => {
    const state = resolveAuthSession({ data: null, isPending: true })
    expect(state.isPending).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.isAuthenticated).toBe(false)
  })

  it('settles as guest only after isPending is false and no user is present', () => {
    const state = resolveAuthSession({ data: null, isPending: false })
    expect(state.isPending).toBe(false)
    expect(state.isGuest).toBe(true)
    expect(state.isAuthenticated).toBe(false)
    expect(state.userId).toBeNull()
  })

  it('reads the user from session data.user and synchronizes to local session cache', () => {
    const state = resolveAuthSession({
      data: { user: { id: 'usr_1', name: 'Initiate' } },
      isPending: true,
    })
    expect(state.isPending).toBe(false)
    expect(state.isGuest).toBe(false)
    expect(state.isAuthenticated).toBe(true)
    expect(state.userId).toBe('usr_1')
    expect(state.user?.name).toBe('Initiate')
    expect(getCachedUser()?.id).toBe('usr_1')
  })

  it('instantly returns cached user while hook is pending on client to prevent non-logged-in flash on refresh', () => {
    setCachedUser({ id: 'usr_cached_42', name: 'Cached Operative', email: 'op42@moltology.org' })

    // Simulate page refresh where client hook starts as pending
    const state = resolveAuthSession({ data: null, isPending: true })
    expect(state.isAuthenticated).toBe(true)
    expect(state.isPending).toBe(false)
    expect(state.userId).toBe('usr_cached_42')
    expect(state.user?.name).toBe('Cached Operative')
  })

  it('clears a stale cached user when the session hook later confirms a logged-out guest', () => {
    setCachedUser(
      { id: 'usr_cached_42', name: 'Cached Operative' },
      Date.now() - SESSION_CACHE_GRACE_MS - 1,
    )
    expect(getCachedUser()).not.toBeNull()

    const state = resolveAuthSession({ data: null, isPending: false })
    expect(state.isAuthenticated).toBe(false)
    expect(state.isGuest).toBe(true)
    expect(getCachedUser()).toBeNull()
  })

  it('keeps a fresh cached member when the session hook settles empty after an Oracle/session error', () => {
    setCachedUser({ id: 'usr_qa', name: 'Probe', email: 'qa@moltology.org' })

    const state = resolveAuthSession({
      data: null,
      isPending: false,
      error: new Error('session refetch timed out'),
    })

    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.userId).toBe('usr_qa')
    expect(getCachedUser()?.id).toBe('usr_qa')
  })

  it('keeps a fresh cached member when the session hook settles empty without an explicit sign-out', () => {
    setCachedUser({ id: 'usr_qa', name: 'Probe' })

    const state = resolveAuthSession({ data: null, isPending: false })

    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.userId).toBe('usr_qa')
    expect(getCachedUser()?.id).toBe('usr_qa')
  })

  it('keeps a cached member while the session hook is refetching after a failed Oracle ask', () => {
    setCachedUser({ id: 'usr_qa', name: 'Probe' })

    const state = resolveAuthSession({
      data: null,
      isPending: false,
      isRefetching: true,
    })

    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.userId).toBe('usr_qa')
  })

  it('falls back to a root user when data.user is absent', () => {
    const state = resolveAuthSession({
      data: null,
      user: { id: 'usr_root', email: 'qa@example.org' },
      isPending: true,
    })
    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.userId).toBe('usr_root')
  })

  it('uses sub when id is missing', () => {
    const state = resolveAuthSession({
      data: { user: { sub: 'jwt-sub-9' } },
      isPending: false,
    })
    expect(state.userId).toBe('jwt-sub-9')
    expect(state.isAuthenticated).toBe(true)
  })

  it('holds chrome on the server / hydration frame even if the hook claims settled guest', () => {
    const state = resolveAuthSession(
      { data: null, isPending: false },
      { clientReady: false },
    )
    expect(state.isPending).toBe(true)
    expect(state.isGuest).toBe(false)
  })

  it('still reveals a signed-in user during the hydration frame so member chrome can paint', () => {
    const state = resolveAuthSession(
      { data: { user: { id: 'usr_ready' } }, isPending: true },
      { clientReady: false },
    )
    expect(state.isAuthenticated).toBe(true)
    expect(state.isPending).toBe(false)
    expect(state.isGuest).toBe(false)
  })

  it('does not resurrect member chrome from a stale hook user after beginSignOut', () => {
    setCachedUser({ id: 'usr_1', name: 'Initiate' })
    beginSignOut()
    expect(getCachedUser()).toBeNull()
    expect(isSignOutInFlight()).toBe(true)

    const state = resolveAuthSession({
      data: { user: { id: 'usr_1', name: 'Initiate' } },
      isPending: false,
    })
    expect(state.isAuthenticated).toBe(false)
    expect(state.isGuest).toBe(true)
    expect(state.userId).toBeNull()
    expect(getCachedUser()).toBeNull()
    expect(isSignOutInFlight()).toBe(true)
  })

  it('releases the sign-out latch once the session hook settles as guest', () => {
    beginSignOut()
    const state = resolveAuthSession({ data: null, isPending: false })
    expect(state.isGuest).toBe(true)
    expect(isSignOutInFlight()).toBe(false)
  })

  it('allows a new session after the sign-out latch settles', () => {
    beginSignOut()
    resolveAuthSession({ data: null, isPending: false })

    const state = resolveAuthSession({
      data: { user: { id: 'usr_2', name: 'Returned' } },
      isPending: false,
    })
    expect(state.isAuthenticated).toBe(true)
    expect(state.userId).toBe('usr_2')
    expect(getCachedUser()?.id).toBe('usr_2')
  })

  it('stays guest while sign-out is in flight even if the hook is still pending', () => {
    beginSignOut()
    const state = resolveAuthSession({ data: null, isPending: true })
    expect(state.isGuest).toBe(true)
    expect(state.isPending).toBe(false)
    expect(state.isAuthenticated).toBe(false)
    expect(isSignOutInFlight()).toBe(true)
  })

  it('holds chrome during an in-flight Google OAuth return before the session cookie is visible', () => {
    beginOAuthSignIn('/dashboard')
    const state = resolveAuthSession({ data: null, isPending: false })
    expect(state.isPending).toBe(true)
    expect(state.isGuest).toBe(false)
    expect(state.isAuthenticated).toBe(false)
    expect(isOAuthPending()).toBe(true)
  })
})

describe('OAuth session settlement', () => {
  beforeEach(() => {
    endSignOut()
    clearOAuthPending()
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear()
    }
  })

  it('caches the member from the first successful getSession and does not require a second OAuth attempt', async () => {
    beginOAuthSignIn('/dashboard')
    const getSession = vi.fn().mockResolvedValue({
      data: { user: { id: 'usr_google', name: 'Myles', email: 'myles@example.org' } },
    })

    const user = await settleOAuthSession(getSession, { attempts: 3, delayMs: 0 })

    expect(getSession).toHaveBeenCalledTimes(1)
    expect(user?.id).toBe('usr_google')
    expect(getCachedUser()?.id).toBe('usr_google')
    expect(isOAuthPending()).toBe(false)

    const state = resolveAuthSession({ data: null, isPending: false })
    expect(state.isAuthenticated).toBe(true)
    expect(state.userId).toBe('usr_google')
    expect(state.isGuest).toBe(false)
  })

  it('retries getSession once if the first look is empty, then authenticates on the next payload', async () => {
    beginOAuthSignIn('/chassis')
    const getSession = vi
      .fn()
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { user: { id: 'usr_google_2', name: 'Myles' } } })

    const user = await settleOAuthSession(getSession, { attempts: 3, delayMs: 0 })

    expect(getSession).toHaveBeenCalledTimes(2)
    expect(user?.id).toBe('usr_google_2')
    expect(isOAuthPending()).toBe(false)
  })

  it('caches a user from a one-shot Google sign-in response without a second click', async () => {
    const signInSocial = vi.fn().mockResolvedValue({
      data: { user: { id: 'usr_google', name: 'Myles' } },
    })

    const user = await startGoogleSignIn({
      signInSocial,
      callbackURL: 'https://moltology.org/dashboard',
      destination: '/dashboard',
    })

    expect(signInSocial).toHaveBeenCalledTimes(1)
    expect(signInSocial).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: 'https://moltology.org/dashboard',
    })
    expect(user?.id).toBe('usr_google')
    expect(getCachedUser()?.id).toBe('usr_google')
    expect(isOAuthPending()).toBe(false)
  })

  it('keeps the OAuth latch when social sign-in redirects without a user payload', async () => {
    const signInSocial = vi.fn().mockResolvedValue({})

    const user = await startGoogleSignIn({
      signInSocial,
      callbackURL: 'https://moltology.org/dashboard',
      destination: '/dashboard',
    })

    expect(user).toBeNull()
    expect(isOAuthPending()).toBe(true)
  })

  it('clears the OAuth latch when social sign-in throws', async () => {
    const signInSocial = vi.fn().mockRejectedValue(new Error('popup closed'))

    await expect(
      startGoogleSignIn({
        signInSocial,
        callbackURL: 'https://moltology.org/dashboard',
      }),
    ).rejects.toThrow('popup closed')

    expect(isOAuthPending()).toBe(false)
  })

  it('rememberSessionUser writes a cache that survives a later empty hook settle', () => {
    rememberSessionUser({ id: 'usr_email', name: 'Initiate' })
    const state = resolveAuthSession({ data: null, isPending: false })
    expect(state.isAuthenticated).toBe(true)
    expect(state.userId).toBe('usr_email')
  })
})
