import { useEffect, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { canViewHiddenPages } from '@/lib/hidden-pages'
import { getUserProfileFn } from '@/lib/server/api'

async function readProfileRole(userId: string): Promise<string | null> {
  try {
    const token = await getAuthJWTToken().catch(() => null)
    const profile = await getUserProfileFn({
      data: { token: token ?? undefined, userId },
    })
    return profile?.role ?? null
  } catch {
    return null
  }
}

/**
 * Whether the signed-in viewer may open hidden pages.
 * Session role and super-admin email resolve immediately. Profile-only admins wait for one profile read.
 */
export function useHiddenPageAccess(): { canView: boolean; pending: boolean } {
  const session = useAuthSession()
  const userId = session.userId
  const sessionAllows = !session.isPending && canViewHiddenPages(session.user, null)
  const [profileRole, setProfileRole] = useState<string | null | undefined>(undefined)
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (session.isPending || !userId || sessionAllows) return
    let cancelled = false
    setProfileRole(undefined)
    setResolvedUserId(null)
    void readProfileRole(userId).then((role) => {
      if (cancelled) return
      setProfileRole(role)
      setResolvedUserId(userId)
    })
    return () => {
      cancelled = true
    }
  }, [session.isPending, sessionAllows, userId])

  if (session.isPending) {
    return { canView: false, pending: true }
  }
  if (!userId) {
    return { canView: false, pending: false }
  }
  if (sessionAllows) {
    return { canView: true, pending: false }
  }
  if (resolvedUserId !== userId || profileRole === undefined) {
    return { canView: false, pending: true }
  }
  return {
    canView: canViewHiddenPages(session.user, profileRole),
    pending: false,
  }
}
