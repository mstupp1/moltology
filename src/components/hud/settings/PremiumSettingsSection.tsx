import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PremiumBadge } from '@/components/hud/PremiumBadge'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { useHudPersist } from '@/hooks/useHudPersist'
import { getAuthJWTToken } from '@/lib/jwt'
import { PREMIUM_PAGE_COPY, premiumStatusMessage } from '@/lib/premium-membership'
import { getPremiumMembershipFn, setPremiumAccessFn } from '@/lib/server/premium-api'

type Membership = {
  hasPurchasedPremium: boolean
  isPremium: boolean
}

export function PremiumSettingsSection() {
  const persist = useHudPersist()
  const access = useHiddenPageAccess()
  const toast = useOptionalToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [membership, setMembership] = useState<Membership | null>(null)
  const [busy, setBusy] = useState<'grant' | 'cancel' | null>(null)

  const load = useCallback(async () => {
    try {
      const token = await getAuthJWTToken().catch(() => null)
      const next = await getPremiumMembershipFn({ data: { token: token ?? undefined } })
      setMembership(next ?? { hasPurchasedPremium: false, isPremium: false })
    } catch {
      toastRef.current?.toast.error('Could not load Premium. Try again.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function update(action: 'grant' | 'cancel') {
    if (!membership || busy) return
    const previous = membership
    const optimistic =
      action === 'grant'
        ? { hasPurchasedPremium: true, isPremium: true }
        : { hasPurchasedPremium: true, isPremium: false }
    setMembership(optimistic)
    setBusy(action)
    try {
      await persist.run(action === 'grant' ? 'premium-grant' : 'premium-cancel', async () => {
        const token = await getAuthJWTToken().catch(() => null)
        const next = await setPremiumAccessFn({ data: { token: token ?? undefined, action } })
        setMembership(next)
      })
      toast?.toast.success(action === 'grant' ? PREMIUM_PAGE_COPY.activated : PREMIUM_PAGE_COPY.canceled)
    } catch (error) {
      setMembership(previous)
      toast?.toast.error(
        error instanceof Error
          ? error.message
          : action === 'grant'
            ? 'Could not activate Premium. Try again.'
            : 'Could not cancel Premium. Try again.',
      )
    } finally {
      setBusy(null)
    }
  }

  if (!membership) {
    return (
      <section data-testid="premium-settings" className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl" aria-busy="true">
        <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
          {PREMIUM_PAGE_COPY.settingsTitle}
        </h2>
        <p className="text-xs text-[#839493] mt-1">Loading membership.</p>
      </section>
    )
  }

  return (
    <section data-testid="premium-settings" className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
          {PREMIUM_PAGE_COPY.settingsTitle}
        </h2>
        {membership.isPremium ? <PremiumBadge /> : null}
      </div>
      <p className="text-xs text-[#839493]">{premiumStatusMessage(membership)}</p>
      {access.canView ? (
        membership.isPremium ? (
          <button
            type="button"
            onClick={() => void update('cancel')}
            disabled={busy !== null}
            className="px-4 py-2 border border-[#3a4a49] hover:border-[#00c3ff]/50 text-[#dfe3e3] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40"
          >
            {busy === 'cancel' ? 'Canceling' : PREMIUM_PAGE_COPY.cancel}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[#839493]">{PREMIUM_PAGE_COPY.activateHint}</p>
            <button
              type="button"
              onClick={() => void update('grant')}
              disabled={busy !== null}
              className="px-4 py-2 bg-[#00c3ff]/20 hover:bg-[#00c3ff]/30 border border-[#00c3ff]/60 text-[#00c3ff] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40"
            >
              {busy === 'grant' ? 'Activating' : PREMIUM_PAGE_COPY.purchase}
            </button>
          </div>
        )
      ) : null}
    </section>
  )
}
