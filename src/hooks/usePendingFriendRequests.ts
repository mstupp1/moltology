import { useEffect, useState } from 'react'
import { getAuthJWTToken } from '@/lib/jwt'
import { listConnectionsFn } from '@/lib/server/api'

/** Fired by the friends lists after they reload, so the account badge stays in step without its own fetch. */
export const FRIEND_REQUESTS_CHANGED_EVENT = 'friend-requests-changed'

export function announceFriendRequestCount(incoming: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FRIEND_REQUESTS_CHANGED_EVENT, { detail: { incoming } }))
}

/**
 * How many friend requests are waiting for the signed-in member. Loads once per
 * member and again when the tab regains focus; the friends lists push fresh
 * counts through FRIEND_REQUESTS_CHANGED_EVENT.
 */
export function usePendingFriendRequests(userId: string | null | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }
    let cancelled = false

    const load = async () => {
      try {
        const token = await getAuthJWTToken()
        const next = await listConnectionsFn({ data: { token: token ?? undefined, includeSuggestions: false } })
        if (!cancelled) setCount(next?.incoming?.length ?? 0)
      } catch {
        // Keep the last count; the badge is a hint, not a source of truth.
      }
    }
    const onChanged = (event: Event) => {
      const incoming = (event as CustomEvent<{ incoming?: number }>).detail?.incoming
      if (typeof incoming === 'number') setCount(incoming)
    }
    const onFocus = () => void load()

    void load()
    window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, onChanged)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, onChanged)
      window.removeEventListener('focus', onFocus)
    }
  }, [userId])

  return count
}
