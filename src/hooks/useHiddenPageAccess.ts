import { useAuthSession } from '@/hooks/useAuthSession'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { hasExperiment, type ExperimentId } from '@/lib/experiments'
import { canViewHiddenPages } from '@/lib/hidden-pages'

/**
 * Whether the signed-in viewer may open hidden pages.
 * Ordinary staff pages can resolve from the session role. Experiments always
 * read the stored profile switches and stay closed until that read finishes.
 */
export function useHiddenPageAccess(experiment?: ExperimentId): { canView: boolean; pending: boolean } {
  const session = useAuthSession()
  const userId = session.userId
  const sessionAllows = !session.isPending && canViewHiddenPages(session.user, null)
  const needsProfile = !session.isPending && Boolean(userId) && !(sessionAllows && !experiment)
  const { profile } = useAccountProfile(needsProfile ? userId : null)

  if (session.isPending) {
    return { canView: false, pending: true }
  }
  if (!userId) {
    return { canView: false, pending: false }
  }
  if (sessionAllows && !experiment) {
    return { canView: true, pending: false }
  }
  if (profile === undefined) {
    return { canView: false, pending: true }
  }
  return {
    canView: experiment
      ? hasExperiment(profile?.role, profile?.experiments, experiment)
      : canViewHiddenPages(session.user, profile?.role),
    pending: false,
  }
}
