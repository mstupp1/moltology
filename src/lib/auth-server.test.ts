import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMAIL_VERIFICATION_COPY } from './auth-email-verification'
import {
  ACCOUNT_LINKING_OPTIONS,
  auth,
  ensureValidJwks,
  getAuthApiErrorUrl,
  isGoogleSocialConfigured,
  resolveAccountLinkingOptions,
  sendVerificationEmail,
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

describe('sendVerificationEmail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('throws when Resend is not sent', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    await expect(
      sendVerificationEmail({
        user: { email: 'member@example.com' },
        url: 'https://moltology.org/api/auth/verify-email?token=abc',
      }),
    ).rejects.toThrow(EMAIL_VERIFICATION_COPY.sendFailed)
  })

  it('throws when Resend rejects the message', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' }),
    )
    await expect(
      sendVerificationEmail({
        user: { email: 'member@example.com' },
        url: 'https://moltology.org/api/auth/verify-email?token=abc',
      }),
    ).rejects.toThrow(EMAIL_VERIFICATION_COPY.sendFailed)
  })

  it('resolves when Resend accepts the message', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      sendVerificationEmail({
        user: { email: 'member@example.com' },
        url: 'https://moltology.org/api/auth/verify-email?token=abc',
      }),
    ).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
