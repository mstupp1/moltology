import { useCallback, useEffect, useState } from 'react'
import { Activity, Mail, Settings2, Shirt } from 'lucide-react'
import { getAdminStoreFn, mutateAdminStoreFn } from '@/lib/server/store-admin-api'
import { getAuthJWTToken } from '@/lib/jwt'
import { HudButton } from '@/components/ui/HudButton'
import { useToast } from '@/components/ui/ToastProvider'
import type { StoreSettings } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ADMIN_CARD, ADMIN_FIELD, ADMIN_LABEL, AdminCardHeading, AdminSwitch } from './admin-ui'
import { AdminStoreCoupons } from './AdminStoreCoupons'

type Payload = Awaited<ReturnType<typeof getAdminStoreFn>>
let cached: Payload | null = null

const SWITCHES: { field: 'publicEnabled' | 'orderingOpen' | 'indexingEnabled' | 'checkoutPaused' | 'policiesApproved'; label: string; hint: string }[] = [
  { field: 'publicEnabled', label: 'Public browsing', hint: 'Anyone can open the store.' },
  { field: 'orderingOpen', label: 'Ordering open to everyone', hint: 'Off: visitors see "Unavailable right now". Admins can still order to test.' },
  { field: 'indexingEnabled', label: 'Public indexing', hint: 'Search engines may list store pages.' },
  { field: 'checkoutPaused', label: 'Pause checkout', hint: 'Stops everyone, admins included.' },
  { field: 'policiesApproved', label: 'Business policies approved', hint: 'The policies below have been reviewed.' },
]

const POLICIES: { field: 'shippingPolicy' | 'returnsPolicy' | 'cancellationPolicy'; label: string }[] = [
  { field: 'shippingPolicy', label: 'Shipping information' },
  { field: 'returnsPolicy', label: 'Returns and replacements' },
  { field: 'cancellationPolicy', label: 'Cancellations' },
]

const HEALTH_LABELS: Record<string, string> = {
  liveAuthorized: 'Live payments authorized',
  publicAuthorized: 'Public launch authorized',
  emailConfigured: 'Order email (Resend)',
  supportConfigured: 'Support inbox',
  recoveryConfigured: 'Order recovery job',
  printfulCallbackConfigured: 'Printful webhook',
  statusConfigured: 'Status checks',
  autoProductionConfigured: 'Automatic production',
}

function stamp(value: unknown): string {
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 16).replace('T', ' ')
}

