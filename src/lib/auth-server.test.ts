import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_LINKING_OPTIONS,
  auth,
  ensureValidJwks,
  getAuthApiErrorUrl,
  isGoogleSocialConfigured,
  resolveAccountLinkingOptions,
} from './auth-server'

describe('auth-server', () => {
  it('exposes a Better Auth handler and email/password API', () => {
    expect(typeof auth.handler).toBe('function')
    expect(auth.api.signUpEmail).toBeDefined()
    expect(auth.api.signInEmail).toBeDefined()
    expect(auth.api.signOut).toBeDefined()
    expect(auth.api.getSession).toBeDefined()
  })

  it('reflects whether Google social is configured from environment credentials', () => {
    const expected = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    expect(isGoogleSocialConfigured()).toBe(expected)
  })

  it('auto-links Google onto existing same-email accounts', () => {
    expect(ACCOUNT_LINKING_OPTIONS.enabled).toBe(true)
    expect(ACCOUNT_LINKING_OPTIONS.trustedProviders).toEqual(['google'])
    expect(ACCOUNT_LINKING_OPTIONS.requireLocalEmailVerified).toBe(false)
    expect(getAuthApiErrorUrl('https://moltology.org/')).toBe('https://moltology.org/auth')
    expect(auth.api.linkSocialAccount).toBeDefined()
    expect(auth.api.listUserAccounts).toBeDefined()
    expect(auth.api.unlinkAccount).toBeDefined()
  })

  it('exposes ensureValidJwks for runtime self-healing', async () => {
    expect(typeof ensureValidJwks).toBe('function')
    await expect(ensureValidJwks()).resolves.not.toThrow()
  })
})

describe('account linking with email verification flag', () => {
  it('requires a verified local email when verification is on', () => {
    expect(resolveAccountLinkingOptions(true).requireLocalEmailVerified).toBe(true)
    expect(resolveAccountLinkingOptions(false).requireLocalEmailVerified).toBe(false)
  })
})
