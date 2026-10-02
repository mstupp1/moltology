import { useEffect, useState } from 'react'
import { getForumStandingFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import type { ForumStandingDecision } from '@/lib/forum-standing'

/**
 * The signed-in member's forum Standing. Null while loading, when signed out,
 * or if the read fails; the server still enforces the gate on submit.
 */
export function useForumStanding(userId: string | null | undefined): ForumStandingDecision | null {
  const [standing, setStanding] = useState<ForumStandingDecision | null>(null)

  useEffect(() => {
    if (!userId) {
      setStanding(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const token = await getAuthJWTToken()
        const result = await getForumStandingFn({
          data: { userId, token: token ?? undefined },
        })
        if (!cancelled) setStanding(result ?? null)
      } catch {
        if (!cancelled) setStanding(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  return standing
}
