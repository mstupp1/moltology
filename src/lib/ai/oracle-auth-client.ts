import { getAuthJWTToken } from '../jwt'

/**
 * JWT + optional userId payload for Oracle server functions.
 * Identity is the verified JWT sub; userId is only sent so resolveWriteAuth
 * can reject mismatches. Never treat userId as authentication by itself.
 */
export async function oracleAuthData(userId: string): Promise<{
  userId: string
  token?: string
}> {
  const token = await getAuthJWTToken().catch(() => null)
  return {
    userId,
    ...(token ? { token } : {}),
  }
}
