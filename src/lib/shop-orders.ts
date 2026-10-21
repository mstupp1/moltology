import type { MerchFulfillmentStatus } from './merch'

/** Admin order list filters. "attention" is anything a person has to look at. */
export type ShopOrderFilter = 'attention' | 'paid' | 'all'

export const PAID_PAYMENT_STATUSES = ['paid', 'partially_refunded', 'refunded'] as const
/** Paid orders stuck before Printful has a confirmed order. */
export const STUCK_FULFILLMENT_STATUSES = ['paid', 'processing', 'printful_draft'] as const
export const FAILED_PROVIDER_STATUSES = ['canceled', 'failed'] as const

export type ShopOrderTone = 'ok' | 'wait' | 'bad' | 'muted'

export interface ShopOrderStatusInput {
  paymentStatus: string
  fulfillmentStatus: MerchFulfillmentStatus | string
  providerStatus: string | null
  refundCents: number
  printfulOrderId: string | null
  shipments: Array<{ shippedAt: string | null }>
}

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  failed: 'Payment failed',
  paid: 'Paid',
  partially_refunded: 'Partly refunded',
  refunded: 'Refunded',
}

export function shopPaymentLabel(status: string): { label: string; tone: ShopOrderTone } {
  const label = PAYMENT_LABELS[status] ?? status.replaceAll('_', ' ')
  if (status === 'paid') return { label, tone: 'ok' }
  if (status === 'failed') return { label, tone: 'bad' }
  if (status === 'unpaid') return { label, tone: 'muted' }
  return { label, tone: 'wait' }
}

/** One plain-English line for where the parcel is, preferring what Printful last reported. */
export function shopShippingLabel(order: ShopOrderStatusInput): { label: string; tone: ShopOrderTone } {
  if (order.providerStatus === 'canceled') return { label: 'Canceled in Printful', tone: 'bad' }
  if (order.providerStatus === 'failed') return { label: 'Printful failed', tone: 'bad' }
  if (order.providerStatus === 'fulfilled') return { label: 'Shipped', tone: 'ok' }
  if (order.providerStatus === 'partial' || order.shipments.some(s => s.shippedAt)) return { label: 'Partly shipped', tone: 'ok' }
  switch (order.fulfillmentStatus) {
    case 'pending':
    case 'awaiting_payment':
      return { label: 'Waiting for payment', tone: 'muted' }
    case 'payment_failed':
      return { label: 'Not sent (payment failed)', tone: 'muted' }
    case 'paid':
      return { label: 'Not sent to Printful yet', tone: 'wait' }
    case 'processing':
      return { label: 'Sending to Printful', tone: 'wait' }
    case 'printful_draft':
      return { label: 'Waiting for Printful approval', tone: 'wait' }
    case 'fulfillment_failed':
      return { label: 'Fulfillment failed', tone: 'bad' }
    case 'submitted_to_printful':
      return order.providerStatus === 'inprocess'
        ? { label: 'In production', tone: 'ok' }
        : { label: 'Sent to Printful', tone: 'ok' }
    default:
      return { label: String(order.fulfillmentStatus).replaceAll('_', ' '), tone: 'muted' }
  }
}

/** Mirrors the server "attention" filter so the list and the detail agree. */
export function shopOrderNeedsAttention(order: ShopOrderStatusInput): boolean {
  if (order.fulfillmentStatus === 'fulfillment_failed') return true
  // A canceled or failed Printful order is settled once the customer is fully refunded.
  if ((FAILED_PROVIDER_STATUSES as readonly string[]).includes(order.providerStatus ?? '')) return order.paymentStatus !== 'refunded'
  // A refund does not stop Printful, so a refunded order still in production needs a look.
  if (order.refundCents > 0 && order.printfulOrderId && order.providerStatus !== 'fulfilled' && order.providerStatus !== 'canceled') return true
  return order.paymentStatus === 'paid' && (STUCK_FULFILLMENT_STATUSES as readonly string[]).includes(order.fulfillmentStatus)
}
