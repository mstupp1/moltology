import { useEffect, useState } from 'react'
import { createMerchCheckoutSessionFn, getStoreAccessFn, quoteStoreShippingFn } from '@/lib/server/merch-api'
import { getAuthJWTToken } from '@/lib/jwt'
import { storeDeliverySchema } from '@/lib/store'
import { formatMerchPrice, type CheckoutLineRequest } from '@/lib/merch'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
export function DeliveryCheckout({ items, clearCart, close }: { items: CheckoutLineRequest[]; clearCart: boolean; close: () => void }) {
  const [email, setEmail] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [address, setAddress] = useState({ name: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US', phone: '' })
  const [access, setAccess] = useState<Awaited<ReturnType<typeof getStoreAccessFn>> | null>(null)
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof quoteStoreShippingFn>> | null>(null)
  const toast = useOptionalToast()
  useEffect(() => { void getStoreAccessFn().then(setAccess).catch(() => setError('Could not load shipping destinations.')) }, [])
  const binding = JSON.stringify({ items, address, email })
  useEffect(() => { setQuote(null) }, [binding])
  async function submit(pay: boolean) {
    const parsed = storeDeliverySchema.safeParse({ email, address, items })
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Check your delivery details.'); return }
    setError(''); setBusy(true)
    try {
      const token = await getAuthJWTToken()
      if (!pay) { setQuote(await quoteStoreShippingFn({ data: { ...parsed.data, token: token ?? undefined } })); return }
      if (!quote) throw new Error('Quote shipping before payment.')
      const checkout = await createMerchCheckoutSessionFn({ data: { ...parsed.data, token: token ?? undefined, quoteId: quote.id } })
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
    <p className="text-sm text-ink-muted">Enter your delivery details to get a shipping quote. To change the delivery address, return here for a new quote.</p>
    <form className="grid grid-cols-2 gap-3" onSubmit={e => { e.preventDefault(); void submit(Boolean(quote)) }}>
      <label className="col-span-2">Email<input autoFocus required type="email" autoComplete="email" className="w-full bg-surface-2 border border-line p-2" value={email} onChange={e => setEmail(e.target.value)} /></label>
      {(['name','line1','line2','city','state','postalCode','phone'] as const).map(field => <label key={field} className={['name','line1','line2'].includes(field) ? 'col-span-2' : ''}>{({ name:'Recipient name',line1:'Street address',line2:'Apartment / suite (optional)',city:'City',state:'State / province',postalCode:'ZIP / postal code',phone:'Phone (optional)' })[field]}<input required={!['line2','phone'].includes(field)} maxLength={150} autoComplete={({name:'shipping name',line1:'shipping address-line1',line2:'shipping address-line2',city:'shipping address-level2',state:'shipping address-level1',postalCode:'shipping postal-code',phone:'shipping tel'})[field]} className="w-full bg-surface-2 border border-line p-2" value={address[field]} onChange={e => setAddress({ ...address, [field]: field === 'state' && address.country === 'US' ? e.target.value.toUpperCase() : e.target.value })} /></label>)}
      <label>Country<select className="w-full bg-surface-2 p-2" value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })}>{(access?.countries ?? ['US']).map(c => <option key={c}>{c}</option>)}</select></label>
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
