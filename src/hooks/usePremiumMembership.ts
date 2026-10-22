import { useEffect, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { getAuthJWTToken } from '@/lib/jwt'
import { getPremiumMembershipFn } from '@/lib/server/premium-api'

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
  const [membership, setMembership] = useState<PremiumMembership | null>(null)

  useEffect(() => {
    if (access.pending || !access.canView || !session.userId) {
      setMembership(null)
      return
    }
    let cancelled = false
    const userId = session.userId
    void (async () => {
      try {
        const token = await getAuthJWTToken().catch(() => null)
        const result = await getPremiumMembershipFn({
          data: { token: token ?? undefined, userId },
        })
        if (!cancelled) setMembership(result)
      } catch {
        if (!cancelled) setMembership(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [access.pending, access.canView, session.userId])

  return { membership, canViewPremium: !access.pending && access.canView }
}
