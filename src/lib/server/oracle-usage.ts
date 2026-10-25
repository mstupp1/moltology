import { getOracleUsageSnapshot } from '../ai/service'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

export async function getOracleUsageHandler(args: {
  data?: { token?: string; userId?: string }
  context?: WriteAuthContext | null
}) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  return getOracleUsageSnapshot(auth.userId)
}
