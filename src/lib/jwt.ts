import { createRemoteJWKSet, jwtVerify } from 'jose'
import { authClient } from './auth-client'
import { env } from '../env'

export const NEON_JWKS_URL = env.VITE_NEON_JWKS_URL

// Remote JWKS key set for verifying Neon Auth JWTs server-side or in API handlers
const JWKS = createRemoteJWKSet(new URL(NEON_JWKS_URL))

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
 * Get the current active user's JWT token from Neon Auth.
 */
export async function getAuthJWTToken(): Promise<string | null> {
  try {
    const session = await (authClient as any).getSession()
    return session?.data?.session?.token || session?.data?.token || null
  } catch (err) {
    console.error('Error fetching JWT token from Neon Auth:', err)
    return null
  }
}
