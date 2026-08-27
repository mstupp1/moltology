import { describe, it, expect } from 'vitest'
import { resolveAuthSession } from './auth-session'

describe('resolveAuthSession', () => {
  it('treats a missing session object as pending, not guest', () => {
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

  it('holds chrome when the hook explicitly reports isPending', () => {
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

  it('reads the user from session data.user', () => {
    const state = resolveAuthSession({
      data: { user: { id: 'usr_1', name: 'Initiate' } },
      isPending: true,
    })
    expect(state.isPending).toBe(false)
    expect(state.isGuest).toBe(false)
    expect(state.isAuthenticated).toBe(true)
    expect(state.userId).toBe('usr_1')
    expect(state.user?.name).toBe('Initiate')
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
})
