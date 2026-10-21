import Stripe from 'stripe'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { getDb } from '../../db'
import { merchOrders, merchProducts, merchVariants, profiles } from '../../db/schema'
import {
  readMerchCheckoutCompletion,
  type CheckoutLineRequest,
  type LooseCheckoutSession,
  type MerchProductView,
  type MerchVariantView,
} from '../merch'
import { type WriteAuthContext } from './write-auth'
import { requireStoreAccess, createQuotedCheckout } from './store'
import { storeOverrides } from '../../db/schema'
import { fulfillPaidMerchOrder } from './merch-fulfillment'

type HandlerArgs = {
  data?: {
    token?: string
    userId?: string
    slug?: string
    items?: CheckoutLineRequest[]
  }
  context?: WriteAuthContext | null
}

const PUBLIC_MERCH_ERRORS = new Set([
  'Sign in to open the store.',
  'This page is not available.',
  'Add at least one piece before checkout.',
  'Could not start checkout. Try again.',
])

export class MerchOrderMissingError extends Error {
  constructor() {
    super('No merch order matches this Stripe event.')
    this.name = 'MerchOrderMissingError'
  }
}

function toPublicMerchError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    if (PUBLIC_MERCH_ERRORS.has(error.message) || error.message.startsWith('Choose a quantity') || error.message.startsWith('Checkout can include')) {
      return error
    }
    if (error.message.startsWith('Unauthenticated')) {
      return new Error('Sign in to open the store.')
    }
  }
  console.error('[merch]', error)
  return new Error(fallback)
}

function toVariantView(row: {
  id: string
  title: string
  size: string | null
  color: string | null
  colorHex: string | null
  priceCents: number
  imageUrl: string | null
}): MerchVariantView {
  return {
    id: row.id,
    title: row.title,
    size: row.size,
    color: row.color,
    colorHex: row.colorHex,
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
  }
}

export async function getMerchCatalogHandler(args: HandlerArgs): Promise<MerchProductView[]> {
  try {
    await requireStoreAccess(args)
    const auth = { dbClient: getDb() }
    const products = await auth.dbClient
      .select()
      .from(merchProducts)
      .orderBy(asc(merchProducts.sortOrder), asc(merchProducts.title))
    if (products.length === 0) return []

    const variants = await auth.dbClient
      .select()
      .from(merchVariants)
      .where(inArray(merchVariants.productId, products.map(product => product.id)))
      .orderBy(asc(merchVariants.title))

    const overrides = await getDb().select().from(storeOverrides)
    const enabled = new Map(overrides.map(row => [row.id, row.enabled]))
    return products.filter(p => enabled.get(p.id) ?? p.isPublished).map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      category: product.category,
      featuredImageUrl: product.featuredImageUrl,
      galleryImageUrls: product.galleryImageUrls ?? [],
      basePriceCents: product.basePriceCents,
      sortOrder: product.sortOrder,
      variants: variants.filter((variant) => variant.productId === product.id && (enabled.get(variant.id) ?? variant.isAvailable)).map(toVariantView),
    }))
  } catch (error) {
    throw toPublicMerchError(error, 'Could not load the store. Try again.')
  }
}

export async function getMerchProductBySlugHandler(args: HandlerArgs): Promise<MerchProductView | null> {
  try {
    const slug = args.data?.slug?.trim()
    if (!slug) return null
    const catalog = await getMerchCatalogHandler(args)
    return catalog.find(product => product.slug === slug) ?? null
  } catch (error) {
    throw toPublicMerchError(error, 'Could not load that piece. Try again.')
  }
}

export async function createMerchCheckoutSessionHandler(args: HandlerArgs): Promise<{ url: string }> {
  return createQuotedCheckout(args as Parameters<typeof createQuotedCheckout>[0])
}

async function rememberStripeCustomer(userId: string | null, customerId: string | null) {
  if (!userId || !customerId) return
  try {
    await getDb()
      .update(profiles)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(and(eq(profiles.id, userId), isNull(profiles.stripeCustomerId)))
  } catch (error) {
    console.error('[merch] customer link', error)
  }
}

