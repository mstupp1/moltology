import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { getAuthJWTToken } from '@/lib/jwt'
import { premiumBannerCopy, shouldShowPremiumDashboardBanner } from '@/lib/premium-membership'
import { getPremiumMembershipFn } from '@/lib/server/premium-api'

export function PremiumBanner({ hasPurchasedPremium }: { hasPurchasedPremium: boolean }) {
  const copy = premiumBannerCopy(hasPurchasedPremium)
  return (
    <div
      data-testid="premium-dashboard-banner"
      className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl border border-[#3a4a49] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#00ffff] mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">{copy.title}</h2>
          <p className="text-xs text-[#839493] leading-relaxed">{copy.body}</p>
        </div>
      </div>
      <a
        href="/premium"
        className="inline-flex min-h-[38px] items-center justify-center border border-[#00c3ff] bg-[#05222b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#00c3ff]/20"
      >
        {copy.action}
      </a>
    </div>
  )
}

/**
 * Dashboard upsell for free and lapsed members. Hidden for current Premium,
 * and hidden from members who cannot open the soft-launch page.
 */
export function PremiumDashboardBanner() {
  const access = useHiddenPageAccess()
  const session = useAuthSession()
  const [membership, setMembership] = useState<{ hasPurchasedPremium: boolean; isPremium: boolean } | null>(null)

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

  if (!membership || !shouldShowPremiumDashboardBanner({ ...membership, canViewHiddenPages: access.canView })) {
    return null
  }
  return <PremiumBanner hasPurchasedPremium={membership.hasPurchasedPremium} />
}
