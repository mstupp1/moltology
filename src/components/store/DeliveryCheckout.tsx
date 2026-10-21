import { useEffect, useState } from 'react'
import { checkStorePromoFn, createMerchCheckoutSessionFn, getStoreAccessFn, quoteStoreShippingFn } from '@/lib/server/merch-api'
import { getAuthJWTToken } from '@/lib/jwt'
import { storeDeliverySchema } from '@/lib/store'
import { formatMerchPrice, type CheckoutLineRequest } from '@/lib/merch'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
export function DeliveryCheckout({ items, clearCart, testing = false, close }: { items: CheckoutLineRequest[]; clearCart: boolean; testing?: boolean; close: () => void }) {
  const [email, setEmail] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [address, setAddress] = useState({ name: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US', phone: '' })
  const [access, setAccess] = useState<Awaited<ReturnType<typeof getStoreAccessFn>> | null>(null)
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof quoteStoreShippingFn>> | null>(null)
  const [promoInput, setPromoInput] = useState(''), [promo, setPromo] = useState<Awaited<ReturnType<typeof checkStorePromoFn>> | null>(null)
  const [promoError, setPromoError] = useState(''), [promoBusy, setPromoBusy] = useState(false)
  const toast = useOptionalToast()
  useEffect(() => { void getStoreAccessFn().then(setAccess).catch(() => setError('Could not load shipping destinations.')) }, [])
  const binding = JSON.stringify({ items, address, email })
  useEffect(() => { setQuote(null) }, [binding])
  // The estimate depends on the cart and the once-per-email rule, so check again after either changes.
  useEffect(() => { setPromo(null) }, [JSON.stringify({ items, email })])
  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoError(''); setPromoBusy(true)
    try {
      const token = await getAuthJWTToken()
      setPromo(await checkStorePromoFn({ data: { email, items, code: promoInput, token: token ?? undefined } }))
    } catch (e) { setPromo(null); setPromoError(e instanceof Error ? e.message : 'That promo code is not valid.') }
    finally { setPromoBusy(false) }
  }
  async function submit(pay: boolean) {
    const parsed = storeDeliverySchema.safeParse({ email, address, items })
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Check your delivery details.'); return }
    setError(''); setBusy(true)
    try {
      const token = await getAuthJWTToken()
      if (!pay) { setQuote(await quoteStoreShippingFn({ data: { ...parsed.data, token: token ?? undefined } })); return }
      if (!quote) throw new Error('Quote shipping before payment.')
      const checkout = await createMerchCheckoutSessionFn({ data: { ...parsed.data, token: token ?? undefined, quoteId: quote.id, promoCode: promo?.code } })
      if (clearCart) window.sessionStorage.setItem('moltology.merch.pendingClear', JSON.stringify({ orderId: checkout.orderId, items }))
      window.location.assign(checkout.url)
    } catch (e) { const message = e instanceof Error ? e.message : 'Checkout could not start.'; setError(message); toast?.toast.error(message, { id: 'store-delivery' }); setQuote(null) }
    finally { setBusy(false) }
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) close() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [close, busy])
  return <div className="fixed inset-0 z-[90] bg-abyss/90 overflow-y-auto p-4 flex items-start justify-center"><section role="dialog" aria-modal="true" aria-labelledby="delivery-title" className="w-full max-w-xl bg-surface-1 border border-line p-5 my-8 space-y-4">
    <div className="flex justify-between"><h2 id="delivery-title" className="font-grotesk text-xl">Delivery and shipping</h2><button disabled={busy} onClick={close} aria-label="Close delivery details">Close</button></div>
    {testing && <p className="rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink-body" data-testid="store-test-ordering">Test ordering. Ordering is closed to members, so only admins can get this far.</p>}
    <p className="text-sm text-ink-muted">Enter your delivery details to get a shipping quote. To change the delivery address, return here for a new quote.</p>
    <form className="grid grid-cols-2 gap-3" onSubmit={e => { e.preventDefault(); void submit(Boolean(quote)) }}>
      <label className="col-span-2">Email<input autoFocus required type="email" autoComplete="email" className="w-full bg-surface-2 border border-line p-2" value={email} onChange={e => setEmail(e.target.value)} /></label>
      {(['name','line1','line2','city','state','postalCode','phone'] as const).map(field => <label key={field} className={['name','line1','line2'].includes(field) ? 'col-span-2' : ''}>{({ name:'Recipient name',line1:'Street address',line2:'Apartment / suite (optional)',city:'City',state:'State / province',postalCode:'ZIP / postal code',phone:'Phone (optional)' })[field]}<input required={!['line2','phone'].includes(field)} maxLength={150} autoComplete={({name:'shipping name',line1:'shipping address-line1',line2:'shipping address-line2',city:'shipping address-level2',state:'shipping address-level1',postalCode:'shipping postal-code',phone:'shipping tel'})[field]} className="w-full bg-surface-2 border border-line p-2" value={address[field]} onChange={e => setAddress({ ...address, [field]: field === 'state' && address.country === 'US' ? e.target.value.toUpperCase() : e.target.value })} /></label>)}
      <label>Country<select className="w-full bg-surface-2 p-2" value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })}>{(access?.countries ?? ['US']).map(c => <option key={c}>{c}</option>)}</select></label>
      <div className="col-span-2">
        <label htmlFor="store-promo">Promo code (optional)</label>
        <div className="mt-1 flex gap-2">
          <input id="store-promo" autoComplete="off" spellCheck={false} maxLength={32} className="min-w-0 flex-1 bg-surface-2 border border-line p-2 uppercase" value={promoInput} onChange={e => { setPromoInput(e.target.value); setPromo(null); setPromoError('') }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void applyPromo() } }} />
          <HudButton type="button" variant="secondary" disabled={promoBusy || !promoInput.trim() || !email} onClick={() => void applyPromo()}>{promoBusy ? 'Checking…' : 'Apply'}</HudButton>
        </div>
        {!email && promoInput.trim() && !promo && <p className="mt-1 text-xs text-ink-muted">Enter your email first.</p>}
        {promoError && <p className="mt-1 text-sm text-crimson-text" role="alert">{promoError}</p>}
        {promo && <p className="mt-1 text-sm text-ink-body" data-testid="store-promo-applied">{promo.code}: {promo.label}, about {formatMerchPrice(promo.discountCents)} off your items. Shipping and tax aren't discounted. <button type="button" className="text-cyan-glow hover:underline" onClick={() => { setPromo(null); setPromoInput('') }}>Remove</button></p>}
      </div>
      {error && <p className="col-span-2 text-red-400" role="alert">{error}</p>}
      {quote && <p className="col-span-2">{quote.service}: {formatMerchPrice(quote.amountCents)}. Quote valid for ten minutes. Tax is calculated at payment.</p>}
      <div className="col-span-2"><HudButton type="submit" disabled={busy || access?.checkoutPaused}>{busy ? 'Checking…' : quote ? 'Continue to Stripe payment' : 'Get shipping quote'}</HudButton></div>
    </form>
    {access?.shippingPolicy && <p className="text-sm">{access.shippingPolicy}</p>}
    {access?.returnsPolicy && <p className="text-sm">{access.returnsPolicy}</p>}
    {access?.cancellationPolicy && <p className="text-sm">{access.cancellationPolicy}</p>}
    {access?.supportEmail && <a className="text-cyan-glow" href={`mailto:${access.supportEmail}`}>{access.supportEmail}</a>}
  </section></div>
}
