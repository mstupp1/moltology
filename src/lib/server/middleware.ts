import { createMiddleware } from '@tanstack/react-start'
import { looksLikeJwt, verifyNeonJWT } from '../jwt'
import { getDb } from '../../db'
import { ensureUserProfile } from '../user-sync'
import { ServerError } from './error'

/**
 * Extracts a JWKS-verifiable JWT from request headers only.
 * Opaque Better Auth session cookies are never treated as JWTs.
 */
export function extractAuthToken(request?: Request | null): string | null {
  if (!request || !request.headers) return null

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim()
    return looksLikeJwt(token) ? token : null
  }

  const customHeader = request.headers.get('x-auth-token')
  if (customHeader) {
    const token = customHeader.trim()
    return looksLikeJwt(token) ? token : null
  }

  return null
}

/**
 * Middleware for logging server function performance and errors.
 */
export const loggingMiddleware = createMiddleware().server(async ({ request, next }) => {
  try {
    return await next()
  } catch (error) {
    const method = request?.method || 'RPC'
    const url = request?.url || 'serverFn'
    console.error(`[ServerFn Error] ${method} ${url}:`, error)
    throw error
  }
})

/**
 * Middleware enforcing valid Neon Auth JWT authentication.
 * Injects verified user payload, JWT token, and owner db client into context.
 * Callers that cannot send cookies must pass a JWT via Bearer / x-auth-token
 * (or resolve identity in the handler with `data.token` via resolveWriteAuth).
 */
export const authMiddleware = createMiddleware().server(async ({ request, next, data }: any) => {
  const headerToken = extractAuthToken(request)
  const dataToken = typeof data?.token === 'string' && looksLikeJwt(data.token) ? data.token : null
  const token = headerToken || dataToken

  if (!token) {
    throw new ServerError('Unauthorized - Missing authentication token', 'UNAUTHORIZED', 401)
  }

  const verification = await verifyNeonJWT(token)
  if (!verification.valid || !verification.payload) {
    throw new ServerError(
      verification.error || 'Unauthorized - Invalid or expired token',
      'UNAUTHORIZED',
      401,
    )
  }

  const user = verification.payload
  const db = getDb()
  await ensureUserProfile(user.sub)

  return next({
    context: {
      user,
      token,
      db,
    },
  })
})

/**
 * Middleware for optional authentication.
 * Injects user payload if a valid JWT is present; otherwise uses the default owner db.
 */
export const optionalAuthMiddleware = createMiddleware().server(async ({ request, next, data }: any) => {
  const headerToken = extractAuthToken(request)
  const dataToken = typeof data?.token === 'string' && looksLikeJwt(data.token) ? data.token : null
  const token = headerToken || dataToken
  let ctx: { user: any; token: string | null; db: ReturnType<typeof getDb> }

  if (!token) {
    ctx = { user: null, token: null, db: getDb() }
  } else {
    const verification = await verifyNeonJWT(token)
    if (verification.valid && verification.payload) {
      await ensureUserProfile(verification.payload.sub)
      ctx = { user: verification.payload, token, db: getDb() }
    } else {
      ctx = { user: null, token: null, db: getDb() }
    }
  }

  const res = await next({ context: ctx })
  return res
})
