import { getUserProfileFn } from '@/lib/server/api'
import {
  PROFILE_CHANGE_EVENTS,
  accountKeys,
  authToken,
  useAppQuery,
  useRefetchOnWindowEvents,
} from '@/lib/query/account'

export type AccountProfile = NonNullable<Awaited<ReturnType<typeof getUserProfileFn>>>

/** Query options for one member's profile, for `useAppQuery`, `fetchQuery` or loaders. */
export function accountProfileQuery(userId: string) {
  return {
    queryKey: accountKeys.profile(userId),
    queryFn: async (): Promise<AccountProfile | null> =>
      (await getUserProfileFn({ data: { userId, token: await authToken() } })) ?? null,
    meta: { persist: true },
  }
}

/**
 * The signed-in member's stored profile (character, handle, role, experiments).
 *
 * One cached read shared by the top pill, sidebar, Oracle, Settings and the rest,
 * saved on this device so a returning member paints it on the first frame.
 * `profile` is `undefined` while still unknown (show a placeholder, not a default)
 * and `null` once the server says there is no profile.
 */
export function useAccountProfile(userId: string | null | undefined): {
  profile: AccountProfile | null | undefined
  isLoading: boolean
  refetch: () => Promise<unknown>
} {
  const key = userId ? accountKeys.profile(userId) : null
  const query = useAppQuery<AccountProfile | null>({
    ...accountProfileQuery(userId ?? ''),
    queryKey: key ?? ['account', null, 'profile'],
    enabled: Boolean(userId),
  })
  useRefetchOnWindowEvents(key, PROFILE_CHANGE_EVENTS)

  const known = Boolean(userId) && (query.data !== undefined || query.isError)
  return {
    profile: !userId ? null : query.data !== undefined ? query.data : query.isError ? null : undefined,
    isLoading: Boolean(userId) && !known,
    refetch: query.refetch,
  }
}
