import { createMiddleware } from '@tanstack/react-start'
import { verifyNeonJWT } from '../jwt'
import { getDb } from '../../db'
import { ensureUserProfile } from '../user-sync'
import { ServerError } from './error'

/**
 * Extracts a Bearer token or x-auth-token from request headers.
 */
export function extractAuthToken(request?: Request | null): string | null {
  if (!request || !request.headers) return null

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim()
  }

  const customHeader = request.headers.get('x-auth-token')
  if (customHeader) {
    return customHeader.trim()
  }

  return null
}

/**
 * Middleware for logging server function performance and errors.
 */
export const loggingMiddleware = createMiddleware().server(async ({ request, next }) => {
  const startTime = Date.now()
  const method = request?.method || 'RPC'
  const url = request?.url || 'serverFn'

  try {
    const result = await next()
    const duration = Date.now() - startTime
    console.log(`[ServerFn] ${method} ${url} - Completed in ${duration}ms`)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[ServerFn Error] ${method} ${url} - Failed after ${duration}ms:`, error)
    throw error
  }
})

/**
 * Middleware enforcing valid Neon Auth JWT authentication.
 * Automatically injects verified user payload, JWT token, and RLS-scoped db client into context.
 */
export const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  const token = extractAuthToken(request)

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
  const db = getDb(token)
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
 * Injects user payload and RLS db client if valid token provided; falls back to default db if unauthenticated.
 */
export const optionalAuthMiddleware = createMiddleware().server(async ({ request, next }) => {
  const token = extractAuthToken(request)
  let ctx: { user: any; token: string | null; db: ReturnType<typeof getDb> }

  if (!token) {
    ctx = { user: null, token: null, db: getDb() }
  } else {
    const verification = await verifyNeonJWT(token)
    if (verification.valid && verification.payload) {
      await ensureUserProfile(verification.payload.sub)
      ctx = { user: verification.payload, token, db: getDb(token) }
    } else {
      ctx = { user: null, token: null, db: getDb() }
    }
  }

  const res = await next({ context: ctx })
  return res
})
