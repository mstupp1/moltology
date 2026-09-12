import { createRemoteJWKSet, jwtVerify } from 'jose'
import { authClient } from './auth-client'
import { getAuthJwksUrl } from './auth-config'
import { peekCachedJwt, setCachedJwt } from './jwt-cache'

export { clearCachedJwt } from './jwt-cache'

export const AUTH_JWKS_URL = getAuthJwksUrl()
/** @deprecated Use AUTH_JWKS_URL — kept for existing test imports. */
export const NEON_JWKS_URL = AUTH_JWKS_URL

/** Hung JWT mint must not stall Oracle/HUD polls for minutes. */
export const JWT_FETCH_TIMEOUT_MS = 4_000
/** Refresh a cached JWT this long before `exp`. */
export const JWT_CACHE_SKEW_MS = 30_000

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(AUTH_JWKS_URL))
  }
  return jwks
}

/**
 * True when a string looks like a compact JWT (three base64url segments).
 * Opaque Better Auth session cookies must not be treated as JWTs.
 */
export function looksLikeJwt(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

export function jwtAuthHeaders(token?: string | null): Record<string, string> {
  if (!looksLikeJwt(token)) return {}
  return { Authorization: `Bearer ${token}` }
}

function decodeBase64Url(part: string): string {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4)
  if (typeof atob === 'function') return atob(padded)
  return Buffer.from(padded, 'base64').toString('utf8')
}

export function readJwtExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const payload = JSON.parse(decodeBase64Url(payloadPart)) as { exp?: number }
    if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
      return payload.exp * 1000
    }
  } catch {
    // Ignore malformed payloads
  }
  return null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
    )
  })
}

/**
 * Verify a JWT issued by self-hosted Better Auth using the local JWKS endpoint.
 */
export async function verifyAuthJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwks())
    return { valid: true, payload, error: null }
  } catch (error: any) {
    return { valid: false, payload: null, error: error?.message || 'Invalid JWT token' }
  }
}

/** @deprecated Use verifyAuthJWT */
export const verifyNeonJWT = verifyAuthJWT

async function fetchJwtFromClient(): Promise<string | null> {
  const client = authClient as any

  // 1. Try explicit JWT client plugin
  if (typeof client.token === 'function') {
    try {
      const tokenRes = await client.token()
      const jwt =
        tokenRes?.data?.token ||
        tokenRes?.token ||
        (typeof tokenRes === 'string' ? tokenRes : null)
      if (looksLikeJwt(jwt)) return jwt
    } catch {
      // Fall back to inspecting session candidates
    }
  }

  // 2. Try inspecting session payload
  if (typeof client.getSession === 'function') {
    try {
      const session = await client.getSession()
      const candidates = [
        session?.data?.session?.access_token,
        session?.data?.access_token,
        session?.session?.access_token,
        session?.access_token,
        session?.data?.session?.token,
        session?.session?.token,
        session?.data?.token,
        session?.token,
        session?.data?.session?.jwt,
        session?.data?.jwt,
      ]

      for (const candidate of candidates) {
        if (looksLikeJwt(candidate)) return candidate
      }
    } catch {
      // Fall back to null
    }
  }

  return null
}

function rememberJwt(token: string, now = Date.now()): string {
  const expMs = readJwtExpiryMs(token) ?? now + 5 * 60 * 1000
  setCachedJwt(token, expMs)
  return token
}

/**
 * Get a Better Auth JWT for the current session.
 * Prefer `authClient.token()` (JWT plugin). Never return opaque
 * session cookies or session IDs — they fail JWKS verification.
 *
 * A hung mint is treated as a miss (null), not a sign-out. A still-valid
 * cached JWT is reused so HUD polls keep working while auth is slow.
 */
export async function getAuthJWTToken(): Promise<string | null> {
  try {
    const now = Date.now()
    const cached = peekCachedJwt()
    if (cached && cached.expMs - JWT_CACHE_SKEW_MS > now) {
      return cached.token
    }

    const jwt = await withTimeout(fetchJwtFromClient(), JWT_FETCH_TIMEOUT_MS)
    if (looksLikeJwt(jwt)) return rememberJwt(jwt as string, now)

    if (cached && cached.expMs > now) return cached.token
    return null
  } catch (err) {
    console.error('Error fetching JWT token from Better Auth:', err)
    const now = Date.now()
    const cached = peekCachedJwt()
    if (cached && cached.expMs > now) return cached.token
    return null
  }
}
