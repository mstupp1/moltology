import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PremiumBadge } from '@/components/hud/PremiumBadge'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { HudButton } from '@/components/ui/HudButton'
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
      <section data-testid="premium-settings" className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 md:p-5" aria-busy="true">
        <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">
          {PREMIUM_PAGE_COPY.settingsTitle}
        </h2>
        <p className="text-xs text-ink-muted mt-1">Loading membership.</p>
      </section>
    )
  }

  return (
    <section data-testid="premium-settings" className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 md:p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">
          {PREMIUM_PAGE_COPY.settingsTitle}
        </h2>
        {membership.isPremium ? <PremiumBadge /> : null}
      </div>
      <p className="text-xs text-ink-muted">{premiumStatusMessage(membership)}</p>
      {access.canView ? (
        membership.isPremium ? (
          <HudButton
            type="button"
            variant="danger"
            size="md"
            onClick={() => void update('cancel')}
            disabled={busy !== null}
          >
            {busy === 'cancel' ? 'Canceling' : PREMIUM_PAGE_COPY.cancel}
          </HudButton>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-ink-muted">{PREMIUM_PAGE_COPY.activateHint}</p>
            <HudButton
              type="button"
              variant="secondary"
              size="md"
              onClick={() => void update('grant')}
              disabled={busy !== null}
            >
              {busy === 'grant' ? 'Activating' : PREMIUM_PAGE_COPY.purchase}
            </HudButton>
          </div>
        )
      ) : null}
    </section>
  )
}
