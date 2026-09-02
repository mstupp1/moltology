import { describe, it, expect, beforeEach } from 'vitest'
import {
  resolveAuthSession,
  setCachedUser,
  clearCachedUser,
  getCachedUser,
  beginSignOut,
  endSignOut,
  isSignOutInFlight,
} from './auth-session'

describe('resolveAuthSession', () => {
  beforeEach(() => {
    endSignOut()
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
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

  it('clears cached user when session explicitly settles as logged out', () => {
    setCachedUser({ id: 'usr_cached_42', name: 'Cached Operative' })
    expect(getCachedUser()).not.toBeNull()

    // Hook returns settled null session
    const state = resolveAuthSession({ data: null, isPending: false })
    expect(state.isAuthenticated).toBe(false)
    expect(state.isGuest).toBe(true)
    expect(getCachedUser()).toBeNull()
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
})
