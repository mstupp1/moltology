import { useCallback } from 'react'
import type { OracleSkillsPayload } from '@/lib/oracle-skills'
import { getOracleSkillsFn } from '@/lib/server/api'
import { accountKeys, authToken, useAppQuery, useAppQueryClient } from '@/lib/query/account'
import { FRESH } from '@/lib/query/content'

/**
 * Oracle skills as this member sees them: what they can use, what's switched off, and the
 * auto-pick setting. Shared by the Shop's Skills tab and the chat box picker. Guests get the
 * catalog with nothing usable. Waits for the session (`ready`) so members never see the
 * guest version first.
 */
export function useOracleSkills(userId: string | null | undefined, ready = true) {
  const queryKey = accountKeys.oracleSkills(userId ?? null)
  const query = useAppQuery<OracleSkillsPayload>({
    queryKey,
    queryFn: async () => getOracleSkillsFn({ data: { token: userId ? await authToken() : undefined } }),
    enabled: ready,
    staleTime: FRESH.panel,
    meta: { persist: Boolean(userId) },
  })
  const client = useAppQueryClient()
  const keyHash = JSON.stringify(queryKey)
  const setData = useCallback(
    (update: (prev: OracleSkillsPayload) => OracleSkillsPayload) =>
      client.setQueryData<OracleSkillsPayload>(JSON.parse(keyHash), (prev) => (prev ? update(prev) : prev)),
    [client, keyHash],
  )
  const refresh = useCallback(() => client.invalidateQueries({ queryKey: JSON.parse(keyHash) }), [client, keyHash])
  return { data: query.data ?? null, error: query.error, setData, refresh }
}
