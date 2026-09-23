import React, { useEffect, useRef, useState } from 'react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  PREMIUM_PAGE_COPY,
  listPremiumEntitlements,
  parsePremiumCheckoutSearch,
  premiumStatusMessage,
  type PremiumOffer,
} from '@/lib/premium-membership'
import {
  createPremiumCheckoutFn,
  createPremiumPortalFn,
  getPremiumOfferFn,
  setPremiumAccessFn,
} from '@/lib/server/premium-api'

export function PremiumOfferPanel({
  offer,
  checkout,
  busy,
  onSubscribe,
  onManage,
  onActivate,
  onCancel,
}: {
  offer: PremiumOffer
  checkout?: 'success' | 'cancel'
  busy: 'checkout' | 'portal' | 'grant' | 'cancel' | null
  onSubscribe: () => void
  onManage: () => void
  onActivate: () => void
  onCancel: () => void
}) {
  const entitlements = listPremiumEntitlements(offer.isPremium)
  return (
    <div data-testid="premium-page" className="space-y-3.5 sm:space-y-5 font-sans relative">
      <HudTitlePanel
        title={PREMIUM_PAGE_COPY.title}
        eyebrow={PREMIUM_PAGE_COPY.eyebrow}
        description={PREMIUM_PAGE_COPY.description}
        accent="cyan"
      />

      {checkout === 'success' ? (
        <p data-testid="premium-checkout-success" className="text-sm text-[#dfe3e3]">
          {PREMIUM_PAGE_COPY.checkoutSuccess}
        </p>
      ) : null}
      {checkout === 'cancel' ? (
        <p data-testid="premium-checkout-cancel" className="text-sm text-[#dfe3e3]">
          {PREMIUM_PAGE_COPY.checkoutCancel}
        </p>
      ) : null}

      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
        <div>
          <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">Membership</h2>
          <p className="text-xs text-[#839493] mt-1">{premiumStatusMessage(offer)}</p>
        </div>
        <p className="text-sm text-[#dfe3e3]">
          {offer.priceLabel ?? PREMIUM_PAGE_COPY.pricePending}
        </p>
        {offer.configMessage ? (
          <p data-testid="premium-config-message" className="text-sm text-[#ffb4a8]">
            {offer.configMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {!offer.isPremium ? (
            <HudButton
              type="button"
              onClick={onSubscribe}
              disabled={!offer.configured || busy !== null}
            >
              {busy === 'checkout' ? 'Starting checkout' : PREMIUM_PAGE_COPY.subscribe}
            </HudButton>
          ) : null}
          {!offer.isPremium ? (
            <HudButton type="button" variant="dark" onClick={onActivate} disabled={busy !== null}>
              {busy === 'grant' ? 'Activating' : PREMIUM_PAGE_COPY.activate}
            </HudButton>
          ) : (
            <HudButton type="button" variant="dark" onClick={onCancel} disabled={busy !== null}>
              {busy === 'cancel' ? 'Canceling' : PREMIUM_PAGE_COPY.cancel}
            </HudButton>
          )}
          {offer.canManage ? (
            <HudButton type="button" variant="ghost" onClick={onManage} disabled={busy !== null}>
              {busy === 'portal' ? 'Opening membership' : PREMIUM_PAGE_COPY.manage}
            </HudButton>
          ) : null}
        </div>
        {!offer.isPremium ? <p className="text-xs text-[#839493]">{PREMIUM_PAGE_COPY.activateHint}</p> : null}
      </section>

      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-2">
        <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
          {PREMIUM_PAGE_COPY.benefitsTitle}
        </h2>
        <p className="text-xs text-[#839493]">{PREMIUM_PAGE_COPY.benefitsBody}</p>
        {entitlements.length === 0 ? null : (
          <ul>
            {entitlements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function PremiumView({
  checkout: checkoutProp,
  redirectTo = (url: string) => {
    window.location.assign(url)
  },
}: {
  checkout?: 'success' | 'cancel'
  redirectTo?: (url: string) => void
}) {
  const [checkout, setCheckout] = useState<'success' | 'cancel' | undefined>(checkoutProp)
  const toast = useOptionalToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [offer, setOffer] = useState<PremiumOffer | null>(null)
  const [pending, setPending] = useState(true)
  const [busy, setBusy] = useState<'checkout' | 'portal' | 'grant' | 'cancel' | null>(null)

  useEffect(() => {
    if (checkoutProp) {
      setCheckout(checkoutProp)
      return
    }
    const params = new URLSearchParams(window.location.search)
    setCheckout(parsePremiumCheckoutSearch(params.get('checkout')))
  }, [checkoutProp])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const token = await getAuthJWTToken().catch(() => null)
        const next = await getPremiumOfferFn({ data: { token: token ?? undefined } })
        if (!cancelled) setOffer(next)
      } catch (error) {
        if (!cancelled) {
          toastRef.current?.toast.error(error instanceof Error ? error.message : 'Could not load Premium. Try again.')
        }
      } finally {
        if (!cancelled) setPending(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function activate(action: 'grant' | 'cancel') {
    setBusy(action)
    try {
      const token = await getAuthJWTToken().catch(() => null)
      const next = await setPremiumAccessFn({ data: { token: token ?? undefined, action } })
      setOffer((current) => (current ? { ...current, ...next } : current))
      toast?.toast.success(action === 'grant' ? PREMIUM_PAGE_COPY.activated : PREMIUM_PAGE_COPY.canceled)
    } catch (error) {
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

  async function start(kind: 'checkout' | 'portal') {
    setBusy(kind)
    try {
      const token = await getAuthJWTToken().catch(() => null)
      const fn = kind === 'checkout' ? createPremiumCheckoutFn : createPremiumPortalFn
      const result = await fn({ data: { token: token ?? undefined } })
      redirectTo(result.url)
    } catch (error) {
      toast?.toast.error(
        error instanceof Error
          ? error.message
          : kind === 'checkout'
            ? 'Could not start checkout. Try again.'
            : 'Could not open membership management. Try again.',
      )
      setBusy(null)
    }
  }

  if (pending || !offer) return <HudWorkspaceGhost />

  return (
    <PremiumOfferPanel
      offer={offer}
      checkout={checkout}
      busy={busy}
      onSubscribe={() => void start('checkout')}
      onManage={() => void start('portal')}
      onActivate={() => void activate('grant')}
      onCancel={() => void activate('cancel')}
    />
  )
}
