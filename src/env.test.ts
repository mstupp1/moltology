import { describe, it, expect, vi } from 'vitest'
import { validateEnv, env, envSchema } from './env'

describe('src/env.ts - Environment Variable Validation', () => {
  it('exports a default validated env object', () => {
    expect(env).toBeDefined()
    expect(env.VITE_NEON_AUTH_URL).toBeDefined()
    expect(env.VITE_NEON_JWKS_URL).toBeDefined()
    expect(env.DATABASE_URL).toBeDefined()
    expect(env.NODE_ENV).toBeDefined()
  })

  it('validates custom environment variable inputs successfully', () => {
    const custom = validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
      VITE_NEON_AUTH_URL: 'https://auth.example.com',
      VITE_NEON_JWKS_URL: 'https://auth.example.com/.well-known/jwks.json',
      NODE_ENV: 'production',
    })

    expect(custom.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/mydb')
    expect(custom.VITE_NEON_AUTH_URL).toBe('https://auth.example.com')
    expect(custom.VITE_NEON_JWKS_URL).toBe('https://auth.example.com/.well-known/jwks.json')
    expect(custom.NODE_ENV).toBe('production')
  })

  it('falls back to default URLs when optional/empty values are provided', () => {
    const fallbackEnv = validateEnv({
      DATABASE_URL: '',
      VITE_NEON_AUTH_URL: '',
      VITE_NEON_JWKS_URL: '',
    })

    expect(fallbackEnv.VITE_NEON_AUTH_URL).toContain('neonauth')
    expect(fallbackEnv.VITE_NEON_JWKS_URL).toContain('.well-known/jwks.json')
    expect(fallbackEnv.DATABASE_URL).toContain('postgresql://')
  })

  it('throws an error when VITE_NEON_AUTH_URL is not a valid URL', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      validateEnv({
        VITE_NEON_AUTH_URL: 'not-a-valid-url',
      })
    ).toThrow(/Invalid environment variables/)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('throws an error when NODE_ENV is an invalid enum value', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      validateEnv({
        NODE_ENV: 'invalid_env',
      })
    ).toThrow(/Invalid environment variables/)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
