import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUpRight, ExternalLink, Package, RefreshCw, Search } from 'lucide-react'
import { ADMIN_CARD, ADMIN_FIELD, AdminCardHeading, AdminSwitch, QUIET_LINK } from '@/components/admin/admin-ui'
import { BandStat } from '@/components/hud/BandSectionNav'
import { pillTabClass } from '@/components/ui/pillTab'
import { cn } from '@/lib/utils'
import { HudButton } from '@/components/ui/HudButton'
import { LoadMoreButton } from '@/components/ui/LoadMoreButton'
import { mergeById } from '@/lib/pagination'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { getAuthJWTToken } from '@/lib/jwt'
import { formatMerchPrice } from '@/lib/merch'
import { listAdminShopOrdersFn, mutateAdminStoreFn } from '@/lib/server/store-admin-api'
import {
  shopOrderNeedsAttention,
  shopPaymentLabel,
  shopShippingLabel,
  type ShopOrderFilter,
  type ShopOrderTone,
} from '@/lib/shop-orders'

type Payload = Awaited<ReturnType<typeof listAdminShopOrdersFn>>
type ShopOrder = Payload['orders'][number]

const FILTERS: { id: ShopOrderFilter; label: string }[] = [
  { id: 'attention', label: 'Needs attention' },
  { id: 'paid', label: 'Paid' },
  { id: 'all', label: 'All' },
]

const TONE_CLASS: Record<ShopOrderTone, string> = {
  ok: 'text-emerald-400',
  wait: 'text-amber-400',
  bad: 'text-crimson-text',
  muted: 'text-ink-muted',
}

const RETRYABLE = ['paid', 'processing', 'fulfillment_failed']

function orderNumber(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function shortDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10)
}

function itemSummary(order: ShopOrder) {
  if (!order.lineItems.length) return 'No items'
  const [first, ...rest] = order.lineItems
  const head = `${first.quantity} × ${first.productTitle}`
  return rest.length ? `${head} +${rest.length} more` : head
}

function stripeHref(order: ShopOrder) {
  const base = `https://dashboard.stripe.com/${order.livemode ? '' : 'test/'}`
  if (order.stripePaymentIntentId) return `${base}payments/${order.stripePaymentIntentId}`
  if (order.stripeCheckoutSessionId) return `${base}search?query=${encodeURIComponent(order.stripeCheckoutSessionId)}`
  return null
}

