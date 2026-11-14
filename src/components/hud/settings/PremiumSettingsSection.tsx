import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PremiumBadge } from '@/components/hud/PremiumBadge'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { HudButton } from '@/components/ui/HudButton'
import { SettingsCard } from './settings-ui'
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
  const access = useHiddenPageAccess('premium')
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
      toastRef.current?.toast.error('Could not load Oracle MAX. Try again.')
    }
  }, [])

  useEffect(() => {
    if (!access.pending && access.canView) void load()
  }, [load, access.pending, access.canView])

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
            ? 'Could not activate Oracle MAX. Try again.'
            : 'Could not cancel Oracle MAX. Try again.',
      )
    } finally {
      setBusy(null)
    }
  }

  if (access.pending || !access.canView) return null

  if (!membership) {
    return (
      <SettingsCard
        data-testid="premium-settings"
        aria-busy="true"
        title={PREMIUM_PAGE_COPY.settingsTitle}
        description="Loading membership."
      />
    )
  }

  return (
    <SettingsCard
      data-testid="premium-settings"
      title={PREMIUM_PAGE_COPY.settingsTitle}
      titleExtra={membership.isPremium ? <PremiumBadge /> : null}
      description={premiumStatusMessage(membership)}
    >
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
    </SettingsCard>
  )
}
