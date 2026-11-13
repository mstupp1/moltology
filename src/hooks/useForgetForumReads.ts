import { useCallback } from 'react'
import { useAppQueryClient } from '@/lib/query/account'
import { forgetSavedRoutePages, forumKeys } from '@/lib/query/content'

/**
 * Call after any forum write (new post, reply, edit, delete). Saved forum lists and the
 * router's saved forum pages are dropped, so the next visit reads fresh and the member
 * sees their own change. Lists on screen refetch now.
 */
export function useForgetForumReads(): () => void {
  const client = useAppQueryClient()
  return useCallback(() => {
    void client.invalidateQueries({ queryKey: forumKeys.all })
    forgetSavedRoutePages('/_hud/forum')
  }, [client])
}
