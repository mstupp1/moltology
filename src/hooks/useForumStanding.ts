import { getForumStandingFn } from '@/lib/server/api'
import type { ForumStandingDecision } from '@/lib/forum-standing'
import { accountKeys, authToken, useAppQuery } from '@/lib/query/account'

/**
 * The signed-in member's forum Standing. Null while loading, when signed out,
 * or if the read fails; the server still enforces the gate on submit.
 */
export function useForumStanding(userId: string | null | undefined): ForumStandingDecision | null {
  const query = useAppQuery<ForumStandingDecision | null>({
    queryKey: userId ? accountKeys.forumStanding(userId) : ['account', null, 'forum-standing'],
    queryFn: async () =>
      (await getForumStandingFn({ data: { userId: userId!, token: await authToken() } })) ?? null,
    enabled: Boolean(userId),
  })
  return userId && !query.isError ? (query.data ?? null) : null
}
