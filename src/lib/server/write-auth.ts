import type { JWTPayload } from 'jose'
import { getDb } from '../../db'
import { looksLikeJwt, verifyNeonJWT } from '../jwt'
import { ensureUserProfile } from '../user-sync'

type Db = ReturnType<typeof getDb>

export interface WriteAuthContext {
  user?: (JWTPayload & { id?: string }) | null
  token?: string | null
  db?: Db
}

export interface WriteAuthData {
  token?: string
  userId?: string
}

export interface ResolvedWriteAuth {
  userId: string
  token: string | null
  dbClient: Db
  payload: JWTPayload | null
}

/**
 * Resolves a verified user id for mutating server functions.
 *
 * Order:
 * 1. Middleware-verified JWT (`context.user.sub`)
 * 2. Explicit `data.token` verified via JWKS
 * 3. Reject — never trust bare `data.userId` without a matching verified JWT `sub`
 */
export async function resolveWriteAuth(opts: {
  data?: WriteAuthData | null
  context?: WriteAuthContext | null
  requireAuth?: boolean
}): Promise<ResolvedWriteAuth | null> {
  const { data, context, requireAuth = true } = opts
  const dbClient = context?.db || getDb()

  let userId: string | undefined = context?.user?.sub || context?.user?.id
  let token: string | null = context?.token || null
  let payload: JWTPayload | null = context?.user || null

  const explicitToken = data?.token
  if (!userId && looksLikeJwt(explicitToken)) {
    const verification = await verifyNeonJWT(explicitToken!)
    if (verification.valid && verification.payload?.sub) {
      userId = verification.payload.sub
      token = explicitToken!
      payload = verification.payload
    }
  }

  if (userId && data?.userId && data.userId !== userId) {
    throw new Error('Unauthorized: userId does not match authenticated identity.')
  }

  if (!userId) {
    if (requireAuth) {
      throw new Error('Unauthenticated: Authentication required.')
    }
    return null
  }

  await ensureUserProfile(userId)

  return { userId, token, dbClient, payload }
}
