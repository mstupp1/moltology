import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  pathname: '/',
  session: { user: null, userId: null, isPending: false, isGuest: true, isAuthenticated: false } as Record<string, unknown>,
  clientId: 'client.apps.googleusercontent.com',
}))
const { oneTap, notify, success, error } = vi.hoisted(() => ({
  oneTap: vi.fn(), notify: vi.fn(), success: vi.fn(), error: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) => select({ location: { pathname: state.pathname } }),
}))
vi.mock('@/lib/auth-client', () => ({ authClient: { oneTap, $store: { notify } } }))
vi.mock('@/lib/auth-config', () => ({ getPublicGoogleClientId: () => state.clientId }))
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => state.session }))
vi.mock('@/components/ui/ToastProvider', () => ({ useOptionalToast: () => ({ toast: { success, error } }) }))

import { GoogleOneTap, ONE_TAP_COPY } from './GoogleOneTap'
import { ONE_TAP_DELAY_MS, markOneTapSignedOut, requestOneTap } from '@/lib/one-tap'

beforeEach(() => {
  vi.useFakeTimers()
  oneTap.mockResolvedValue(undefined)
  state.pathname = '/'
  state.session = { user: null, userId: null, isPending: false, isGuest: true, isAuthenticated: false }
  state.clientId = 'client.apps.googleusercontent.com'
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

function settle() {
  act(() => {
    vi.advanceTimersByTime(ONE_TAP_DELAY_MS + 10)
  })
}

describe('GoogleOneTap', () => {
  it('prompts a signed-out visitor on a public page once per visit, with auto sign-in', () => {
    const { rerender } = render(<GoogleOneTap />)
    settle()
    expect(oneTap).toHaveBeenCalledTimes(1)
    expect(oneTap.mock.calls[0][0]).toMatchObject({ context: 'signin', autoSelect: true })

    state.pathname = '/news'
    rerender(<GoogleOneTap />)
    settle()
    expect(oneTap).toHaveBeenCalledTimes(1)
  })

  it('asks instead of auto signing in after a sign-out on this browser', () => {
    markOneTapSignedOut()
    render(<GoogleOneTap />)
    settle()
    expect(oneTap.mock.calls[0][0]).toMatchObject({ autoSelect: false })
  })

  it.each([
    ['signed-in members', () => { state.session = { user: { id: 'u' }, userId: 'u', isPending: false, isGuest: false, isAuthenticated: true } }],
    ['a pending session', () => { state.session = { user: null, userId: null, isPending: true, isGuest: false, isAuthenticated: false } }],
    ['the sign-in page', () => { state.pathname = '/auth' }],
    ['app pages', () => { state.pathname = '/dashboard' }],
    ['the quiz before a result', () => { state.pathname = '/moltmax' }],
    ['Google sign-in turned off', () => { state.clientId = '' }],
  ])('stays quiet for %s', (_label, arrange) => {
    arrange()
    render(<GoogleOneTap />)
    settle()
    expect(oneTap).not.toHaveBeenCalled()
  })

  it('answers the quiz result request with a sign-up prompt', () => {
    state.pathname = '/moltmax'
    render(<GoogleOneTap />)
    act(() => requestOneTap({ context: 'signup' }))
    expect(oneTap).toHaveBeenCalledWith(expect.objectContaining({ context: 'signup' }))
  })

  it('refreshes the session and welcomes a brand-new account', async () => {
    render(<GoogleOneTap />)
    settle()
    const { onSuccess } = oneTap.mock.calls[0][0].fetchOptions
    onSuccess({ data: { user: { name: 'Myles', createdAt: new Date().toISOString() } } })
    expect(notify).toHaveBeenCalledWith('$sessionSignal')
    expect(success).toHaveBeenCalledWith(ONE_TAP_COPY.welcome, expect.anything())
  })

  it('greets a returning member by name', () => {
    render(<GoogleOneTap />)
    settle()
    const { onSuccess } = oneTap.mock.calls[0][0].fetchOptions
    onSuccess({ data: { user: { name: 'Myles', createdAt: '2026-01-01T00:00:00Z' } } })
    expect(success).toHaveBeenCalledWith('Signed in as Myles.', expect.anything())
  })

  it('explains an unlinked password account', () => {
    render(<GoogleOneTap />)
    settle()
    const { onError } = oneTap.mock.calls[0][0].fetchOptions
    onError({ error: { message: 'account not linked' } })
    expect(error).toHaveBeenCalledWith(ONE_TAP_COPY.notLinked, expect.anything())
  })
})
