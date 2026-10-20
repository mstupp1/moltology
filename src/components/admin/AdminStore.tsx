import { useCallback, useEffect, useState } from 'react'
import { getAdminStoreFn, mutateAdminStoreFn } from '@/lib/server/store-admin-api'
import { getAuthJWTToken } from '@/lib/jwt'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { useToast } from '@/components/ui/ToastProvider'
import { formatMerchPrice } from '@/lib/merch'
import type { StoreSettings } from '@/lib/store'
type Payload = Awaited<ReturnType<typeof getAdminStoreFn>>
let cached: Payload | null = null
export function AdminStore() {
  const [payload, setPayload] = useState<Payload | null>(cached)
  const [settings, setSettings] = useState<StoreSettings | null>(cached?.settings ?? null)
  const [reviewOnly, setReviewOnly] = useState(false)
  const [mode, setMode] = useState<'all' | 'test' | 'live'>('all')
  const [query, setQuery] = useState(''), [selected, setSelected] = useState<string | null>(null), [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const reload = useCallback(async () => {
    try { const token = await getAuthJWTToken(); const next = await getAdminStoreFn({ data: { token: token ?? undefined, query, reviewOnly, mode: mode === 'all' ? undefined : mode } }); cached = next; setPayload(next); setSettings(next.settings) }
    catch { toast.error('Could not load store operations.') }
  }, [query, reviewOnly, mode, toast])
  useEffect(() => { void reload() }, [reload])
  async function change(action: 'settings' | 'availability' | 'retry' | 'reconcile', target?: string, value?: unknown) {
    setBusy(true)
    try { const token = await getAuthJWTToken(); await mutateAdminStoreFn({ data: { token: token ?? undefined, action, target, value } }); toast.success('Store operation saved.'); await reload() }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Store operation failed.') }
    finally { setBusy(false) }
  }
  const order = payload?.orders.find(o => o.id === selected)
  const enabled = (id: string, fallback: boolean) => payload?.overrides.find(o => o.id === id)?.enabled ?? fallback
  return <div className="space-y-3.5 sm:space-y-5 font-sans relative">
    <HudTitlePanel title="Store operations" eyebrow="Administration" description="Review payments, draft orders, availability, and delivery. Refunds do not cancel Printful production." />
    {payload && settings && <>
      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3"><h2 className="font-grotesk text-sm font-bold tracking-wider uppercase">Controls</h2>
        <p className="text-sm">Changes apply to new checkouts. Existing drafts require approval in Printful. Test and preview orders always stay drafts.</p>
        <div className="flex flex-wrap gap-4">{(['publicEnabled','indexingEnabled','checkoutPaused','policiesApproved'] as const).map(field => <label key={field}><input type="checkbox" checked={settings[field]} onChange={e => setSettings({ ...settings, [field]: e.target.checked })} /> {({ publicEnabled: 'Public browsing', indexingEnabled: 'Public indexing', checkoutPaused: 'Pause checkout', policiesApproved: 'Business policies approved' })[field]}</label>)}</div>
        <label className="block">Countries (review before enabling)<input className="block bg-surface-2 border border-line p-2" value={settings.enabledCountries.join(',')} onChange={e => setSettings({ ...settings, enabledCountries: e.target.value.toUpperCase().split(',').map(v => v.trim()) })} /></label>
        <label className="block">Production mode <select className="bg-surface-2 p-2" value={settings.fulfillmentMode} onChange={e => setSettings({ ...settings, fulfillmentMode: e.target.value as StoreSettings['fulfillmentMode'] })}><option value="manual">Manual approval</option><option value="automatic">Automatic production for new orders</option></select></label>
        {(['shippingPolicy','returnsPolicy','cancellationPolicy','supportEmail'] as const).map(field => <label className="block" key={field}>{({ shippingPolicy:'Approved shipping information',returnsPolicy:'Approved returns and replacement policy',cancellationPolicy:'Approved cancellation policy',supportEmail:'Customer support email' })[field]}<textarea className="block w-full bg-surface-2 border border-line p-2" value={settings[field]} onChange={e => setSettings({ ...settings, [field]: e.target.value })} /></label>)}
        <HudButton disabled={busy} onClick={() => void change('settings','main',settings)}>Save settings</HudButton>
        <ul className="text-xs">{Object.entries(payload.health).map(([key, value]) => <li key={key}>{key}: {value ? 'configured' : 'missing / disabled'}</li>)}</ul>
      </section>
      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3"><h2 className="font-grotesk text-sm font-bold tracking-wider uppercase">Orders and paid review queue</h2>
        <label>Search orders <input className="bg-surface-2 p-2" value={query} onChange={e => setQuery(e.target.value)} placeholder="Order, email, or Printful ID" /></label>
        <div className="flex flex-wrap gap-4"><label><input type="checkbox" checked={reviewOnly} onChange={e => setReviewOnly(e.target.checked)} /> Paid orders needing review</label><label>Payment mode <select className="bg-surface-2 p-2" value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="all">All modes</option><option value="test">Test</option><option value="live">Live</option></select></label></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Order</th><th>Mode</th><th>Payment</th><th>Fulfillment</th><th>Total</th></tr></thead><tbody>{payload.orders.map(o => <tr key={o.id}><td><button className="text-cyan-glow" onClick={() => setSelected(o.id)}>{o.id.slice(0,8)}</button></td><td>{o.livemode ? 'LIVE' : 'TEST'}</td><td>{o.paymentStatus}</td><td>{o.fulfillmentStatus}</td><td>{formatMerchPrice(o.totalCents)}</td></tr>)}</tbody></table></div>
        {order && <div className="chitin-card-inset p-3 space-y-2"><h3>{order.id}</h3><p>{order.customerEmail}</p><p>{order.fulfillmentError}</p><p>Provider: {order.providerStatus || 'Pending'} · Refund {formatMerchPrice(order.refundCents)}</p><pre className="whitespace-pre-wrap text-xs">{JSON.stringify({ address: order.shippingAddress, items: order.lineItems, quote: order.quoteSnapshot, shipments: order.shipments, subtotal: order.subtotalCents, shipping: order.shippingCents, tax: order.taxCents, total: order.totalCents }, null, 2)}</pre>
          {order.stripePaymentIntentId && <a className="text-cyan-glow mr-3" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/${order.livemode ? '' : 'test/'}payments/${order.stripePaymentIntentId}`}>Stripe payment</a>}
          {!order.stripePaymentIntentId && order.stripeCheckoutSessionId && <a className="text-cyan-glow mr-3" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/${order.livemode ? '' : 'test/'}search?query=${encodeURIComponent(order.stripeCheckoutSessionId)}`}>Find Stripe session</a>}
          {order.printfulOrderId && <a className="text-cyan-glow" target="_blank" rel="noreferrer" href={`https://www.printful.com/dashboard/default/orders?order_id=${order.printfulOrderId}`}>Printful order</a>}
          <div className="flex gap-3"><HudButton disabled={busy || !['paid','processing','fulfillment_failed'].includes(order.fulfillmentStatus)} onClick={() => void change('retry',order.id)}>Verify payment and retry</HudButton><HudButton disabled={busy || !order.printfulOrderId} onClick={() => void change('reconcile',order.id)}>Refresh fulfillment</HudButton></div>
        </div>}
      </section>
      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3"><h2 className="font-grotesk text-sm font-bold tracking-wider uppercase">Catalog availability</h2>{payload.products.map(p => <div className="chitin-card-inset p-3" key={p.id}><label><input type="checkbox" disabled={busy} checked={enabled(p.id,p.isPublished)} onChange={e => void change('availability',p.id,e.target.checked)} /> {p.title}</label><div className="flex flex-wrap gap-4">{payload.variants.filter(v => v.productId === p.id).map(v => <label key={v.id}><input type="checkbox" disabled={busy} checked={enabled(v.id,v.isAvailable)} onChange={e => void change('availability',v.id,e.target.checked)} /> {v.title}</label>)}</div></div>)}</section>
      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl"><h2 className="font-grotesk text-sm font-bold tracking-wider uppercase">Email work and audit</h2><ul>{payload.mail.map(m => <li key={m.key}>{m.key} · {m.attempts} attempts · {m.lastError}</li>)}</ul><ul className="text-xs">{payload.audit.map(a => <li key={a.id}>{String(a.createdAt)} · {a.actor} · {a.action} · {a.target}</li>)}</ul></section>
    </>}
  </div>
}
