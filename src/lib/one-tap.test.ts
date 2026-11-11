import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearOneTapSignedOut,
  hasShownOneTapThisVisit,
  isFreshAccount,
  isOneTapAutoPath,
  isOneTapHost,
  isOneTapQuizPath,
  markOneTapShownThisVisit,
  markOneTapSignedOut,
  oneTapLanding,
  oneTapAutoSelectAllowed,
  onOneTapRequest,
  requestOneTap,
} from './one-tap'

afterEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  delete window.google
})

describe('where One Tap shows on its own', () => {
  it.each(['/', '/news', '/news/some-post', '/blog/x', '/forum', '/forum/topic/1', '/what-is-moltology/beliefs', '/org', '/moltmaxxing', '/store', '/store/border-tee', '/landing', '/news/'])(
    'shows on public page %s',
    (path) => expect(isOneTapAutoPath(path)).toBe(true),
  )

  it.each(['/moltmax', '/auth', '/sign-in', '/sign-up', '/login', '/signup', '/verify-email', '/dashboard', '/oracle', '/settings', '/store/status', '/store/checkout', '/newsletter', '/forum-old'])(
    'stays away from %s',
    (path) => expect(isOneTapAutoPath(path)).toBe(false),
  )

  it('treats the quiz as request-only', () => {
    expect(isOneTapQuizPath('/moltmax')).toBe(true)
    expect(isOneTapQuizPath('/moltmaxxing')).toBe(false)
  })

  it('only runs on origins registered with Google', () => {
    expect(isOneTapHost('moltology.org')).toBe(true)
    expect(isOneTapHost('www.moltology.org')).toBe(true)
    expect(isOneTapHost('localhost')).toBe(true)
    expect(isOneTapHost('moltology-git-x-myles.vercel.app')).toBe(false)
  })
})

describe('auto sign-in and sign-out', () => {
  it('allows auto sign-in until the member signs out here', () => {
    expect(oneTapAutoSelectAllowed()).toBe(true)
    const disableAutoSelect = vi.fn()
    window.google = { accounts: { id: { disableAutoSelect } } }
    markOneTapSignedOut()
    expect(oneTapAutoSelectAllowed()).toBe(false)
    expect(disableAutoSelect).toHaveBeenCalled()
    clearOneTapSignedOut()
    expect(oneTapAutoSelectAllowed()).toBe(true)
  })

  it('remembers the prompt for this visit only', () => {
    expect(hasShownOneTapThisVisit()).toBe(false)
    markOneTapShownThisVisit()
    expect(hasShownOneTapThisVisit()).toBe(true)
  })
})

describe('helpers', () => {
  it('spots an account made a moment ago', () => {
    const now = Date.parse('2026-11-11T18:00:00Z')
    expect(isFreshAccount('2026-11-11T17:59:30Z', now)).toBe(true)
    expect(isFreshAccount('2026-11-01T00:00:00Z', now)).toBe(false)
    expect(isFreshAccount(undefined, now)).toBe(false)
    expect(isFreshAccount('nonsense', now)).toBe(false)
  })

  it('passes page requests to the listener', () => {
    const listener = vi.fn()
    const stop = onOneTapRequest(listener)
    requestOneTap({ context: 'signup' })
    stop()
    requestOneTap({ context: 'signin' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ context: 'signup' })
  })
})

describe('where a One Tap sign-in lands', () => {
  it('sends new accounts and homepage sign-ins to the dashboard, keeps readers in place', () => {
    expect(oneTapLanding({ path: '/', fresh: false })).toBe('/dashboard')
    expect(oneTapLanding({ path: '/landing', fresh: false })).toBe('/dashboard')
    expect(oneTapLanding({ path: '/forum/topic/1', fresh: true })).toBe('/dashboard')
    expect(oneTapLanding({ path: '/forum/topic/1', fresh: false })).toBeNull()
    expect(oneTapLanding({ path: '/moltmax', fresh: true })).toBeNull()
  })
})
