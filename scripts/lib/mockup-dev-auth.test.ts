import { describe, expect, it } from 'vitest'
import { validateDevCapture } from './mockup-dev-auth'

const env = { DATABASE_URL: 'postgres://a@dev/db', DEV_DATABASE_URL: 'postgres://a@dev/db', PROD_DATABASE_URL: 'postgres://a@prod/db', DEV_TEST_EMAIL: 'test@example.com', DEV_TEST_PASSWORD: 'secret', DEV_TEST_USER_ID: 'test-id' }
describe('authenticated mockup capture', () => {
  it('accepts a verified local development configuration', () => {
    expect(validateDevCapture('http://127.0.0.1:3000', env).userId).toBe('test-id')
  })
  it('rejects remote, production and incomplete configurations', () => {
    expect(() => validateDevCapture('https://example.com', env)).toThrow()
    expect(() => validateDevCapture('http://localhost:3000', { ...env, DATABASE_URL: env.PROD_DATABASE_URL })).toThrow()
    expect(() => validateDevCapture('http://localhost:3000', { ...env, DEV_TEST_PASSWORD: '' })).toThrow()
  })
})
