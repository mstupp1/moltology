import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '../stripe-config'
import { and, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { merchOrders, merchProducts, merchVariants, storeSettings, storeOverrides, storeQuotes, storeRateLimits } from '../../db/schema'
import { buildMerchCheckoutSessionParams, buildPricedCheckoutLines, buildPrintfulOrderPayload, type CheckoutLineRequest, type PricedVariant, shouldDraftPrintfulOrder } from '../merch'
import { STORE_DEFAULTS, STORE_QUOTE_TTL_MS, quoteBinding, selectStandardRate, storeDeliverySchema, type StoreSettings } from '../store'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'
import { hasExperiment } from '../experiments'
import { isAdmin } from '../permissions'
import { profiles } from '../../db/schema'
import sync from '../../../content/merch/printful-sync.json'

export type StoreArgs = { data?: { token?: string; userId?: string }; context?: WriteAuthContext & { clientIp?: string | null } | null }
export function storeStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Store payment is not configured.')
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION, timeout: 10_000, maxNetworkRetries: 0 })
}
export async function readStoreSettings(): Promise<StoreSettings> {
  const [row] = await getDb().select().from(storeSettings).where(eq(storeSettings.id, 'main')).limit(1)
  return { ...STORE_DEFAULTS, ...row?.value }
}
export function isStorePublic(settings: StoreSettings): boolean {
  return settings.publicEnabled && process.env.STORE_PUBLIC_LAUNCH_AUTHORIZED === 'true'
}
export async function requireStoreAccess(args: StoreArgs) {
  const settings = await readStoreSettings()
  const auth = await resolveWriteAuth({ ...args, requireAuth: false })
  if (!isStorePublic(settings)) {
    const [profile] = auth ? await auth.dbClient.select().from(profiles).where(eq(profiles.id, auth.userId)).limit(1) : []
    if (!profile || !hasExperiment(profile.role, profile.experiments, 'new-store')) throw new Error('This page is not available.')
  }
  return { settings, auth }
}
export const STORE_ORDERING_CLOSED = 'Ordering is unavailable right now.'
/** Browsing can be public while ordering stays closed. Admins can still order, to test checkout. */
export async function requireStoreOrdering(args: StoreArgs) {
  const access = await requireStoreAccess(args)
  if (access.settings.checkoutPaused) throw new Error('Checkout is paused.')
  if (access.settings.orderingOpen) return access
  const [profile] = access.auth ? await access.auth.dbClient.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, access.auth.userId)).limit(1) : []
  if (!profile || !isAdmin(null, profile.role)) throw new Error(STORE_ORDERING_CLOSED)
  return access
}
export const hashStoreValue = (value: string) => createHash('sha256').update(value).digest('hex')
export function storeStatusToken(orderId: string): string {
  const secret = process.env.STORE_STATUS_SECRET
  if (!secret || secret.length < 32) throw new Error('Store status links are not configured.')
  return createHmac('sha256', secret).update(`store-status:${orderId}`).digest('hex')
}
export function secretMatches(a: string | null, b: string | undefined): boolean {
  if (!a || !b || b.length < 32) return false
  const left = Buffer.from(hashStoreValue(a)), right = Buffer.from(hashStoreValue(b))
  return timingSafeEqual(left, right)
}
/** Atomic, durable fixed windows; caller input can never choose the IP bucket. */
export async function limitStoreRequest(key: string, maximum: number, windowMs = 15 * 60_000) {
  const window = Math.floor(Date.now() / windowMs)
  const bucket = hashStoreValue(`${key}:${window}`)
  const [row] = await getDb().insert(storeRateLimits).values({ key: bucket, count: 1, expiresAt: new Date((window + 1) * windowMs) })
    .onConflictDoUpdate({ target: storeRateLimits.key, set: { count: sql`${storeRateLimits.count} + 1` } }).returning()
  if (row.count > maximum) throw new Error('Too many store requests. Try again later.')
}
export async function storePricedLines(items: CheckoutLineRequest[]) {
  const ids = [...new Set(items.map(i => i.variantId))]
  if (!ids.length) throw new Error('Add at least one piece before checkout.')
  const rows = await getDb().select({
    variantId: merchVariants.id, productId: merchProducts.id, productTitle: merchProducts.title,
    productSlug: merchProducts.slug, productPublished: merchProducts.isPublished,
    variantTitle: merchVariants.title, size: merchVariants.size, color: merchVariants.color,
    printfulSyncVariantId: merchVariants.printfulSyncVariantId, priceCents: merchVariants.priceCents, isAvailable: merchVariants.isAvailable,
  }).from(merchVariants).innerJoin(merchProducts, eq(merchVariants.productId, merchProducts.id)).where(inArray(merchVariants.id, ids))
  const overrides = await getDb().select().from(storeOverrides).where(inArray(storeOverrides.id, [...ids, ...rows.map(r => r.productId)]))
  const enabled = new Map(overrides.map(o => [o.id, o.enabled]))
  const priced = buildPricedCheckoutLines(rows.map(row => ({ ...row, productPublished: (enabled.get(row.productId) ?? row.productPublished), isAvailable: (enabled.get(row.variantId) ?? row.isAvailable) })) as PricedVariant[], items)
  if (!priced.ok) throw new Error(priced.message)
  return priced.lines
}
export async function createStoreQuote(args: Omit<StoreArgs, 'data'> & { data: unknown }) {
  const { settings } = await requireStoreOrdering(args as StoreArgs)
  const input = storeDeliverySchema.parse(args.data)
  if (!settings.enabledCountries.includes(input.address.country)) throw new Error('Shipping is not enabled for this country.')
  await limitStoreRequest(`quote-ip:${args.context?.clientIp || 'unknown'}`, 30)
  await limitStoreRequest(`quote-email:${input.email}`, 15)
  const lines = await storePricedLines(input.items)
  const storeId = process.env.PRINTFUL_STORE_ID, token = process.env.PRINTFUL_API_TOKEN
  if (!storeId || !token) throw new Error('Shipping quotes are not configured.')
  if (String(sync.storeId) !== storeId) throw new Error('The configured Printful store does not match the approved catalog.')
  const mappings = sync.variants as Record<string, { catalogVariantId: number; syncVariantId: number }>
  const items = lines.map(line => {
    const mapping = mappings[line.variantId]
    if (!mapping || mapping.syncVariantId !== line.printfulSyncVariantId) throw new Error('Shipping mapping is unavailable.')
    return { variant_id: mapping.catalogVariantId, quantity: line.quantity }
  })
  const recipient = buildPrintfulOrderPayload({ externalId: crypto.randomUUID(), email: input.email, shipping: input.address, items: [], draft: true }).recipient
  const response = await fetch('https://api.printful.com/shipping/rates', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'X-PF-Store-Id': storeId, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, items, currency: 'USD' }), signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error('Could not quote shipping. Check your address and try again.')
  const body = await response.json() as { result?: Parameters<typeof selectStandardRate>[0] }
  const rate = selectStandardRate(body.result ?? [])
  const snapshot = { email: input.email, address: input.address, lines, ...rate, currency: 'usd' as const, storeId, quotedAt: new Date().toISOString() }
  const expiresAt = new Date(Date.now() + STORE_QUOTE_TTL_MS)
  const [quote] = await getDb().insert(storeQuotes).values({ snapshot, bindingHash: hashStoreValue(quoteBinding(snapshot)), expiresAt }).returning()
  return { id: quote.id, amountCents: rate.amountCents, service: rate.serviceName, expiresAt: expiresAt.toISOString() }
}