export async function fulfillMerchCheckoutEvent(event: {
  type?: string
  data?: { object?: unknown } | null
}, retry = false): Promise<void> {
  const session = (event.data?.object ?? {}) as LooseCheckoutSession
  const completion = readMerchCheckoutCompletion(session)
  if (!completion) return
  const db = getDb()
  const rows = completion.orderId
    ? await db.select().from(merchOrders).where(eq(merchOrders.id, completion.orderId)).limit(1)
    : []
  const order = rows[0]
  if (!order || !completion.sessionId) throw new MerchOrderMissingError()
  if (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== completion.sessionId) {
    throw new Error('Stripe session does not match the merch order.')
  }
  if (order.quoteSnapshot) {
    if (Boolean(session.livemode) !== order.livemode) throw new Error('Stripe payment mode does not match the order.')
    if (completion.paid && (completion.currency !== order.currency || completion.subtotalCents !== order.subtotalCents || completion.shippingCents !== order.shippingCents || completion.discountCents !== order.discountCents || completion.totalCents !== order.subtotalCents + order.shippingCents - order.discountCents + (completion.taxCents ?? 0)))
      throw new Error('Stripe totals do not match the approved order snapshot.')
    completion.shipping = order.shippingAddress
    completion.email = order.customerEmail
  }
  if (completion.paid) {
    await db.update(merchOrders).set({ paymentStatus: 'paid', livemode: session.livemode === true,
      ...(completion.taxCents != null ? { taxCents: completion.taxCents } : {}),
      ...(completion.totalCents != null ? { totalCents: completion.totalCents } : {}),
      stripePaymentIntentId: typeof (session as any).payment_intent === 'string' ? (session as any).payment_intent : null,
    }).where(and(eq(merchOrders.id, order.id), inArray(merchOrders.paymentStatus, ['unpaid', 'failed', 'paid'])))
    if (order.statusTokenHash) {
      const { enqueueOrderConfirmation, syncStoreRefund } = await import('./store-operations')
      if (typeof (session as any).payment_intent === 'string') await syncStoreRefund((session as any).payment_intent)
      await enqueueOrderConfirmation(order.id)
    }
  }
  if (['printful_draft', 'submitted_to_printful'].includes(order.fulfillmentStatus)) return

  if (event.type === 'checkout.session.async_payment_failed' || !completion.paid) {
    await db.update(merchOrders).set({
      stripeCheckoutSessionId: completion.sessionId,
      customerEmail: completion.email ?? order.customerEmail,
      shippingAddress: completion.shipping ?? order.shippingAddress,
      paymentStatus: event.type === 'checkout.session.async_payment_failed' ? 'failed' : 'unpaid',
      fulfillmentStatus: event.type === 'checkout.session.async_payment_failed' ? 'payment_failed' : 'awaiting_payment',
      updatedAt: new Date(),
    }).where(and(eq(merchOrders.id, order.id), inArray(merchOrders.paymentStatus, ['unpaid', 'failed']), inArray(merchOrders.fulfillmentStatus, ['pending', 'awaiting_payment', 'payment_failed'])))
    return
  }
  await fulfillPaidMerchOrder(db, order.id, completion, session.livemode === true, retry)
  if (!order.quoteSnapshot) await rememberStripeCustomer(order.userId, completion.customerId)
}

/** Operator-only CLI path: re-read Stripe payment before retrying the saved snapshot. */
export async function retryMerchOrder(orderId: string): Promise<void> {
  const [order] = await getDb().select().from(merchOrders).where(eq(merchOrders.id, orderId)).limit(1)
  if (!order?.stripeCheckoutSessionId) throw new Error('Order has no Stripe checkout session.')
  if (order.refundCents > 0) throw new Error('Refunded orders require provider dashboard review.')
  if (!['fulfillment_failed', 'processing', 'paid'].includes(order.fulfillmentStatus)) {
    throw new Error('Only failed, interrupted, or paid orders can be retried.')
  }
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is missing.')
  const stripe = new Stripe(key, { apiVersion: '2026-07-29.dahlia', timeout: 10_000, maxNetworkRetries: 0 })
  const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId)
  if (session.metadata?.orderId !== order.id || session.metadata?.orderType !== 'merch' || session.payment_status !== 'paid') {
    throw new Error('Stripe has not confirmed payment for this merch order.')
  }
  // Shipping and items come from the persisted paid order, not mutable catalog records.
  const completion = readMerchCheckoutCompletion(session)
  if (!completion) throw new Error('Invalid merch checkout session.')
  completion.shipping = order.shippingAddress
  completion.email = order.customerEmail
  if (order.quoteSnapshot) await fulfillMerchCheckoutEvent({ type: 'checkout.session.completed', data: { object: session } }, true)
  else await fulfillPaidMerchOrder(getDb(), order.id, completion, session.livemode, true)
}
