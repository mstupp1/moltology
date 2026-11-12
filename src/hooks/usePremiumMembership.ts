import { useAuthSession } from '@/hooks/useAuthSession'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { getPremiumMembershipFn } from '@/lib/server/premium-api'
import { accountKeys, authToken, useAppQuery } from '@/lib/query/account'

export type PremiumMembership = { hasPurchasedPremium: boolean; isPremium: boolean }

/**
 * The signed-in member's Premium state, or null while loading, signed out,
 * or when the member cannot open the soft-launch Premium page.
 */
export function usePremiumMembership(): {
  membership: PremiumMembership | null
  canViewPremium: boolean
} {
  const access = useHiddenPageAccess('premium')
  const session = useAuthSession()
  const userId = session.userId
  const enabled = Boolean(userId) && !access.pending && access.canView
  const query = useAppQuery<PremiumMembership | null>({
    queryKey: userId ? accountKeys.premium(userId) : ['account', null, 'premium'],
    queryFn: async () =>
      (await getPremiumMembershipFn({ data: { token: await authToken(), userId: userId! } })) ?? null,
    enabled,
    meta: { persist: true },
  })

  return {
    membership: enabled && !query.isError ? (query.data ?? null) : null,
    canViewPremium: !access.pending && access.canView,
  }
}
