import { useCallback, useEffect, useState } from 'react'
import { listAdminStoreCouponsFn, mutateAdminStoreCouponFn } from '@/lib/server/store-admin-api'
import { getAuthJWTToken } from '@/lib/jwt'
import { formatDay } from '@/lib/dates'
import { formatMerchPrice } from '@/lib/merch'
import { storeCouponLabel, type StoreCouponView } from '@/lib/store-coupons'
import { HudButton } from '@/components/ui/HudButton'
import { useToast } from '@/components/ui/ToastProvider'

const FIELD = 'block w-full bg-surface-2 border border-line p-2'
const EMPTY = { code: '', kind: 'percent' as 'percent' | 'amount', value: '', expiresAt: '', maxRedemptions: '', minimum: '', oncePerEmail: true }

function usage(coupon: StoreCouponView): string {
  return coupon.maxRedemptions ? `${coupon.timesRedeemed} of ${coupon.maxRedemptions} used` : `${coupon.timesRedeemed} used`
}

/** Store promo codes. Stripe holds them; this only makes, lists and switches store-scoped codes. */
export function AdminStoreCoupons() {
  const [coupons, setCoupons] = useState<StoreCouponView[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const reload = useCallback(async () => {
    try {
      const token = await getAuthJWTToken()
      setCoupons(await listAdminStoreCouponsFn({ data: { token: token ?? undefined } }))
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load promo codes.')
    }
  }, [])
  useEffect(() => { void reload() }, [reload])

  async function mutate(data: { action: 'create' | 'activate' | 'deactivate'; id?: string; coupon?: unknown }, success: string) {
    setBusy(true)
    try {
      const token = await getAuthJWTToken()
      await mutateAdminStoreCouponFn({ data: { ...data, token: token ?? undefined } })
      toast.success(success)
      await reload()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Promo code change failed.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function create() {
    const value = Number(form.value)
    const coupon = {
      code: form.code,
      kind: form.kind,
      value: form.kind === 'percent' ? Math.round(value) : Math.round(value * 100),
      expiresAt: form.expiresAt || null,
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      minimumCents: form.minimum ? Math.round(Number(form.minimum) * 100) : null,
      oncePerEmail: form.oncePerEmail,
    }
    if (await mutate({ action: 'create', coupon }, `Created ${form.code.trim().toUpperCase()}.`)) setForm(EMPTY)
  }

  return (
    <section className="chitin-card p-3 sm:p-4 md:p-5 rounded-card shadow-2xl space-y-4" aria-labelledby="store-coupons-heading">
      <div className="space-y-1">
        <h2 id="store-coupons-heading" className="font-grotesk text-sm font-bold tracking-wider uppercase">Promo codes</h2>
        <p className="text-sm text-ink-body">Codes take money off the items, never shipping or tax. Shoppers enter them before paying. Test-mode codes only work with test payments, so make them again for live.</p>
      </div>

      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void create() }}>
        <label>Code<input required className={`${FIELD} uppercase`} maxLength={32} placeholder="LAUNCH15" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></label>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <label>Type<select className={FIELD} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as 'percent' | 'amount' })}><option value="percent">Percent off</option><option value="amount">Dollars off</option></select></label>
          <label>{form.kind === 'percent' ? 'Percent' : 'Dollars'}<input required type="number" min={form.kind === 'percent' ? 1 : 0.01} max={form.kind === 'percent' ? 100 : 1000} step={form.kind === 'percent' ? 1 : 0.01} className={FIELD} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></label>
        </div>
        <label>Expires after (optional)<input type="date" className={FIELD} value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></label>
        <label>Total uses (optional)<input type="number" min={1} step={1} className={FIELD} value={form.maxRedemptions} onChange={e => setForm({ ...form, maxRedemptions: e.target.value })} /></label>
        <label>Minimum order in dollars (optional)<input type="number" min={0} step={0.01} className={FIELD} value={form.minimum} onChange={e => setForm({ ...form, minimum: e.target.value })} /></label>
        <label className="flex items-center gap-2 self-end pb-2"><input type="checkbox" checked={form.oncePerEmail} onChange={e => setForm({ ...form, oncePerEmail: e.target.checked })} /> One use per email</label>
        <div className="sm:col-span-2"><HudButton type="submit" disabled={busy}>Create code</HudButton></div>
      </form>

      {loadError ? <p className="text-sm text-crimson-text" role="alert">{loadError}</p> : null}
      {coupons && coupons.length === 0 ? <p className="text-sm text-ink-muted">No promo codes yet.</p> : null}
      {coupons && coupons.length > 0 ? (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle" data-testid="store-coupon-list">
          {coupons.map(coupon => (
            <li key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-grotesk font-semibold tracking-wide text-ink">
                  {coupon.code} <span className="font-sans font-normal text-ink-body">· {storeCouponLabel(coupon)}</span>
                  {!coupon.active ? <span className="ml-2 rounded-chip border border-line px-2 text-xs font-normal text-ink-muted">Off</span> : null}
                </p>
                <p className="text-xs text-ink-muted">
                  {[
                    usage(coupon),
                    coupon.expiresAt ? `expires after ${formatDay(coupon.expiresAt, 'UTC')}` : 'no expiry',
                    coupon.minimumCents ? `min ${formatMerchPrice(coupon.minimumCents)}` : null,
                    coupon.oncePerEmail ? 'one per email' : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <HudButton size="sm" variant="secondary" disabled={busy} onClick={() => void mutate({ action: coupon.active ? 'deactivate' : 'activate', id: coupon.id }, coupon.active ? `${coupon.code} turned off.` : `${coupon.code} turned on.`)}>
                {coupon.active ? 'Turn off' : 'Turn on'}
              </HudButton>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
