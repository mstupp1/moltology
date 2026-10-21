import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getStoreStatusFn } from '@/lib/server/merch-api'
import { useMerchCart } from '@/components/store/MerchCartProvider'
import { formatMerchPrice } from '@/lib/merch'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
export const Route = createFileRoute('/store/status')({
  validateSearch: (s: Record<string, unknown>) => ({ order: typeof s.order === 'string' ? s.order : '', key: typeof s.key === 'string' ? s.key : '' }),
  headers: () => ({ ...xRobotsNoindexHeaders(), 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' }),
  head: () => ({ meta: [...privatePageSeo({ title: 'Order status | Moltology', description: 'Your order status.' }), { name: 'referrer', content: 'no-referrer' }] }),
  component: StoreStatus,
})
function StoreStatus() {
  const { order, key } = Route.useSearch()
  const { completeVerifiedCheckout } = useMerchCart()
  const [result, setResult] = useState<Awaited<ReturnType<typeof getStoreStatusFn>> | null>(null)
  const [error, setError] = useState('')
  const refresh = () => { void getStoreStatusFn({ data: { order, key } }).then(setResult).catch(() => setError('This order link is unavailable. Check the link in your email.')) }
  useEffect(refresh, [order, key])
  useEffect(() => {
    if (result && ['paid','partially_refunded','refunded'].includes(result.paymentStatus)) completeVerifiedCheckout(result.id)
  }, [result?.paymentStatus, result?.id, completeVerifiedCheckout])

  return <section className="space-y-5"><h1 className="font-grotesk text-3xl">Order status</h1>
    {error && <p role="alert">{error}</p>}
    {result ? <><p>Payment: {result.paymentStatus.replaceAll('_', ' ')}</p><p>Fulfillment: {(result.providerStatus || result.fulfillmentStatus).replaceAll('_',' ')}</p>
      {result.fulfillmentStatus === 'printful_draft' && <p>Payment is received. Your order is awaiting production review.</p>}
      <ul>{result.items.map((item, i) => <li key={i}>{item.quantity} × {item.title} · {item.variant}</li>)}</ul>
      <p>Items {formatMerchPrice(result.subtotalCents)}{result.discountCents > 0 && ` · Discount${result.promotionCode ? ` (${result.promotionCode})` : ''} −${formatMerchPrice(result.discountCents)}`} · Shipping {formatMerchPrice(result.shippingCents)} · Tax {formatMerchPrice(result.taxCents)}</p>
      <p>Total {formatMerchPrice(result.totalCents)}{result.refundCents > 0 && ` · Refunded ${formatMerchPrice(result.refundCents)}`}</p>
      {result.shipments.map(s => <p key={s.id}>{s.carrier} · {s.trackingNumber} {s.trackingUrl && <a href={s.trackingUrl} rel="noreferrer" target="_blank">Track package</a>}</p>)}
      <button type="button" onClick={refresh}>Refresh status</button></> : !error && <p>Checking verified payment and order status…</p>}
  </section>
}
