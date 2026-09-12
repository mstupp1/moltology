import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_AUTH_URL,
  getAuthBaseUrl,
  getAuthJwksUrl,
  getGoogleClientCredentials,
  isGoogleAuthEnabled,
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

  it('enables Google only when both server credentials exist', () => {
    expect(isGoogleAuthEnabled()).toBe(false)
    expect(getGoogleClientCredentials()).toBeNull()

    process.env.GOOGLE_CLIENT_ID = 'gid'
    expect(isGoogleAuthEnabled()).toBe(false)
    expect(getGoogleClientCredentials()).toBeNull()

    process.env.GOOGLE_CLIENT_SECRET = 'gsecret'
    expect(isGoogleAuthEnabled()).toBe(true)
    expect(getGoogleClientCredentials()).toEqual({ clientId: 'gid', clientSecret: 'gsecret' })
  })

  it('treats VITE_GOOGLE_AUTH_ENABLED as a client display flag', () => {
    process.env.VITE_GOOGLE_AUTH_ENABLED = 'true'
    expect(isGoogleAuthEnabled()).toBe(true)
    expect(getGoogleClientCredentials()).toBeNull()
  })
})
