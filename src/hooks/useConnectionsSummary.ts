import { useCallback } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { listConnectionsFn } from '@/lib/server/api'
import type { ConnectionsListView } from '@/lib/connections'
import { accountKeys, invalidateConnections, useAppQuery, useAppQueryClient } from '@/lib/query/account'
import { FRESH } from '@/lib/query/content'

export const EMPTY_CONNECTIONS: ConnectionsListView = {
  friends: [],
  incoming: [],
  outgoing: [],
}

/**
 * The signed-in member's friends, incoming and sent requests (first page, no suggestions).
 * One shared read for the dashboard card and Search, kept between page visits.
 */
export function useConnectionsSummary(): {
  connections: ConnectionsListView
  isLoading: boolean
  refresh: () => Promise<void>
} {
  const session = useAuthSession()
  const client = useAppQueryClient()
  const userId = session.userId
  const signedIn = Boolean(userId) && !session.isGuest

  const query = useAppQuery<ConnectionsListView>({
    queryKey: accountKeys.connections(userId ?? ''),
    queryFn: async () => {
      const token = await getAuthJWTToken()
      return (await listConnectionsFn({ data: { token: token ?? undefined } })) ?? EMPTY_CONNECTIONS
    },
    enabled: signedIn && !session.isPending,
    staleTime: FRESH.panel,
  })

  const refresh = useCallback(() => invalidateConnections(client), [client])

  return {
    connections: signedIn ? (query.data ?? EMPTY_CONNECTIONS) : EMPTY_CONNECTIONS,
    isLoading: session.isPending || (signedIn && query.isPending && !query.isError),
    refresh,
  }
}
