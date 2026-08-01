import { createRemoteJWKSet, jwtVerify } from 'jose'
import { authClient } from './auth-client'

export const NEON_JWKS_URL = 
  (import.meta as any).env?.VITE_NEON_JWKS_URL || 
  'https://ep-cold-breeze-aye6s748.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json'

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
    if (typeof (authClient as any).getJWTToken === 'function') {
      return await (authClient as any).getJWTToken()
    }
    const session = await (authClient as any).getSession()
    return session?.data?.session?.token || null
  } catch (err) {
    console.error('Error fetching JWT token from Neon Auth:', err)
    return null
  }
}
