import { describe, it, expect, vi } from 'vitest'
import { verifyNeonJWT, getAuthJWTToken, NEON_JWKS_URL } from './jwt'

describe('jwt.ts', () => {
  it('defines a valid NEON_JWKS_URL endpoint', () => {
    expect(NEON_JWKS_URL).toBeDefined()
    expect(NEON_JWKS_URL).toContain('.well-known/jwks.json')
  })

  it('returns valid: false for malformed or missing JWT tokens', async () => {
    const result = await verifyNeonJWT('invalid.jwt.token')
    expect(result.valid).toBe(false)
    expect(result.payload).toBeNull()
    expect(result.error).toBeDefined()
  })

  it('handles getAuthJWTToken when authClient is unauthenticated', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const token = await getAuthJWTToken()
    expect(token).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
