import { createMiddleware } from '@tanstack/react-start'
import { looksLikeJwt, verifyAuthJWT } from '../jwt'
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

export function extractClientIp(request?: Request | null): string | null {
  if (!request || !request.headers) return null
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  return realIp || null
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

async function resolveSessionUser(request?: Request | null) {
  if (!request?.headers) return null
  try {
    const { auth } = await import('../auth-server')
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) return null
    return {
      sub: session.user.id,
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }
  } catch {
    return null
  }
}

/**
 * Middleware enforcing Better Auth JWT or session-cookie authentication.
 * Injects verified user payload, JWT token (when present), and owner db client.
 * Callers that cannot send cookies must pass a JWT via Bearer / x-auth-token
 * (or resolve identity in the handler with `data.token` via resolveWriteAuth).
 */
export const authMiddleware = createMiddleware().server(async ({ request, next, data }: any) => {
  const headerToken = extractAuthToken(request)
  const dataToken = typeof data?.token === 'string' && looksLikeJwt(data.token) ? data.token : null
  const token = headerToken || dataToken

  let user: { sub?: string; id?: string; [key: string]: unknown } | null = null
  if (token) {
    const verification = await verifyAuthJWT(token)
    if (verification.valid && verification.payload) {
      user = verification.payload
    }
  }
  if (!user) {
    user = await resolveSessionUser(request)
  }

  if (!user?.sub && !user?.id) {
    throw new ServerError('Unauthorized - Missing authentication token', 'UNAUTHORIZED', 401)
  }

  const { getDb } = await import('../../db')
  const { ensureUserProfile } = await import('../user-sync')
  const db = getDb()
  await ensureUserProfile(user.sub || user.id)

  return next({
    context: {
      user,
      token,
      db,
      clientIp: extractClientIp(request),
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
  const { getDb } = await import('../../db')
  let ctx: { user: any; token: string | null; db: any; clientIp: string | null }

  const clientIp = extractClientIp(request)

  if (!token) {
    const sessionUser = await resolveSessionUser(request)
    ctx = { user: sessionUser, token: null, db: getDb(), clientIp }
  } else {
    const verification = await verifyAuthJWT(token)
    if (verification.valid && verification.payload) {
      const { ensureUserProfile } = await import('../user-sync')
      await ensureUserProfile(verification.payload.sub)
      ctx = { user: verification.payload, token, db: getDb(), clientIp }
    } else {
      const sessionUser = await resolveSessionUser(request)
      ctx = { user: sessionUser, token: null, db: getDb(), clientIp }
    }
  }

  const res = await next({ context: ctx })
  return res
})
