import { describe, it, expect, vi } from 'vitest'
import { validateEnv, env, envSchema } from './env'

describe('src/env.ts - Environment Variable Validation', () => {
  it('exports a default validated env object', () => {
    expect(env).toBeDefined()
    expect(env.BETTER_AUTH_URL).toBeDefined()
    expect(env.DATABASE_URL).toBeDefined()
    expect(env.NODE_ENV).toBeDefined()
  })

  it('validates custom environment variable inputs successfully', () => {
    const custom = validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
      BETTER_AUTH_URL: 'https://moltology.org',
      NODE_ENV: 'production',
    })

    expect(custom.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/mydb')
    expect(custom.BETTER_AUTH_URL).toBe('https://moltology.org')
    expect(custom.NODE_ENV).toBe('production')
  })

  it('falls back to default URLs when optional/empty values are provided', () => {
    const fallbackEnv = validateEnv({
      DATABASE_URL: '',
      BETTER_AUTH_URL: '',
    })

    expect(fallbackEnv.BETTER_AUTH_URL).toBe('http://localhost:3000')
    expect(fallbackEnv.DATABASE_URL).toContain('postgresql://')
  })

  it('throws an error when BETTER_AUTH_URL is not a valid URL', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      validateEnv({
        BETTER_AUTH_URL: 'not-a-valid-url',
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

  it('exposes the env schema shape used by validateEnv', () => {
    expect(envSchema.shape.BETTER_AUTH_URL).toBeDefined()
    expect(envSchema.shape.DATABASE_URL).toBeDefined()
  })
})
