import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getAdminStoreFn, mutateAdminStoreFn } from '@/lib/server/store-admin-api'
import { getAuthJWTToken } from '@/lib/jwt'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { useToast } from '@/components/ui/ToastProvider'
import type { StoreSettings } from '@/lib/store'
import { AdminStoreCoupons } from './AdminStoreCoupons'
type Payload = Awaited<ReturnType<typeof getAdminStoreFn>>
let cached: Payload | null = null
export function AdminStore() {
  const [payload, setPayload] = useState<Payload | null>(cached)
  const [settings, setSettings] = useState<StoreSettings | null>(cached?.settings ?? null)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const reload = useCallback(async () => {
    try { const token = await getAuthJWTToken(); const next = await getAdminStoreFn({ data: { token: token ?? undefined } }); cached = next; setPayload(next); setSettings(next.settings) }
    catch { toast.error('Could not load store operations.') }
  }, [toast])
  useEffect(() => { void reload() }, [reload])
  async function change(action: 'settings' | 'availability', target?: string, value?: unknown) {
    setBusy(true)
    try { const token = await getAuthJWTToken(); await mutateAdminStoreFn({ data: { token: token ?? undefined, action, target, value } }); toast.success('Store operation saved.'); await reload() }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Store operation failed.') }
    finally { setBusy(false) }
  }
  const enabled = (id: string, fallback: boolean) => payload?.overrides.find(o => o.id === id)?.enabled ?? fallback
  return <div className="space-y-3.5 sm:space-y-5 font-sans relative">
    <HudTitlePanel title="Store settings" eyebrow="Administration" description="Checkout switches, policies, promo codes, catalog availability, and the email queue." />
    <p className="text-sm text-ink-body">Looking for orders? They are in the <Link to="/admin" search={{ tab: 'shop' }} className="text-cyan-glow hover:underline">Shop tab on the admin page</Link>. <Link to="/store" className="text-cyan-glow hover:underline">Open storefront</Link></p>
    {payload && settings && <>
      <section className="chitin-card p-3 sm:p-4 md:p-5 rounded-card shadow-2xl space-y-3"><h2 className="font-grotesk text-sm font-bold tracking-wider uppercase">Controls</h2>
        <p className="text-sm">Changes apply to new checkouts. Existing drafts require approval in Printful. Test and preview orders always stay drafts.</p>
        <div className="flex flex-wrap gap-4">{(['publicEnabled','orderingOpen','indexingEnabled','checkoutPaused','policiesApproved'] as const).map(field => <label key={field}><input type="checkbox" checked={settings[field]} onChange={e => setSettings({ ...settings, [field]: e.target.checked })} /> {({ publicEnabled: 'Public browsing', orderingOpen: 'Ordering open to everyone', indexingEnabled: 'Public indexing', checkoutPaused: 'Pause checkout', policiesApproved: 'Business policies approved' })[field]}</label>)}</div>
        <p className="text-xs text-ink-muted">With ordering closed, visitors can browse but see "Unavailable right now". Admins can still order to test. Pause checkout stops everyone, admins included.</p>
        <label className="block">Countries (review before enabling)<input className="block bg-surface-2 border border-line p-2" value={settings.enabledCountries.join(',')} onChange={e => setSettings({ ...settings, enabledCountries: e.target.value.toUpperCase().split(',').map(v => v.trim()) })} /></label>
        <label className="block">Production mode <select className="bg-surface-2 p-2" value={settings.fulfillmentMode} onChange={e => setSettings({ ...settings, fulfillmentMode: e.target.value as StoreSettings['fulfillmentMode'] })}><option value="manual">Manual approval</option><option value="automatic">Automatic production for new orders</option></select></label>
        {(['shippingPolicy','returnsPolicy','cancellationPolicy','supportEmail'] as const).map(field => <label className="block" key={field}>{({ shippingPolicy:'Approved shipping information',returnsPolicy:'Approved returns and replacement policy',cancellationPolicy:'Approved cancellation policy',supportEmail:'Customer support email' })[field]}<textarea className="block w-full bg-surface-2 border border-line p-2" value={settings[field]} onChange={e => setSettings({ ...settings, [field]: e.target.value })} /></label>)}
        <HudButton disabled={busy} onClick={() => void change('settings','main',settings)}>Save settings</HudButton>
        <ul className="text-xs">{Object.entries(payload.health).map(([key, value]) => <li key={key}>{key}: {value ? 'configured' : 'missing / disabled'}</li>)}</ul>
      </section>
      <AdminStoreCoupons />
      <section className="chitin-card p-3 sm:p-4 md:p-5 rounded-card shadow-2xl space-y-3"><h2 className="font-grotesk text-sm font-bold tracking-wider uppercase">Catalog availability</h2>{payload.products.map(p => <div className="chitin-card-inset p-3" key={p.id}><label><input type="checkbox" disabled={busy} checked={enabled(p.id,p.isPublished)} onChange={e => void change('availability',p.id,e.target.checked)} /> {p.title}</label><div className="flex flex-wrap gap-4">{payload.variants.filter(v => v.productId === p.id).map(v => <label key={v.id}><input type="checkbox" disabled={busy} checked={enabled(v.id,v.isAvailable)} onChange={e => void change('availability',v.id,e.target.checked)} /> {v.title}</label>)}</div></div>)}</section>
      <section className="chitin-card p-3 sm:p-4 md:p-5 rounded-card shadow-2xl"><h2 className="font-grotesk text-sm font-bold tracking-wider uppercase">Email work and audit</h2><ul>{payload.mail.map(m => <li key={m.key}>{m.key} · {m.attempts} attempts · {m.lastError}</li>)}</ul><ul className="text-xs">{payload.audit.map(a => <li key={a.id}>{String(a.createdAt)} · {a.actor} · {a.action} · {a.target}</li>)}</ul></section>
    </>}
  </div>
}
