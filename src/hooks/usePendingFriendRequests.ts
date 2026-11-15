import { useEffect } from 'react'
import { countPendingFriendRequestsFn } from '@/lib/server/api'
import { accountKeys, authToken, useAppQuery, useAppQueryClient } from '@/lib/query/account'

/** Fired by the friends lists after they reload, so the account badge stays in step without its own fetch. */
export const FRIEND_REQUESTS_CHANGED_EVENT = 'friend-requests-changed'

export function announceFriendRequestCount(incoming: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FRIEND_REQUESTS_CHANGED_EVENT, { detail: { incoming } }))
}

/**
 * How many friend requests are waiting for the signed-in member. One shared read per
 * member, refreshed when the tab regains focus; the friends lists push fresh counts
 * through FRIEND_REQUESTS_CHANGED_EVENT. `cachedOnly` reads the shared count without fetching.
 */
export function usePendingFriendRequests(
  userId: string | null | undefined,
  { cachedOnly = false }: { cachedOnly?: boolean } = {},
): number {
  const client = useAppQueryClient()
  const query = useAppQuery<number>({
    queryKey: userId ? accountKeys.friendRequests(userId) : ['account', null, 'friend-requests'],
    // A single count query; the badge never needs the friends list itself.
    queryFn: async () =>
      (await countPendingFriendRequestsFn({ data: { token: await authToken() } }))?.incoming ?? 0,
    // cachedOnly: show a count another screen already read, never fetch one (public pages).
    enabled: Boolean(userId) && !cachedOnly,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  useEffect(() => {
    if (!userId) return
    const onChanged = (event: Event) => {
      const incoming = (event as CustomEvent<{ incoming?: number }>).detail?.incoming
      if (typeof incoming === 'number') client.setQueryData(accountKeys.friendRequests(userId), incoming)
    }
    window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, onChanged)
  }, [client, userId])

  return userId ? (query.data ?? 0) : 0
}