export async function createQuotedCheckout(args: Omit<StoreArgs, 'data'> & { data: unknown }) {
  const { settings, auth } = await requireStoreOrdering(args as StoreArgs)
  const { z } = await import('zod')
  const input = storeDeliverySchema.extend({ quoteId: z.uuid(), promoCode: z.string().max(40).optional() }).parse(args.data)
  if (!settings.enabledCountries.includes(input.address.country)) throw new Error('Shipping is not enabled for this country.')
  await limitStoreRequest(`checkout:${args.context?.clientIp || 'unknown'}`, 10)
  const lines = await storePricedLines(input.items)
  const [quote] = await getDb().select().from(storeQuotes).where(eq(storeQuotes.id, input.quoteId)).limit(1)
  if (!quote || quote.expiresAt.getTime() <= Date.now() || quote.bindingHash !== hashStoreValue(quoteBinding({ ...input, lines })) || quote.snapshot.storeId !== process.env.PRINTFUL_STORE_ID)
    throw new Error('Your cart or address changed, or the shipping quote expired. Quote shipping again.')
  const db = getDb(), orderId = quote.orderId || crypto.randomUUID()
  const statusToken = storeStatusToken(orderId)
  if (!quote.orderId) {
    const [claimed] = await db.update(storeQuotes).set({ orderId }).where(and(eq(storeQuotes.id, quote.id), isNull(storeQuotes.orderId), lt(sql`now()`, storeQuotes.expiresAt))).returning()
    if (!claimed) throw new Error('Checkout is already starting. Try again.')
  }
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const stripe = storeStripe()
  const promotion = input.promoCode?.trim()
    ? await (await import('./store-coupons')).resolveStorePromotion({ code: input.promoCode, email: input.email, subtotalCents }, stripe)
    : null
  const livemode = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? '')
  // Live operation remains separately authorized, even for an admin private pilot.
  if (livemode && process.env.STORE_LIVE_PAYMENTS_AUTHORIZED !== 'true') throw new Error('Live store payments are not enabled.')
  if (auth) await (await import('../user-sync')).ensureUserProfile(auth.userId)
  await db.insert(merchOrders).values({ id: orderId, userId: auth?.userId ?? null, customerEmail: input.email,
    shippingAddress: quote.snapshot.address, subtotalCents, shippingCents: quote.snapshot.amountCents,
    totalCents: subtotalCents + quote.snapshot.amountCents, lineItems: lines, quoteSnapshot: quote.snapshot,
    promotionCode: promotion?.code ?? null, promotionCodeId: promotion?.id ?? null,
    statusTokenHash: hashStoreValue(statusToken), fulfillmentMode: settings.fulfillmentMode === 'automatic' && !shouldDraftPrintfulOrder(process.env, livemode) ? 'automatic' : 'manual', livemode,
  }).onConflictDoNothing()
  const [existing] = await db.select().from(merchOrders).where(eq(merchOrders.id, orderId)).limit(1)
  if ((existing.promotionCodeId ?? null) !== (promotion?.id ?? null)) throw new Error('The promo code changed. Quote shipping again.')
  if (existing.stripeCheckoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(existing.stripeCheckoutSessionId)
    if (!session.url || session.status !== 'open') throw new Error('This checkout is no longer open. Quote shipping again.')
    return { url: session.url, orderId }
  }
  const address = quote.snapshot.address
  // Per-order customers prevent races with Premium or another cart; never link these to profiles.
  const customer = await stripe.customers.create({ email: input.email, name: address.name,
    address: { line1: address.line1, line2: address.line2 ?? undefined, city: address.city, state: address.state ?? undefined, postal_code: address.postalCode, country: address.country },
    shipping: { name: address.name, phone: address.phone ?? undefined, address: { line1: address.line1, line2: address.line2 ?? undefined, city: address.city, state: address.state ?? undefined, postal_code: address.postalCode, country: address.country } },
    metadata: { orderType: 'merch', orderId },
  }, { idempotencyKey: `merch-customer-${orderId}` })
  const origin = (await import('../premium-membership')).resolvePremiumReturnOrigin(process.env.BETTER_AUTH_URL)
  const params = buildMerchCheckoutSessionParams({ orderId, lines, origin, shippingCents: quote.snapshot.amountCents, customerId: customer.id, customerEmail: null, automaticTax: process.env.STRIPE_AUTOMATIC_TAX === 'true' })
  // No hosted shipping edit. Tax uses this order customer's immutable shipping address.
  const { shipping_address_collection: _collection, ...fixed } = params
  fixed.shipping_options[0].shipping_rate_data.display_name = quote.snapshot.serviceName
  // Provider estimates have not been commercially approved. Never invent a delivery promise.
  const sessionParams: Stripe.Checkout.SessionCreateParams = { ...fixed,
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'true' },
    shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', display_name: quote.snapshot.serviceName, fixed_amount: { amount: quote.snapshot.amountCents, currency: 'usd' } } }],
    success_url: `${origin}/store/status?order=${orderId}&key=${statusToken}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/store?checkout=cancel`,
    payment_intent_data: { metadata: { orderType: 'merch', orderId } },
    ...(promotion ? { discounts: [{ promotion_code: promotion.id }] } : {}),
  }
  const session = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey: `merch-checkout-${orderId}` })
  if (!session.url) throw new Error('Could not start checkout. Try again.')
  // Stripe's discount is the one the webhook checks the paid total against.
  const discountCents = Math.max(0, session.total_details?.amount_discount ?? 0)
  await db.update(merchOrders).set({ stripeCheckoutSessionId: session.id, discountCents, totalCents: subtotalCents + quote.snapshot.amountCents - discountCents, updatedAt: new Date() }).where(eq(merchOrders.id, orderId))
  return { url: session.url, orderId }
}

