import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  pathname: '/',
  session: { user: null, userId: null, isPending: false, isGuest: true, isAuthenticated: false } as Record<string, unknown>,
  clientId: 'client.apps.googleusercontent.com',
}))
const { oneTap, notify, success, error, navigate } = vi.hoisted(() => ({
  oneTap: vi.fn(), notify: vi.fn(), success: vi.fn(), error: vi.fn(), navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
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

  const NEW = { data: { user: { createdAt: new Date().toISOString() } } }
  const OLD = { data: { user: { createdAt: '2026-01-01T00:00:00Z' } } }

  it.each([
    ['a new account on the homepage', '/', NEW, '/dashboard'],
    ['a new account on a news post', '/news/some-post', NEW, '/dashboard'],
    ['a returning member on the homepage', '/', OLD, '/dashboard'],
    ['a returning member on a news post', '/news/some-post', OLD, null],
    ['a returning member in the forum', '/forum', OLD, null],
  ])('lands %s correctly with no success toast', (_label, path, response, landing) => {
    state.pathname = path as string
    render(<GoogleOneTap />)
    settle()
    oneTap.mock.calls[0][0].fetchOptions.onSuccess(response)
    expect(notify).toHaveBeenCalledWith('$sessionSignal')
    if (landing) expect(navigate).toHaveBeenCalledWith({ to: landing })
    else expect(navigate).not.toHaveBeenCalled()
    expect(success).not.toHaveBeenCalled()
  })

  it('keeps a new account on the quiz result', () => {
    state.pathname = '/moltmax'
    render(<GoogleOneTap />)
    act(() => requestOneTap({ context: 'signup' }))
    oneTap.mock.calls[0][0].fetchOptions.onSuccess(NEW)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('explains an unlinked password account', () => {
    render(<GoogleOneTap />)
    settle()
    const { onError } = oneTap.mock.calls[0][0].fetchOptions
    onError({ error: { message: 'account not linked' } })
    expect(error).toHaveBeenCalledWith(ONE_TAP_COPY.notLinked, expect.anything())
  })
})
