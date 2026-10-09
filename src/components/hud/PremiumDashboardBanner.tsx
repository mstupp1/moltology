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
      className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-cyan-glow mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">{copy.title}</h2>
          <p className="text-xs text-ink-body leading-relaxed">{copy.body}</p>
        </div>
      </div>
      <a
        href="/premium"
        className="inline-flex min-h-[38px] items-center justify-center rounded-control border border-line bg-surface-1 hud-sheen px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-ink hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
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