export async function getStoreStatus(orderId: string, token: string) {
  await limitStoreRequest(`status:${hashStoreValue(token)}`, 60)
  const [order] = await getDb().select().from(merchOrders).where(and(eq(merchOrders.id, orderId), eq(merchOrders.statusTokenHash, hashStoreValue(token)))).limit(1)
  if (!order) throw new Error('This order link is unavailable.')
  // A redirect is only a lookup trigger. Stripe is authoritative about payment.
  if (order.stripeCheckoutSessionId && order.paymentStatus === 'unpaid') {
    const { fulfillMerchCheckoutEvent } = await import('./merch')
    const session = await storeStripe().checkout.sessions.retrieve(order.stripeCheckoutSessionId)
    await fulfillMerchCheckoutEvent({ type: 'checkout.session.completed', data: { object: session } }).catch(() => undefined)
  }
  const [current] = await getDb().select().from(merchOrders).where(eq(merchOrders.id, orderId)).limit(1)
  return { id: current.id, paymentStatus: current.paymentStatus, fulfillmentStatus: current.fulfillmentStatus,
    providerStatus: current.providerStatus, shipments: current.shipments, items: current.lineItems.map(l => ({ variantId: l.variantId, title: l.productTitle, variant: l.variantTitle, quantity: l.quantity, unitPriceCents: l.unitPriceCents })),
    subtotalCents: current.subtotalCents, shippingCents: current.shippingCents, taxCents: current.taxCents, discountCents: current.discountCents, promotionCode: current.promotionCode, totalCents: current.totalCents, refundCents: current.refundCents,
  }
}
