import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  AUTH_SESSION_CLIENT_OPTIONS,
  AUTH_SESSION_COOKIE_CACHE,
  AUTH_SESSION_MOUNT_SHORT_CIRCUIT_MS,
  authRequestNeedsJwksHeal,
  DEFAULT_AUTH_URL,
  getAuthBaseUrl,
  getAuthJwksUrl,
  getGoogleClientCredentials,
  isEmailVerificationEnabled,
  isGoogleAuthEnabled,
  resolveViteEmailVerificationEnabled,
  resolveViteGoogleAuthEnabled,
} from './auth-config'

const originalEnv = { ...process.env }

beforeEach(() => {
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
  delete process.env.VITE_GOOGLE_CLIENT_ID
  delete process.env.VITE_GOOGLE_AUTH_ENABLED
  delete process.env.VITE_EMAIL_VERIFICATION_ENABLED
  delete process.env.EMAIL_VERIFICATION_ENABLED
})

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key]
  }
  Object.assign(process.env, originalEnv)
})

describe('auth-config', () => {
  it('defaults the auth origin to localhost when no env is set', () => {
    delete process.env.BETTER_AUTH_URL
    delete process.env.VERCEL_URL
    expect(getAuthBaseUrl()).toBe(DEFAULT_AUTH_URL)
    expect(getAuthJwksUrl()).toBe(`${DEFAULT_AUTH_URL}/api/auth/jwks`)
  })

  it('prefers BETTER_AUTH_URL and strips a trailing slash', () => {
    process.env.BETTER_AUTH_URL = 'https://moltology.org/'
    expect(getAuthBaseUrl()).toBe('https://moltology.org')
    expect(getAuthJwksUrl()).toBe('https://moltology.org/api/auth/jwks')
  })

  it('builds an https origin from VERCEL_URL', () => {
    delete process.env.BETTER_AUTH_URL
    process.env.VERCEL_URL = 'moltology-git-preview.vercel.app'
    expect(getAuthBaseUrl()).toBe('https://moltology-git-preview.vercel.app')
  })

  it('does not treat server Google secrets as a client display flag', () => {
    delete process.env.VITE_GOOGLE_AUTH_ENABLED
  delete process.env.VITE_EMAIL_VERIFICATION_ENABLED
  delete process.env.EMAIL_VERIFICATION_ENABLED
    expect(isGoogleAuthEnabled()).toBe(false)
    expect(getGoogleClientCredentials()).toBeNull()

    process.env.GOOGLE_CLIENT_ID = 'gid'
    expect(isGoogleAuthEnabled()).toBe(false)
    expect(getGoogleClientCredentials()).toBeNull()

    process.env.GOOGLE_CLIENT_SECRET = 'gsecret'
    expect(isGoogleAuthEnabled()).toBe(false)
    expect(getGoogleClientCredentials()).toEqual({ clientId: 'gid', clientSecret: 'gsecret' })
  })

  it('shows Google only for an explicit VITE_GOOGLE_AUTH_ENABLED flag', () => {
    process.env.VITE_GOOGLE_AUTH_ENABLED = 'true'
    expect(isGoogleAuthEnabled()).toBe(true)
    expect(getGoogleClientCredentials()).toBeNull()
  })

  it('does not treat a raw VITE_GOOGLE_CLIENT_ID as an enable flag', () => {
    delete process.env.VITE_GOOGLE_AUTH_ENABLED
  delete process.env.VITE_EMAIL_VERIFICATION_ENABLED
  delete process.env.EMAIL_VERIFICATION_ENABLED
    process.env.VITE_GOOGLE_CLIENT_ID = '123456.apps.googleusercontent.com'
    expect(isGoogleAuthEnabled()).toBe(false)
  })
})

describe('resolveViteGoogleAuthEnabled', () => {
  it('bakes true when both server secrets exist and no flag is set', () => {
    expect(
      resolveViteGoogleAuthEnabled({
        GOOGLE_CLIENT_ID: 'gid',
        GOOGLE_CLIENT_SECRET: 'gsecret',
      }),
    ).toBe('true')
  })

  it('lets an explicit false flag win over server secrets', () => {
    expect(
      resolveViteGoogleAuthEnabled({
        VITE_GOOGLE_AUTH_ENABLED: 'false',
        GOOGLE_CLIENT_ID: 'gid',
        GOOGLE_CLIENT_SECRET: 'gsecret',
      }),
    ).toBe('false')
  })
})

describe('email verification flag', () => {
  it('defaults to off', () => {
    expect(isEmailVerificationEnabled()).toBe(false)
    expect(resolveViteEmailVerificationEnabled({})).toBe('false')
  })

  it('enables for explicit EMAIL_VERIFICATION_ENABLED or Vite mirror', () => {
    process.env.EMAIL_VERIFICATION_ENABLED = 'true'
    expect(isEmailVerificationEnabled()).toBe(true)
    expect(resolveViteEmailVerificationEnabled({ EMAIL_VERIFICATION_ENABLED: 'true' })).toBe('true')
    delete process.env.EMAIL_VERIFICATION_ENABLED
    process.env.VITE_EMAIL_VERIFICATION_ENABLED = '1'
    expect(isEmailVerificationEnabled()).toBe(true)
  })

  it('lets an explicit Vite false win over server true', () => {
    expect(
      resolveViteEmailVerificationEnabled({
        VITE_EMAIL_VERIFICATION_ENABLED: 'false',
        EMAIL_VERIFICATION_ENABLED: 'true',
      }),
    ).toBe('false')
  })
})

describe('session CPU gates', () => {
  it('does not poll or refetch Better Auth session on window focus', () => {
    expect(AUTH_SESSION_CLIENT_OPTIONS.refetchOnWindowFocus).toBe(false)
    expect(AUTH_SESSION_CLIENT_OPTIONS.refetchInterval).toBe(0)
    expect(AUTH_SESSION_CLIENT_OPTIONS.refetchWhenOffline).toBe(false)
  })

  it('enables a short signed session cookie cache so get-session can skip Neon', () => {
    expect(AUTH_SESSION_COOKIE_CACHE.enabled).toBe(true)
    expect(AUTH_SESSION_COOKIE_CACHE.maxAge).toBe(5 * 60)
    expect(AUTH_SESSION_MOUNT_SHORT_CIRCUIT_MS).toBe(5 * 60 * 1000)
  })

  it('skips JWKS heal on get-session and still runs it on mint/sign paths', () => {
    expect(authRequestNeedsJwksHeal('https://moltology.org/api/auth/get-session')).toBe(false)
    expect(authRequestNeedsJwksHeal('/api/auth/get-session/')).toBe(false)
    expect(authRequestNeedsJwksHeal('https://moltology.org/api/auth/token')).toBe(true)
    expect(authRequestNeedsJwksHeal('https://moltology.org/api/auth/jwks')).toBe(true)
    expect(authRequestNeedsJwksHeal('https://moltology.org/api/auth/sign-in/email')).toBe(true)
  })
})

