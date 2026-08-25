import { createRemoteJWKSet, jwtVerify } from 'jose'
import { authClient } from './auth-client'
import { env } from '../env'

export const NEON_JWKS_URL = env.VITE_NEON_JWKS_URL

// Remote JWKS key set for verifying Neon Auth JWTs server-side or in API handlers
const JWKS = createRemoteJWKSet(new URL(NEON_JWKS_URL))

/**
 * True when a string looks like a compact JWT (three base64url segments).
 * Opaque Better Auth session cookies must not be treated as JWTs.
 */
export function looksLikeJwt(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

/**
 * Verify a JWT issued by Neon Auth using the remote JWKS endpoint.
 */
export async function verifyNeonJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS)
    return { valid: true, payload, error: null }
  } catch (error: any) {
    return { valid: false, payload: null, error: error?.message || 'Invalid JWT token' }
  }
}

/**
 * Get a real Neon Auth JWT for the current session.
 * Prefer `authClient.token()` (JWT plugin). Never return opaque
 * session cookies or session IDs — they fail JWKS verification.
 */
export async function getAuthJWTToken(): Promise<string | null> {
  try {
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
  } catch (err) {
    console.error('Error fetching JWT token from Neon Auth:', err)
    return null
  }
}
