import React, { useCallback, useEffect, useState } from 'react'
import { Copy, Share2 } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { useToast } from '@/components/ui/ToastProvider'
import { getAuthJWTToken } from '@/lib/jwt'
import { getReferralSummaryFn } from '@/lib/server/api'
import { invitePath, REFERRAL_MONTHLY_CAP, REFERRAL_XP, type ReferralSummary } from '@/lib/referrals'

const STATUS_LABELS = { pending: 'Pending', qualified: 'Qualified · reward pending', rewarded: `+${REFERRAL_XP} XP`, cap_reached: 'Qualified · monthly limit reached' }

export function ReferralPanel() {
  const [summary, setSummary] = useState<ReferralSummary | null>(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const { toast } = useToast()
  const refresh = useCallback(async () => {
    setError(false)
    try {
      const token = await getAuthJWTToken()
      setSummary(await getReferralSummaryFn({ data: { token: token ?? undefined } }))
    } catch { setError(true) }
  }, [])
  useEffect(() => {
    setCanShare(typeof navigator.share === 'function')
    void refresh()
  }, [refresh])

  const share = async (native: boolean) => {
    if (!summary || busy) return
    setBusy(true)
    try {
      const url = new URL(invitePath(summary.userId), window.location.origin).href
      if (native) {
        await navigator.share({ title: 'Join me on Moltology', text: 'Add me as a friend after signing up.', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Invite link copied.')
      }
    } catch (err) {
      const cancelled = typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError'
      if (!cancelled) toast.error('Could not share your invitation. Please try copying the link.')
    } finally { setBusy(false) }
  }

  return (
    <section aria-labelledby="referral-title" className="border-t border-line-subtle pt-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 id="referral-title" className="font-grotesk text-sm font-bold text-ink">Invite a friend</h2>
          <p className="text-xs text-ink-muted leading-relaxed max-w-xl">
            Earn {REFERRAL_XP} XP when a new member joins through your link, creates their character and username, and completes their first liturgy.
            {' '}Up to {REFERRAL_MONTHLY_CAP} rewards per calendar month (UTC).
          </p>
          <p className="text-xs text-ink-muted">Your link opens your profile after signup. They choose whether to send you a friend request.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <HudButton type="button" size="sm" variant="primary" disabled={!summary || busy} onClick={() => void share(false)} icon={<Copy className="w-3.5 h-3.5" />}>Copy invite link</HudButton>
          {canShare && <HudButton type="button" size="sm" variant="secondary" disabled={!summary || busy} onClick={() => void share(true)} icon={<Share2 className="w-3.5 h-3.5" />}>Share</HudButton>}
        </div>
      </div>
      {error ? <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        Could not load invitations. <HudButton type="button" variant="ghost" size="sm" onClick={() => void refresh()}>Try again</HudButton>
      </div> : summary && <>
        <p className="text-xs text-cyan-glow border-t border-line-subtle pt-3">
          {summary.rewardedThisMonth} of {REFERRAL_MONTHLY_CAP} rewards this month · {summary.totalXp} referral XP earned
        </p>
        {summary.referrals.length > 0 && <details className="text-xs text-ink-muted">
          <summary className="cursor-pointer focus-visible:outline focus-visible:outline-cyan-glow">Recent referrals</summary>
          <p className="mt-2">Pending referrals still need to finish their character, username, or first liturgy.</p>
          <ul className="mt-2 space-y-2">
            {summary.referrals.map((referral) => <li key={referral.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-line-subtle pt-2">
              <span className="break-all text-ink">{referral.displayName}</span><span>{STATUS_LABELS[referral.status]}</span>
            </li>)}
          </ul>
        </details>}
      </>}
    </section>
  )
}
