import { describe, it, expect, vi, beforeEach } from 'vitest'
import { looksLikeJwt, getAuthJWTToken, verifyNeonJWT, NEON_JWKS_URL } from './jwt'

vi.mock('./auth-client', () => ({
  authClient: {
    token: vi.fn(),
    getSession: vi.fn(),
  },
}))

import { authClient } from './auth-client'

describe('jwt.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defines a valid NEON_JWKS_URL endpoint', () => {
    expect(NEON_JWKS_URL).toBeDefined()
    expect(NEON_JWKS_URL).toContain('.well-known/jwks.json')
  })

  it('detects compact JWTs and rejects opaque session tokens', () => {
    expect(looksLikeJwt('eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxIn0.sig')).toBe(true)
    expect(looksLikeJwt('opaque-session-cookie-value')).toBe(false)
    expect(looksLikeJwt('')).toBe(false)
    expect(looksLikeJwt(null)).toBe(false)
  })

  it('returns valid: false for malformed or missing JWT tokens', async () => {
    const result = await verifyNeonJWT('invalid.jwt.token')
    expect(result.valid).toBe(false)
    expect(result.payload).toBeNull()
    expect(result.error).toBeDefined()
  })

  it('prefers authClient.token() JWT over opaque session.token', async () => {
    const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.signature'
    vi.mocked((authClient as any).token).mockResolvedValue({ data: { token: jwt } })
    vi.mocked((authClient as any).getSession).mockResolvedValue({
      data: { session: { token: 'opaque-session-id' } },
    })

    const token = await getAuthJWTToken()
    expect(token).toBe(jwt)
    expect((authClient as any).getSession).not.toHaveBeenCalled()
  })

  it('falls back to access_token when token() is unavailable', async () => {
    const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1c2VyLTIifQ.signature'
    vi.mocked((authClient as any).token).mockResolvedValue({ data: { token: undefined } })
    vi.mocked((authClient as any).getSession).mockResolvedValue({
      data: { session: { token: 'opaque-session-id', access_token: jwt } },
    })

    const token = await getAuthJWTToken()
    expect(token).toBe(jwt)
  })

  it('returns null when only an opaque session.token is present', async () => {
    vi.mocked((authClient as any).token).mockResolvedValue({ data: {} })
    vi.mocked((authClient as any).getSession).mockResolvedValue({
      data: { session: { token: 'opaque-session-id' } },
    })

    const token = await getAuthJWTToken()
    expect(token).toBeNull()
  })

  it('handles getAuthJWTToken when authClient is unauthenticated', async () => {
    vi.mocked((authClient as any).token).mockRejectedValue(new Error('no session'))
    const token = await getAuthJWTToken()
    expect(token).toBeNull()
  })
})