export function AdminStore() {
  const [payload, setPayload] = useState<Payload | null>(cached)
  const [settings, setSettings] = useState<StoreSettings | null>(cached?.settings ?? null)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const reload = useCallback(async () => {
    try {
      const token = await getAuthJWTToken()
      const next = await getAdminStoreFn({ data: { token: token ?? undefined } })
      cached = next
      setPayload(next)
      setSettings(next.settings)
    } catch {
      toast.error('Could not load store operations.')
    }
  }, [toast])
  useEffect(() => {
    void reload()
  }, [reload])
  async function change(action: 'settings' | 'availability', target?: string, value?: unknown) {
    setBusy(true)
    try {
      const token = await getAuthJWTToken()
      await mutateAdminStoreFn({ data: { token: token ?? undefined, action, target, value } })
      toast.success('Store operation saved.')
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Store operation failed.')
    } finally {
      setBusy(false)
    }
  }
  const enabled = (id: string, fallback: boolean) => payload?.overrides.find((o) => o.id === id)?.enabled ?? fallback
  const dirty = Boolean(payload && settings && JSON.stringify(settings) !== JSON.stringify(payload.settings))

  // Lives under the order list in the Store tab of /admin (it was its own page at /admin/store).
  return (
    <div id="admin-store-settings" className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans scroll-mt-20" data-testid="admin-store-settings">
      <header className="space-y-1 pt-2">
        <h2 className="font-grotesk text-lg font-bold text-ink">Store settings</h2>
        <p className="text-xs text-ink-muted">Checkout switches, policies, promo codes, catalog availability and the email queue.</p>
      </header>
      {payload && settings ? (
        <>
          <section className={ADMIN_CARD} aria-labelledby="store-controls-heading">
            <AdminCardHeading
              icon={<Settings2 />}
              title={<span id="store-controls-heading">Controls</span>}
              description="Changes apply to new checkouts. Existing drafts need approval in Printful. Test and preview orders always stay drafts."
            />
            <ul className="divide-y divide-line-subtle border-y border-line-subtle">
              {SWITCHES.map(({ field, label, hint }) => (
                <li key={field} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="text-xs text-ink-muted">{hint}</p>
                  </div>
                  <AdminSwitch
                    checked={settings[field]}
                    label={label}
                    onChange={(next) => setSettings({ ...settings, [field]: next })}
                  />
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className={ADMIN_LABEL}>Countries (review before enabling)</span>
                <input
                  className={cn(ADMIN_FIELD, 'w-full uppercase')}
                  value={settings.enabledCountries.join(',')}
                  onChange={(e) =>
                    setSettings({ ...settings, enabledCountries: e.target.value.toUpperCase().split(',').map((v) => v.trim()) })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={ADMIN_LABEL}>Production mode</span>
                <select
                  className={cn(ADMIN_FIELD, 'w-full')}
                  value={settings.fulfillmentMode}
                  onChange={(e) => setSettings({ ...settings, fulfillmentMode: e.target.value as StoreSettings['fulfillmentMode'] })}
                >
                  <option value="manual">Manual approval</option>
                  <option value="automatic">Automatic production for new orders</option>
                </select>
              </label>
              {POLICIES.map(({ field, label }) => (
                <label key={field} className="space-y-1 sm:col-span-2">
                  <span className={ADMIN_LABEL}>{label}</span>
                  <textarea
                    rows={3}
                    className={cn(ADMIN_FIELD, 'block w-full py-2 leading-relaxed')}
                    value={settings[field]}
                    onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
                  />
                </label>
              ))}
              <label className="space-y-1">
                <span className={ADMIN_LABEL}>Customer support email</span>
                <input
                  type="email"
                  className={cn(ADMIN_FIELD, 'w-full')}
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HudButton disabled={busy || !dirty} onClick={() => void change('settings', 'main', settings)}>
                Save settings
              </HudButton>
              {dirty ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-ink-muted hover:text-ink"
                  onClick={() => setSettings(payload.settings)}
                >
                  Discard changes
                </button>
              ) : null}
            </div>
          </section>

          <section className={ADMIN_CARD} aria-label="Store health">
            <AdminCardHeading icon={<Activity />} title="Setup" description="Server settings the store relies on. Change these in Vercel." />
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2" data-testid="admin-store-health">
              {Object.entries(payload.health).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2 text-xs">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', value ? 'bg-emerald-500' : 'bg-amber-500')} aria-hidden />
                  <span className="text-ink-body">{HEALTH_LABELS[key] ?? key}</span>
                  <span className={cn('ml-auto font-semibold', value ? 'text-emerald-400' : 'text-amber-400')}>
                    {value ? 'Ready' : 'Off'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <AdminStoreCoupons />

          <section className={ADMIN_CARD} aria-label="Catalog availability">
            <AdminCardHeading
              icon={<Shirt />}
              title="Catalog availability"
              description="Turn a product or a single size off without unpublishing it."
            />
            <ul className="divide-y divide-line-subtle border-y border-line-subtle">
              {payload.products.map((p) => {
                const productOn = enabled(p.id, p.isPublished)
                const variants = payload.variants.filter((v) => v.productId === p.id)
                return (
                  <li key={p.id} className="space-y-2 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className={cn('text-sm font-semibold', productOn ? 'text-ink' : 'text-ink-muted')}>{p.title}</p>
                      <AdminSwitch
                        checked={productOn}
                        disabled={busy}
                        label={p.title}
                        onChange={(next) => void change('availability', p.id, next)}
                      />
                    </div>
                    {variants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${p.title} options`}>
                        {variants.map((v) => {
                          const on = enabled(v.id, v.isAvailable)
                          return (
                            <button
                              key={v.id}
                              type="button"
                              aria-pressed={on}
                              disabled={busy}
                              onClick={() => void change('availability', v.id, !on)}
                              className={cn(
                                'min-h-8 rounded-control border px-2.5 text-xs transition-colors disabled:opacity-40',
                                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                                on
                                  ? 'border-line bg-surface-2 text-ink hover:border-line-hover'
                                  : 'border-line-subtle text-ink-muted line-through hover:text-ink-body',
                              )}
                            >
                              {v.title}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className={ADMIN_CARD} aria-label="Email work and audit">
            <AdminCardHeading icon={<Mail />} title="Email queue and audit" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <h3 className={ADMIN_LABEL}>Unsent email</h3>
                {payload.mail.length === 0 ? (
                  <p className="text-xs text-ink-muted">Nothing waiting to send.</p>
                ) : (
                  <ul className="divide-y divide-line-subtle text-xs">
                    {payload.mail.map((m) => (
                      <li key={m.key} className="py-1.5">
                        <p className="font-semibold text-ink break-all">{m.key}</p>
                        <p className="text-ink-muted">
                          {m.attempts} attempts{m.lastError ? ` · ${m.lastError}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <h3 className={ADMIN_LABEL}>Recent changes</h3>
                {payload.audit.length === 0 ? (
                  <p className="text-xs text-ink-muted">No changes logged yet.</p>
                ) : (
                  <ul className="divide-y divide-line-subtle text-xs">
                    {payload.audit.map((a) => (
                      <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-1.5">
                        <span className="text-ink-muted tabular-nums">{stamp(a.createdAt)}</span>
                        <span className="min-w-0 truncate text-ink-body" title={`${a.actor} · ${a.action} · ${a.target}`}>
                          {a.action} · {a.target}
                          <span className="text-ink-muted"> · {a.actor}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
