import { and, asc, desc, eq, exists, gt, ilike, inArray, isNotNull, isNull, lt, ne, notInArray, or, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { profiles, storeQuotes, merchOrders, merchProducts, merchVariants, storeAudit, storeOutbox, storeOverrides, storeRateLimits, storeSettings } from '../../db/schema'
import { storeSettingsSchema, safeTrackingUrl, type StoreShipment } from '../store'
import { formatMerchPrice, printfulOrderExternalId, isOrderablePrintfulId } from '../merch'
import { FAILED_PROVIDER_STATUSES, PAID_PAYMENT_STATUSES, STUCK_FULFILLMENT_STATUSES, type ShopOrderFilter } from '../shop-orders'
import { requireStaff } from './admin-oversight'
import { hashStoreValue, readStoreSettings, storeStatusToken, storeStripe, type StoreArgs } from './store'
import { sendTransactionalEmail } from './mail'

const statusUrl = (id: string) => `${process.env.BETTER_AUTH_URL?.replace(/\/$/, '')}/store/status?order=${id}&key=${storeStatusToken(id)}`
export async function queueStoreMail(key: string, orderId: string | null, to: string, subject: string, body: string) {
  await getDb().insert(storeOutbox).values({ key, orderId, to, subject, body }).onConflictDoNothing()
}
export async function alertStoreOperator(orderId: string, problem: string) {
  const to = process.env.STORE_SUPPORT_INBOX
  if (!to) return
  await queueStoreMail(`alert:${orderId}:${hashStoreValue(problem).slice(0,16)}`, null, to, 'Store order needs review', `Order: ${orderId}\n${problem}\nReview the Shop tab at /admin?tab=shop. Refunds do not cancel Printful production.`)
}
export async function enqueueOrderConfirmation(id: string) {
  const [order] = await getDb().select().from(merchOrders).where(eq(merchOrders.id, id)).limit(1)
  if (!order?.customerEmail || !order.statusTokenHash || !['paid','partially_refunded','refunded'].includes(order.paymentStatus)) return
  await queueStoreMail(`payment:${id}`, id, order.customerEmail, 'Your Moltology payment was received', [
    `Order ${id}`, 'Payment received. Follow your order status for production and delivery updates.',
    ...order.lineItems.map(l => `${l.quantity} × ${l.productTitle} (${l.variantTitle}): ${formatMerchPrice(l.quantity * l.unitPriceCents)}`),
    `Items: ${formatMerchPrice(order.subtotalCents)}`, `Shipping: ${formatMerchPrice(order.shippingCents)}`,
    `Tax: ${formatMerchPrice(order.taxCents)}`, `Total: ${formatMerchPrice(order.totalCents)}`, statusUrl(id),
  ].join('\n'))
}

/** Each mail owns a lease. Provider idempotency covers crashes after a successful send. */
export async function drainStoreOutbox(maximum = 8) {
  const db = getDb(), now = new Date()
  const rows = await db.select().from(storeOutbox).where(and(isNull(storeOutbox.sentAt), lt(storeOutbox.availableAt, now), or(isNull(storeOutbox.leaseUntil), lt(storeOutbox.leaseUntil, now))))
    .orderBy(asc(storeOutbox.availableAt)).limit(maximum)
  let sent = 0
  for (const row of rows) {
    const lease = new Date(Date.now() + 60_000)
    const [claim] = await db.update(storeOutbox).set({ leaseUntil: lease, attempts: sql`${storeOutbox.attempts} + 1` })
      .where(and(eq(storeOutbox.key, row.key), isNull(storeOutbox.sentAt), lt(storeOutbox.availableAt, new Date()), or(isNull(storeOutbox.leaseUntil), lt(storeOutbox.leaseUntil, new Date())))).returning()
    if (!claim) continue
    // Resend idempotency lasts 24 hours; ambiguous old sends require review, not duplicate mail.
    const tooOld = Date.now() - row.createdAt.getTime() >= 23 * 60 * 60_000 && row.attempts > 0
    const result = tooOld ? { sent: false, error: 'delivery-uncertain-review-required' } : await sendTransactionalEmail({ to: row.to, subject: row.subject, text: row.body, idempotencyKey: `store/${hashStoreValue(row.key)}` })
    const delayed = tooOld ? 365 * 24 * 60 * 60_000 : Math.min(60 * 60_000, 60_000 * 2 ** Math.min(claim.attempts, 6))
    await db.update(storeOutbox).set({ sentAt: result.sent ? new Date() : null, leaseUntil: null,
      lastError: result.sent ? null : result.error ?? 'send-failed', availableAt: new Date(Date.now() + delayed),
    }).where(and(eq(storeOutbox.key, row.key), eq(storeOutbox.leaseUntil, lease)))
    if (result.sent) sent++
    else if (row.orderId) await alertStoreOperator(row.orderId, 'Customer email could not be delivered. Review the email queue.')
  }
  return sent
}

/** A shared lease keeps callback/recovery status reads serialized per order. */
async function claimJob(key: string, duration = 120_000) {
  const until = new Date(Date.now() + duration)
  const [claim] = await getDb().insert(storeRateLimits).values({ key, count: 0, expiresAt: until })
    .onConflictDoUpdate({ target: storeRateLimits.key, set: { expiresAt: until }, setWhere: lt(storeRateLimits.expiresAt, new Date()) }).returning()
  return claim ? until : null
}
async function releaseJob(key: string, lease: Date) {
  await getDb().delete(storeRateLimits).where(and(eq(storeRateLimits.key, key), eq(storeRateLimits.expiresAt, lease)))
}
export async function reconcileStoreOrder(id: string) {
  const key = `reconcile:${id}`, lease = await claimJob(key)
  if (!lease) return
  try {
    const db = getDb()
    const [order] = await db.select().from(merchOrders).where(eq(merchOrders.id, id)).limit(1)
    if (!order?.printfulOrderId) return
    const token = process.env.PRINTFUL_API_TOKEN, storeId = process.env.PRINTFUL_STORE_ID
    if (!token || !storeId) throw new Error('Printful reconciliation is not configured.')
    const response = await fetch(`https://api.printful.com/orders/@${printfulOrderExternalId(id)}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-PF-Store-Id': storeId }, signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error('Printful reconciliation could not verify the order.')
    const { result } = await response.json() as { result: { id: number; external_id: string; store_id?: number; store?: number; status: string; shipments?: Array<{ id: number; carrier?: string; tracking_number?: string; tracking_url?: string; shipped_at?: number; items?: Array<{ item_id: number; quantity: number }> }> } }
    if (String(result.id) !== order.printfulOrderId || result.external_id !== printfulOrderExternalId(id) || ((result.store ?? result.store_id) != null && String(result.store ?? result.store_id) !== storeId)) throw new Error('Printful store/order verification failed.')
    const shipments = new Map(order.shipments.map(s => [s.id, s]))
    for (const shipment of result.shipments ?? []) {
      const snapshot: StoreShipment = { id: String(shipment.id), carrier: shipment.carrier || '', trackingNumber: shipment.tracking_number || '', trackingUrl: safeTrackingUrl(shipment.tracking_url), shippedAt: shipment.shipped_at ? new Date(shipment.shipped_at * 1000).toISOString() : null, items: (shipment.items ?? []).map(i => ({ itemId: String(i.item_id), quantity: i.quantity })) }
      const previous = shipments.get(snapshot.id)
      if (previous) {
        snapshot.carrier ||= previous.carrier
        snapshot.trackingNumber ||= previous.trackingNumber
        snapshot.trackingUrl ||= previous.trackingUrl
        snapshot.shippedAt ||= previous.shippedAt
        const items = new Map(previous.items.map(item => [item.itemId, item.quantity]))
        for (const item of snapshot.items) items.set(item.itemId, Math.max(items.get(item.itemId) || 0, item.quantity))
        snapshot.items = [...items].map(([itemId, quantity]) => ({ itemId, quantity }))
      }
      shipments.set(snapshot.id, snapshot)
      if (snapshot.shippedAt && order.customerEmail && order.statusTokenHash) await queueStoreMail(`shipment:${id}:${snapshot.id}`, id, order.customerEmail, 'Your Moltology shipment is on its way', `Order ${id}\nCarrier: ${snapshot.carrier}\nTracking: ${snapshot.trackingNumber}\n${snapshot.trackingUrl || ''}\nItems in package: ${snapshot.items.map(i => `${i.itemId} × ${i.quantity}`).join(', ')}\n${statusUrl(id)}`)
    }
    const rank: Record<string, number> = { draft: 0, pending: 1, inprocess: 2, partial: 3, fulfilled: 4 }
    const terminal = ['canceled', 'failed'].includes(result.status)
    const providerStatus = terminal || (rank[result.status] ?? -1) >= (rank[order.providerStatus ?? 'draft'] ?? -1) ? result.status : order.providerStatus
    const ownsLease = exists(db.select({ one: sql`1` }).from(storeRateLimits)
      .where(and(eq(storeRateLimits.key, key), eq(storeRateLimits.expiresAt, lease))))
    await db.update(merchOrders).set({ providerStatus, shipments: [...shipments.values()], reconciledAt: new Date(),
      ...(result.status !== 'draft' && order.fulfillmentStatus === 'printful_draft' ? { fulfillmentStatus: 'submitted_to_printful' as const } : {}),
    }).where(and(eq(merchOrders.id, id), ownsLease))
    if (terminal) await alertStoreOperator(id, 'Printful reports a failed or canceled order. Review payment and fulfillment independently.')
  } finally { await releaseJob(key, lease) }
}

export async function syncStoreRefund(paymentIntentId: string) {
  let [order] = await getDb().select().from(merchOrders).where(eq(merchOrders.stripePaymentIntentId, paymentIntentId)).limit(1)
  const intent = await storeStripe().paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] })
  if (!order && intent.metadata?.orderType === 'merch' && intent.metadata?.orderId) {
    ;[order] = await getDb().select().from(merchOrders).where(eq(merchOrders.id, intent.metadata.orderId)).limit(1)
    if (order && !order.stripePaymentIntentId) await getDb().update(merchOrders).set({ stripePaymentIntentId: paymentIntentId }).where(and(eq(merchOrders.id, order.id), isNull(merchOrders.stripePaymentIntentId)))
  }
  if (!order) return
  if (intent.livemode !== order.livemode) throw new Error('Stripe refund mode mismatch.')
  const charge = intent.latest_charge
  if (!charge || typeof charge === 'string') { if (intent.status === 'succeeded') throw new Error('Refund charge is unavailable.'); return }
  if (intent.status && intent.status !== 'succeeded') return
  const cents = charge.amount_refunded
  // Only authoritative cumulative totals; duplicates and older events cannot undo a refund.
  await getDb().update(merchOrders).set({ refundCents: sql`greatest(${merchOrders.refundCents}, ${cents})`,
    paymentStatus: cents >= order.totalCents ? 'refunded' : cents > 0 ? 'partially_refunded' : 'paid',
  }).where(and(eq(merchOrders.id, order.id), sql`${merchOrders.refundCents} <= ${cents}`))
  if (cents > 0) await alertStoreOperator(order.id, 'A Stripe refund was recorded. A refund does not cancel Printful production; review both dashboards.')
}
export async function handleStoreRefundEvent(event: { type: string; data: { object: unknown } }) {
  if (!['charge.refunded','refund.created','refund.updated','refund.failed'].includes(event.type)) return false
  const object = event.data.object as { payment_intent?: string | { id: string } }
  const id = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id
  if (id) {
    const [order] = await getDb().select({ id: merchOrders.id }).from(merchOrders).where(eq(merchOrders.stripePaymentIntentId, id)).limit(1)
    if (order) await syncStoreRefund(id)
  }
  return true
}

export async function recoverStore() {
  const key = 'store-recovery', lease = await claimJob(key, 5 * 60_000)
  if (!lease) return { busy: true }
  try {
    const db = getDb()
    // Mail is independent: even a slow provider/order backlog cannot starve delivery retries.
    const sent = await drainStoreOutbox()
    const deadline = Date.now() + 150_000
    const activeLiveMode = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? '')
    const rows = await db.select().from(merchOrders).where(and(eq(merchOrders.livemode, activeLiveMode), sql`${merchOrders.stripeCheckoutSessionId} is not null`, lt(merchOrders.updatedAt, new Date(Date.now() - 5 * 60_000))))
      .orderBy(sql`${merchOrders.reconciledAt} asc nulls first`, asc(merchOrders.updatedAt)).limit(4)
    let processed = 0
    for (const order of rows) {
      // Reserve time for the bounded Stripe/Printful HTTP sequence before taking another order.
      if (Date.now() + 110_000 > deadline) break
      processed++
      try {
        const { fulfillMerchCheckoutEvent } = await import('./merch')
        const session = await storeStripe().checkout.sessions.retrieve(order.stripeCheckoutSessionId!)
        await fulfillMerchCheckoutEvent({ type: 'checkout.session.completed', data: { object: session } }, true)
        if (order.stripePaymentIntentId) await syncStoreRefund(order.stripePaymentIntentId)
        await reconcileStoreOrder(order.id)
        await enqueueOrderConfirmation(order.id)
      } catch {
        await alertStoreOperator(order.id, 'Payment, fulfillment or status recovery failed. Review the saved order and provider dashboards.')
      } finally {
        await db.update(merchOrders).set({ reconciledAt: new Date() }).where(eq(merchOrders.id, order.id))
      }
    }
    await db.delete(storeRateLimits).where(lt(storeRateLimits.expiresAt, new Date(Date.now() - 24 * 60 * 60_000)))
    await db.delete(storeQuotes).where(lt(storeQuotes.expiresAt, new Date(Date.now() - 24 * 60 * 60_000)))
    return { orders: processed, sent }
  } finally { await releaseJob(key, lease) }
}

export async function getAdminStore(args: StoreArgs & { data?: { token?: string; userId?: string } }) {
  await requireStaff(args)
  const db = getDb()
  const [products, variants, overrides, audit, mail] = await Promise.all([
    db.select().from(merchProducts).orderBy(asc(merchProducts.sortOrder)), db.select().from(merchVariants), db.select().from(storeOverrides),
    db.select().from(storeAudit).orderBy(desc(storeAudit.createdAt)).limit(30),
    db.select({ key: storeOutbox.key, orderId: storeOutbox.orderId, attempts: storeOutbox.attempts, sentAt: storeOutbox.sentAt, lastError: storeOutbox.lastError }).from(storeOutbox).where(isNull(storeOutbox.sentAt)).limit(30),
  ])
  return { products, variants, overrides, audit: audit.map(({ detail, ...row }) => ({ ...row, detail: JSON.stringify(detail) })), mail, settings: await readStoreSettings(),
    health: { liveAuthorized: process.env.STORE_LIVE_PAYMENTS_AUTHORIZED === 'true', publicAuthorized: process.env.STORE_PUBLIC_LAUNCH_AUTHORIZED === 'true', emailConfigured: Boolean(process.env.RESEND_API_KEY), supportConfigured: Boolean(process.env.STORE_SUPPORT_INBOX), recoveryConfigured: Boolean(process.env.STORE_RECOVERY_SECRET), printfulCallbackConfigured: Boolean(process.env.PRINTFUL_WEBHOOK_SECRET), statusConfigured: Boolean(process.env.STORE_STATUS_SECRET), autoProductionConfigured: process.env.PRINTFUL_DRAFT === 'false' } }
}
// Same rule as shopOrderNeedsAttention in src/lib/shop-orders.ts.
const needsAttention = or(
  eq(merchOrders.fulfillmentStatus, 'fulfillment_failed'),
  and(inArray(merchOrders.providerStatus, [...FAILED_PROVIDER_STATUSES]), ne(merchOrders.paymentStatus, 'refunded')),
  and(gt(merchOrders.refundCents, 0), isNotNull(merchOrders.printfulOrderId),
    or(isNull(merchOrders.providerStatus), notInArray(merchOrders.providerStatus, ['fulfilled', 'canceled']))),
  and(eq(merchOrders.paymentStatus, 'paid'), inArray(merchOrders.fulfillmentStatus, [...STUCK_FULFILLMENT_STATUSES])),
)!
const isPaid = inArray(merchOrders.paymentStatus, [...PAID_PAYMENT_STATUSES])

export type AdminShopOrder = Awaited<ReturnType<typeof listAdminShopOrders>>['orders'][number]

/** Real shop orders for the admin Shop tab. Test-mode orders are opt-in. */
export async function listAdminShopOrders(args: StoreArgs & { data?: { token?: string; userId?: string; query?: string; filter?: ShopOrderFilter; includeTest?: boolean } }) {
  await requireStaff(args)
  const db = getDb(), query = args.data?.query?.trim().slice(0, 100), filter = args.data?.filter ?? 'attention'
  const mode = args.data?.includeTest ? undefined : eq(merchOrders.livemode, true)
  const rows = await db.select({ order: merchOrders, handle: profiles.handle }).from(merchOrders)
    .leftJoin(profiles, eq(profiles.id, merchOrders.userId))
    .where(and(mode,
      query ? or(ilike(sql`${merchOrders.id}::text`, `%${query}%`), ilike(merchOrders.customerEmail, `%${query}%`), ilike(merchOrders.printfulOrderId, `%${query}%`)) : undefined,
      filter === 'attention' ? needsAttention : filter === 'paid' ? isPaid : undefined,
    )).orderBy(desc(merchOrders.createdAt)).limit(50)
  const [summary] = await db.select({
    paidOrders: sql<number>`count(*) filter (where ${isPaid})`.mapWith(Number),
    revenueCents: sql<number>`coalesce(sum(${merchOrders.totalCents} - ${merchOrders.refundCents}) filter (where ${isPaid}), 0)`.mapWith(Number),
    attention: sql<number>`count(*) filter (where ${needsAttention})`.mapWith(Number),
  }).from(merchOrders).where(mode)
  return {
    summary: summary ?? { paidOrders: 0, revenueCents: 0, attention: 0 },
    orders: rows.map(({ order, handle }) => ({
      id: order.id, memberHandle: handle, customerEmail: order.customerEmail, shippingAddress: order.shippingAddress,
      livemode: order.livemode, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus,
      fulfillmentMode: order.fulfillmentMode, providerStatus: order.providerStatus, fulfillmentError: order.fulfillmentError,
      printfulOrderId: order.printfulOrderId, stripeCheckoutSessionId: order.stripeCheckoutSessionId, stripePaymentIntentId: order.stripePaymentIntentId,
      lineItems: order.lineItems.map(l => ({ productTitle: l.productTitle, variantTitle: l.variantTitle, quantity: l.quantity, unitPriceCents: l.unitPriceCents })),
      shipments: order.shipments, subtotalCents: order.subtotalCents, shippingCents: order.shippingCents, taxCents: order.taxCents,
      totalCents: order.totalCents, refundCents: order.refundCents, currency: order.currency,
      createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(), reconciledAt: order.reconciledAt?.toISOString() ?? null,
    })),
  }
}

export async function mutateAdminStore(args: StoreArgs & { data: { token?: string; userId?: string; action: string; target?: string; value?: unknown } }) {
  const actor = await requireStaff(args), db = getDb(), { action, target = 'main', value } = args.data
  const auditId = crypto.randomUUID()
  const audit = db.insert(storeAudit).values({ id: auditId, actor: actor.userId, action, target, detail: { value } })
  if (action === 'settings') {
    const settings = storeSettingsSchema.parse(value)
    if (settings.fulfillmentMode === 'automatic' && process.env.PRINTFUL_DRAFT !== 'false') throw new Error('Automatic production requires explicit deployment configuration first.')
    await db.batch([db.insert(storeSettings).values({ id: 'main', value: settings }).onConflictDoUpdate({ target: storeSettings.id, set: { value: settings, updatedAt: new Date() } }), audit])
  } else if (action === 'availability') {
    if (!/^[a-f0-9-]{36}$/i.test(target) || typeof value !== 'boolean') throw new Error('Choose a product or variant and availability.')
    const [product] = await db.select().from(merchProducts).where(eq(merchProducts.id, target)).limit(1)
    const [variant] = await db.select().from(merchVariants).where(eq(merchVariants.id, target)).limit(1)
    if (!product && !variant) throw new Error('Catalog entry not found.')
    if (value) {
      const entries = variant ? [variant] : await db.select().from(merchVariants).where(eq(merchVariants.productId, target))
      if (!entries.length || entries.some(v => !isOrderablePrintfulId(v.printfulSyncVariantId))) throw new Error('Sync every variant before publishing this entry.')
    }
    await db.batch([db.insert(storeOverrides).values({ id: target, enabled: value }).onConflictDoUpdate({ target: storeOverrides.id, set: { enabled: value, updatedAt: new Date() } }), audit])
  } else if (action === 'retry') {
    await audit
    try { await (await import('./merch')).retryMerchOrder(target) }
    catch (error) { await alertStoreOperator(target, 'An administrator retry failed. Review the saved error.'); throw error }
  } else if (action === 'reconcile') { await audit; await reconcileStoreOrder(target) }
  else throw new Error('Unknown store action.')
  return { ok: true, auditId }
}
