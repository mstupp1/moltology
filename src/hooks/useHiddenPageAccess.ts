import { useEffect, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { hasExperiment, type ExperimentId } from '@/lib/experiments'
import { canViewHiddenPages } from '@/lib/hidden-pages'
import { getUserProfileFn } from '@/lib/server/api'

async function readProfile(userId: string) {
  try {
    const token = await getAuthJWTToken().catch(() => null)
    const profile = await getUserProfileFn({
      data: { token: token ?? undefined, userId },
    })
    return profile ?? null
  } catch {
    return null
  }
}

/**
 * Whether the signed-in viewer may open hidden pages.
 * Ordinary staff pages can resolve from the session role. Experiments always
 * read the stored profile switches and stay closed until that read finishes.
 */
export function useHiddenPageAccess(experiment?: ExperimentId): { canView: boolean; pending: boolean } {
  const session = useAuthSession()
  const userId = session.userId
  const sessionAllows = !session.isPending && canViewHiddenPages(session.user, null)
  const [profile, setProfile] = useState<{ role?: string | null; experiments?: unknown } | null | undefined>(undefined)
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (session.isPending || !userId || (sessionAllows && !experiment)) return
    let cancelled = false
    let revision = 0
    setProfile(undefined)
    setResolvedUserId(null)
    const refresh = () => {
      const current = ++revision
      void readProfile(userId).then((profile) => {
        if (cancelled || current !== revision) return
        setProfile(profile)
        setResolvedUserId(userId)
      })
    }
    refresh()
    window.addEventListener('experiments-changed', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('experiments-changed', refresh)
    }
  }, [session.isPending, sessionAllows, userId, experiment])

  if (session.isPending) {
    return { canView: false, pending: true }
  }
  if (!userId) {
    return { canView: false, pending: false }
  }
  if (sessionAllows && !experiment) {
    return { canView: true, pending: false }
  }
  if (resolvedUserId !== userId || profile === undefined) {
    return { canView: false, pending: true }
  }
  return {
    canView: experiment
      ? hasExperiment(profile?.role, profile?.experiments, experiment)
      : canViewHiddenPages(session.user, profile?.role),
    pending: false,
  }
}
