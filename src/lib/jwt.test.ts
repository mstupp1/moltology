import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  looksLikeJwt,
  getAuthJWTToken,
  verifyNeonJWT,
  NEON_JWKS_URL,
  clearCachedJwt,
  jwtAuthHeaders,
  JWT_FETCH_TIMEOUT_MS,
} from './jwt'

vi.mock('./auth-client', () => ({
  authClient: {
    token: vi.fn(),
    getSession: vi.fn(),
  },
}))

import { authClient } from './auth-client'

function compactJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'ES256' })).replace(/=+$/g, '')
  const body = btoa(JSON.stringify(payload)).replace(/=+$/g, '')
  return `${header}.${body}.signature`
}

describe('jwt.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCachedJwt()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearCachedJwt()
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

  it('builds a Bearer header only for compact JWTs', () => {
    const jwt = compactJwt({ sub: 'usr_1', exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(jwtAuthHeaders(jwt)).toEqual({ Authorization: `Bearer ${jwt}` })
    expect(jwtAuthHeaders('opaque-session-id')).toEqual({})
    expect(jwtAuthHeaders(null)).toEqual({})
  })

  it('returns valid: false for malformed or missing JWT tokens', async () => {
    const result = await verifyNeonJWT('invalid.jwt.token')
    expect(result.valid).toBe(false)
    expect(result.payload).toBeNull()
    expect(result.error).toBeDefined()
  })

  it('prefers authClient.token() JWT over opaque session.token', async () => {
    const jwt = compactJwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    vi.mocked((authClient as any).token).mockResolvedValue({ data: { token: jwt } })
    vi.mocked((authClient as any).getSession).mockResolvedValue({
      data: { session: { token: 'opaque-session-id' } },
    })

    const token = await getAuthJWTToken()
    expect(token).toBe(jwt)
    expect((authClient as any).getSession).not.toHaveBeenCalled()
  })

  it('reuses a cached JWT so HUD polls do not re-mint on every tick', async () => {
    const jwt = compactJwt({ sub: 'user-cache', exp: Math.floor(Date.now() / 1000) + 3600 })
    vi.mocked((authClient as any).token).mockResolvedValue({ data: { token: jwt } })

    expect(await getAuthJWTToken()).toBe(jwt)
    vi.mocked((authClient as any).token).mockClear()
    expect(await getAuthJWTToken()).toBe(jwt)
    expect((authClient as any).token).not.toHaveBeenCalled()
  })

  it('returns a nearly-expired cached JWT when a refresh mint fails', async () => {
    const jwt = compactJwt({ sub: 'user-keep', exp: Math.floor(Date.now() / 1000) + 10 })
    vi.mocked((authClient as any).token).mockResolvedValueOnce({ data: { token: jwt } })
    expect(await getAuthJWTToken()).toBe(jwt)

    vi.mocked((authClient as any).token).mockRejectedValue(new Error('no session'))
    vi.mocked((authClient as any).getSession).mockRejectedValue(new Error('no session'))
    expect(await getAuthJWTToken()).toBe(jwt)
  })

  it('times out a hung token() mint and returns null without throwing', async () => {
    vi.useFakeTimers()
    vi.mocked((authClient as any).token).mockReturnValue(new Promise(() => {}))

    const pending = getAuthJWTToken()
    await vi.advanceTimersByTimeAsync(JWT_FETCH_TIMEOUT_MS)
    await expect(pending).resolves.toBeNull()
  })

  it('falls back to access_token when token() is unavailable', async () => {
    const jwt = compactJwt({ sub: 'user-2', exp: Math.floor(Date.now() / 1000) + 3600 })
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