export function AdminShopOrders() {
  const toast = useOptionalToast()
  const [filter, setFilter] = useState<ShopOrderFilter>('attention')
  const [includeTest, setIncludeTest] = useState(false)
  const [query, setQuery] = useState('')
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async () => {
    try {
      const token = await getAuthJWTToken().catch(() => null)
      const next = await listAdminShopOrdersFn({
        data: { token: token ?? undefined, filter, includeTest, query: query.trim() || undefined },
      })
      setPayload(next)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load shop orders.')
    }
  }, [filter, includeTest, query])

  useEffect(() => {
    const timer = setTimeout(() => void load(), query ? 250 : 0)
    return () => clearTimeout(timer)
  }, [load, query])

  const loadMore = async () => {
    if (!payload) return
    setLoadingMore(true)
    try {
      const token = await getAuthJWTToken().catch(() => null)
      const next = await listAdminShopOrdersFn({
        data: {
          token: token ?? undefined,
          filter,
          includeTest,
          query: query.trim() || undefined,
          offset: payload.orders.length,
        },
      })
      setPayload((current) =>
        current ? { ...next, orders: mergeById(current.orders, next.orders) } : next,
      )
    } catch (err: unknown) {
      toast?.toast.error(err instanceof Error ? err.message : 'Could not load more orders.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function act(action: 'retry' | 'reconcile', order: ShopOrder) {
    setBusy(`${action}:${order.id}`)
    try {
      const token = await getAuthJWTToken().catch(() => null)
      await mutateAdminStoreFn({ data: { token: token ?? undefined, action, target: order.id } })
      toast?.toast.success(action === 'retry' ? 'Order sent to Printful again.' : 'Order refreshed from Printful.')
      await load()
    } catch (err: unknown) {
      toast?.toast.error(err instanceof Error ? err.message : 'That did not work.')
    } finally {
      setBusy(null)
    }
  }

  const summary = payload?.summary
  return (
    <section className={ADMIN_CARD} data-testid="admin-shop">
      <div className="space-y-3" data-testid="admin-shop-orders">
        <AdminCardHeading
          icon={<Package />}
          title="Store orders"
          actions={
            <>
              <a href="#admin-store-settings" className={QUIET_LINK}>
                Store settings <ArrowDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
              </a>
              <Link to="/store" className={QUIET_LINK}>
                Open storefront <ArrowUpRight className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
              </Link>
            </>
          }
        />

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-line-subtle py-3" role="group" aria-label="Shop summary">
          <BandStat label={includeTest ? 'Paid (incl. test)' : 'Paid orders'} value={summary ? String(summary.paidOrders) : '—'} />
          <BandStat label="Net revenue" value={summary ? formatMerchPrice(summary.revenueCents) : '—'} />
          <BandStat
            label="Needs attention"
            value={summary ? String(summary.attention) : '—'}
            tone={summary && summary.attention > 0 ? 'amber' : 'ink'}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex gap-1" role="group" aria-label="Order filter">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                data-testid={`shop-filter-${item.id}`}
                onClick={() => setFilter(item.id)}
                className={pillTabClass(filter === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="inline-flex min-h-9 items-center gap-2 text-xs text-ink-body">
            <AdminSwitch checked={includeTest} onChange={setIncludeTest} label="Show test orders" testId="shop-include-test" />
            Test orders
          </label>
          <label className="relative w-full sm:ml-auto sm:w-64">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order number or email"
              className={cn(ADMIN_FIELD, 'w-full pl-9')}
            />
          </label>
        </div>

        {error ? <p className="text-xs text-crimson-text">{error}</p> : null}
        {payload && payload.orders.length === 0 && !error ? (
          <p className="text-xs text-ink-muted" data-testid="admin-shop-empty">
            {filter === 'attention'
              ? 'Nothing needs attention right now.'
              : includeTest
                ? 'No orders match.'
                : 'No live orders yet. Turn on test orders to see checkout tests.'}
          </p>
        ) : null}

        {payload && payload.orders.length > 0 ? (
          <ul className="space-y-2" data-testid="admin-shop-list">
            {payload.orders.map((order) => {
              const open = openId === order.id
              const payment = shopPaymentLabel(order.paymentStatus)
              const shipping = shopShippingLabel(order)
              return (
                <li key={order.id} className="rounded-card border border-line-subtle bg-surface-2 transition-colors hover:border-line">
                  <button
                    type="button"
                    aria-expanded={open}
                    data-testid={`shop-order-${order.id}`}
                    onClick={() => setOpenId(open ? null : order.id)}
                    className="w-full p-3 text-left space-y-1 rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-ink">
                        #{orderNumber(order.id)}
                        {order.livemode ? null : <span className="rounded-chip bg-surface-1 px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">TEST</span>}
                        {shopOrderNeedsAttention(order) ? <span className="whitespace-nowrap text-[11px] font-bold text-amber-400">Needs attention</span> : null}
                      </span>
                      <span className="text-sm font-bold text-ink tabular-nums">{formatMerchPrice(order.totalCents)}</span>
                    </span>
                    <span className="flex flex-col gap-1 text-[11px] sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                      <span className="text-ink-muted break-words">
                        {shortDate(order.createdAt)} · {order.customerEmail ?? 'No email yet'} · {itemSummary(order)}
                      </span>
                      <span className="sm:text-right sm:whitespace-nowrap">
                        <span className={TONE_CLASS[payment.tone]}>{payment.label}</span>
                        <span className="text-ink-muted"> · </span>
                        <span className={TONE_CLASS[shipping.tone]}>{shipping.label}</span>
                      </span>
                    </span>
                  </button>
                  {open ? (
                    <OrderDetail order={order} busy={busy} onAction={(action) => void act(action, order)} />
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : null}
        {payload && payload.orders.length > 0 && payload.hasMore ? (
          <LoadMoreButton
            label="Load more orders"
            loading={loadingMore}
            testId="admin-shop-load-more"
            onClick={() => void loadMore()}
          />
        ) : null}
      </div>
    </section>
  )
}

function OrderDetail({
  order,
  busy,
  onAction,
}: {
  order: ShopOrder
  busy: string | null
  onAction: (action: 'retry' | 'reconcile') => void
}) {
  const address = order.shippingAddress
  const stripe = stripeHref(order)
  return (
    <div className="border-t border-line-subtle p-3 grid gap-3 md:grid-cols-2 text-xs text-ink-body" data-testid="shop-order-detail">
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Items</h3>
        <ul className="space-y-1">
          {order.lineItems.map((item, index) => (
            <li key={index} className="flex justify-between gap-2">
              <span>{item.quantity} × {item.productTitle} · {item.variantTitle}</span>
              <span className="tabular-nums">{formatMerchPrice(item.quantity * item.unitPriceCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-t border-line-subtle pt-2 tabular-nums">
          <dt>Items</dt><dd>{formatMerchPrice(order.subtotalCents)}</dd>
          {order.discountCents > 0 ? (<><dt>Discount{order.promotionCode ? ` · ${order.promotionCode}` : ''}</dt><dd>−{formatMerchPrice(order.discountCents)}</dd></>) : null}
          <dt>Shipping</dt><dd>{formatMerchPrice(order.shippingCents)}</dd>
          <dt>Tax</dt><dd>{formatMerchPrice(order.taxCents)}</dd>
          <dt className="font-bold text-ink">Total</dt><dd className="font-bold text-ink">{formatMerchPrice(order.totalCents)}</dd>
          {order.refundCents > 0 ? (<><dt className="text-amber-400">Refunded</dt><dd className="text-amber-400">−{formatMerchPrice(order.refundCents)}</dd></>) : null}
        </dl>
      </div>

      <div className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Customer</h3>
        <p>
          {order.customerEmail ?? 'No email yet'}
          {order.memberHandle ? <span className="text-ink-muted"> · member {order.memberHandle}</span> : null}
        </p>
        {address ? (
          <address className="not-italic leading-relaxed">
            {address.name}<br />
            {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
            {address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode} · {address.country}
            {address.phone ? <><br />{address.phone}</> : null}
          </address>
        ) : <p className="text-ink-muted">No shipping address yet.</p>}

        {order.shipments.length ? (
          <ul className="space-y-1">
            {order.shipments.map((shipment) => (
              <li key={shipment.id}>
                {shipment.carrier || 'Carrier'} {shipment.trackingNumber}
                {shipment.trackingUrl ? (
                  <a className={`ml-2 ${QUIET_LINK}`} href={shipment.trackingUrl} target="_blank" rel="noreferrer">Track</a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {order.fulfillmentError ? <p className="text-crimson-text">Last error: {order.fulfillmentError}</p> : null}
        <p className="text-ink-muted">
          Ordered {shortDate(order.createdAt)}
          {order.printfulOrderId ? ` · Printful #${order.printfulOrderId}` : ''}
          {order.reconciledAt ? ` · checked ${shortDate(order.reconciledAt)}` : ''}
        </p>
      </div>

      <div className="md:col-span-2 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
        {RETRYABLE.includes(order.fulfillmentStatus) && order.refundCents === 0 ? (
          <HudButton size="sm" variant="secondary" disabled={busy !== null} onClick={() => onAction('retry')} data-testid="shop-retry">
            {busy === `retry:${order.id}` ? 'Retrying' : 'Retry fulfillment'}
          </HudButton>
        ) : null}
        {order.printfulOrderId ? (
          <HudButton size="sm" variant="secondary" disabled={busy !== null} onClick={() => onAction('reconcile')} icon={<RefreshCw className="w-3.5 h-3.5" />} data-testid="shop-refresh">
            {busy === `reconcile:${order.id}` ? 'Refreshing' : 'Refresh from Printful'}
          </HudButton>
        ) : null}
        {stripe ? <ExternalButton href={stripe}>Stripe</ExternalButton> : null}
        {order.printfulOrderId ? (
          <ExternalButton href={`https://www.printful.com/dashboard/default/orders?order_id=${encodeURIComponent(order.printfulOrderId)}`}>Printful</ExternalButton>
        ) : null}
        {order.customerEmail ? (
          <a className={QUIET_LINK} href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Your Moltology order #${orderNumber(order.id)}`)}`}>
            Email customer
          </a>
        ) : null}
        <p className="basis-full text-[11px] text-ink-muted">
          Refund in Stripe and cancel in Printful. A refund does not stop Printful production.
        </p>
      </div>
    </div>
  )
}

function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={QUIET_LINK} href={href} target="_blank" rel="noreferrer">
      {children} <ExternalLink className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
    </a>
  )
}
