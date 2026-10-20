import { and, eq, inArray, lt, or } from 'drizzle-orm'
import type { getDb } from '../../db'
import { merchOrders } from '../../db/schema'
import {
  buildPrintfulOrderPayload, isOrderablePrintfulId, shouldDraftPrintfulOrder,
  type MerchCheckoutCompletion,
} from '../merch'
import { ensurePrintfulOrder } from './printful'

// A worker can be recovered after a crash; HTTP calls have shorter timeouts than this lease.
export const MERCH_FULFILLMENT_LEASE_MS = 5 * 60_000

export async function fulfillPaidMerchOrder(
  db: ReturnType<typeof getDb>, orderId: string, completion: MerchCheckoutCompletion,
  livemode: boolean, retry = false,
): Promise<void> {
  if (!completion.paid || !completion.sessionId) throw new Error('Stripe has not confirmed payment for this merch order.')
  const claimedAt = new Date()
  const ready = ['pending', 'awaiting_payment', 'payment_failed', 'paid'] as const
  const [order] = await db.update(merchOrders).set({
    fulfillmentStatus: 'processing',
    stripeCheckoutSessionId: completion.sessionId,
    customerEmail: completion.email,
    shippingAddress: completion.shipping,
    ...(completion.subtotalCents != null ? { subtotalCents: completion.subtotalCents } : {}),
    ...(completion.shippingCents != null ? { shippingCents: completion.shippingCents } : {}),
    ...(completion.taxCents != null ? { taxCents: completion.taxCents } : {}),
    ...(completion.totalCents != null ? { totalCents: completion.totalCents } : {}),
    currency: completion.currency,
    updatedAt: claimedAt,
  }).where(and(eq(merchOrders.id, orderId), or(
    inArray(merchOrders.fulfillmentStatus, retry ? [...ready, 'fulfillment_failed'] : [...ready]),
    and(eq(merchOrders.fulfillmentStatus, 'processing'), lt(merchOrders.updatedAt, new Date(claimedAt.getTime() - MERCH_FULFILLMENT_LEASE_MS))),
  ))).returning()
  if (!order) {
    const [current] = await db.select().from(merchOrders).where(eq(merchOrders.id, orderId)).limit(1)
    if (current?.fulfillmentStatus === 'processing') throw new Error('Merch fulfillment is already processing; retry later.')
    return
  }
  // Every completion is fenced to this lease, so a late worker cannot overwrite its successor.
  const owned = and(eq(merchOrders.id, orderId), eq(merchOrders.fulfillmentStatus, 'processing'), eq(merchOrders.updatedAt, claimedAt))
  try {
    const token = process.env.PRINTFUL_API_TOKEN?.trim()
    if (!token) throw new Error('Printful is not configured.')
    if (!order.shippingAddress || !order.customerEmail) throw new Error('Checkout did not include a shipping address and email.')
    if (!order.lineItems.length || order.lineItems.some(item => !isOrderablePrintfulId(item.printfulSyncVariantId))) {
      throw new Error('Order includes an unsynced Printful variant.')
    }
    const created = await ensurePrintfulOrder(token, buildPrintfulOrderPayload({
      externalId: order.id, email: order.customerEmail, shipping: order.shippingAddress,
      items: order.lineItems, draft: shouldDraftPrintfulOrder(process.env, livemode),
    }))
    // A cancelled/failed existing order requires attention, not a second manufacturing order.
    if (['canceled', 'failed'].includes(created.status)) throw new Error('Existing Printful order needs manual review.')
    await db.update(merchOrders).set({
      fulfillmentStatus: created.status === 'draft' ? 'printful_draft' : 'submitted_to_printful',
      printfulOrderId: created.id,
      // Keep the last error as an audit trail after a successful retry.
      updatedAt: new Date(),
    }).where(owned)
  } catch (error) {
    const message = error instanceof Error && /^(Printful |Checkout did not|Order includes|Existing Printful)/.test(error.message)
      ? error.message.slice(0, 240) : 'Printful submission could not be verified. Retry to reconcile the external order.'
    await db.update(merchOrders).set({ fulfillmentStatus: 'fulfillment_failed', fulfillmentError: message, updatedAt: new Date() }).where(owned)
    throw new Error(message)
  }
}
