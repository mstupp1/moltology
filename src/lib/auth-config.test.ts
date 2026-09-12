import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_AUTH_URL,
  getAuthBaseUrl,
  getAuthJwksUrl,
  getGoogleClientCredentials,
  isGoogleAuthEnabled,
  resolveViteGoogleAuthEnabled,
} from './auth-config'

const originalEnv = { ...process.env }

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
