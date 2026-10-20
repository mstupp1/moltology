import Stripe from 'stripe'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { getDb } from '../../db'
import { authUser, merchOrders, merchProducts, merchVariants, profiles } from '../../db/schema'
import { hasExperiment } from '../experiments'
import {
  buildMerchCheckoutSessionParams,
  buildPricedCheckoutLines,
  readAutomaticTaxEnabled,
  readMerchCheckoutCompletion,
  readMerchShippingCents,
  type CheckoutLineRequest,
  type LooseCheckoutSession,
  type MerchProductView,
  type MerchVariantView,
  type PricedVariant,
} from '../merch'
import { MERCH_PREVIEW, MERCH_PREVIEW_CHECKOUT_ERROR } from '../merch-preview'
import { merchCatalogView } from '../merch-seed-data'
import { readStripePremiumConfig, resolvePremiumReturnOrigin } from '../premium-membership'
import { ensureUserProfile } from '../user-sync'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'
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
  MERCH_PREVIEW_CHECKOUT_ERROR,
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

async function requireMerchOperator(args: HandlerArgs) {
  const auth = await resolveWriteAuth({ data: args.data, context: args.context })
  if (!auth) throw new Error('Sign in to open the store.')
  await ensureUserProfile(auth.userId)
  const [profile] = await auth.dbClient
    .select({
      role: profiles.role,
      experiments: profiles.experiments,
      stripeCustomerId: profiles.stripeCustomerId,
    })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  if (!profile) throw new Error('This page is not available.')
  const email = typeof auth.payload?.email === 'string' ? auth.payload.email : null
  if (!hasExperiment(profile.role, profile.experiments, 'new-store')) {
    throw new Error('This page is not available.')
  }
  return { auth, profile, email }
}

async function memberEmail(userId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ email: authUser.email })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1)
  return row?.email ?? null
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
  if (MERCH_PREVIEW) return merchCatalogView()
  try {
    const { auth } = await requireMerchOperator(args)
    const products = await auth.dbClient
      .select()
      .from(merchProducts)
      .where(eq(merchProducts.isPublished, true))
      .orderBy(asc(merchProducts.sortOrder), asc(merchProducts.title))
    if (products.length === 0) return []

    const variants = await auth.dbClient
      .select()
      .from(merchVariants)
      .where(
        and(
          inArray(
            merchVariants.productId,
            products.map((product) => product.id),
          ),
          eq(merchVariants.isAvailable, true),
        ),
      )
      .orderBy(asc(merchVariants.title))

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      category: product.category,
      featuredImageUrl: product.featuredImageUrl,
      galleryImageUrls: product.galleryImageUrls ?? [],
      basePriceCents: product.basePriceCents,
      sortOrder: product.sortOrder,
      variants: variants.filter((variant) => variant.productId === product.id).map(toVariantView),
    }))
  } catch (error) {
    throw toPublicMerchError(error, 'Could not load the store. Try again.')
  }
}

export async function getMerchProductBySlugHandler(args: HandlerArgs): Promise<MerchProductView | null> {
  try {
    const slug = args.data?.slug?.trim()
    if (!slug) return null
    if (MERCH_PREVIEW) return merchCatalogView().find((product) => product.slug === slug) ?? null
    const { auth } = await requireMerchOperator(args)
    const [product] = await auth.dbClient
      .select()
      .from(merchProducts)
      .where(and(eq(merchProducts.slug, slug), eq(merchProducts.isPublished, true)))
      .limit(1)
    if (!product) return null
    const variants = await auth.dbClient
      .select()
      .from(merchVariants)
      .where(and(eq(merchVariants.productId, product.id), eq(merchVariants.isAvailable, true)))
      .orderBy(asc(merchVariants.title))
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      category: product.category,
      featuredImageUrl: product.featuredImageUrl,
      galleryImageUrls: product.galleryImageUrls ?? [],
      basePriceCents: product.basePriceCents,
      sortOrder: product.sortOrder,
      variants: variants.map(toVariantView),
    }
  } catch (error) {
    throw toPublicMerchError(error, 'Could not load that piece. Try again.')
  }
}

export async function createMerchCheckoutSessionHandler(args: HandlerArgs): Promise<{ url: string }> {
  const db = getDb()
  let orderId: string | null = null
  if (MERCH_PREVIEW) throw new Error(MERCH_PREVIEW_CHECKOUT_ERROR)
  try {
    const { auth, profile } = await requireMerchOperator(args)
    const requested = args.data?.items ?? []
    const variantIds = [...new Set(requested.map((item) => item.variantId?.trim()).filter(Boolean))]
    const rows = variantIds.length
      ? await db
          .select({
            variantId: merchVariants.id,
            productId: merchProducts.id,
            productTitle: merchProducts.title,
            productSlug: merchProducts.slug,
            productPublished: merchProducts.isPublished,
            variantTitle: merchVariants.title,
            size: merchVariants.size,
            color: merchVariants.color,
            printfulSyncVariantId: merchVariants.printfulSyncVariantId,
            priceCents: merchVariants.priceCents,
            isAvailable: merchVariants.isAvailable,
          })
          .from(merchVariants)
          .innerJoin(merchProducts, eq(merchVariants.productId, merchProducts.id))
          .where(inArray(merchVariants.id, variantIds))
      : []

    const checkout = buildPricedCheckoutLines(rows as PricedVariant[], requested)
    if (!checkout.ok) throw new Error(checkout.message)

    const subtotalCents = checkout.lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
    const shippingCents = readMerchShippingCents(process.env.MERCH_SHIPPING_CENTS)
    const email = (await memberEmail(auth.userId)) || (typeof auth.payload?.email === 'string' ? auth.payload.email : null)
    orderId = crypto.randomUUID()

    await db.insert(merchOrders).values({
      id: orderId,
      userId: auth.userId,
      customerEmail: email,
      fulfillmentStatus: 'pending',
      subtotalCents,
      shippingCents,
      taxCents: 0,
      totalCents: subtotalCents + shippingCents,
      currency: 'usd',
      lineItems: checkout.lines,
    })

    const config = readStripePremiumConfig(process.env, { secret: true }, process.env.NODE_ENV)
    const origin = resolvePremiumReturnOrigin(process.env.BETTER_AUTH_URL)
    const stripe = new Stripe(config.secretKey, { apiVersion: '2026-07-29.dahlia' })
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create(
        buildMerchCheckoutSessionParams({
          orderId,
          lines: checkout.lines,
          origin,
          shippingCents,
          customerId: profile.stripeCustomerId,
          customerEmail: profile.stripeCustomerId ? null : email,
          automaticTax: readAutomaticTaxEnabled(process.env.STRIPE_AUTOMATIC_TAX),
        }),
        { idempotencyKey: `merch-checkout-${orderId}` },
      )
    } catch (error) {
      await db.delete(merchOrders).where(eq(merchOrders.id, orderId))
      orderId = null
      console.error('[merch] checkout', error)
      throw new Error('Could not start checkout. Try again.')
    }

    if (!session.url) {
      await db.delete(merchOrders).where(eq(merchOrders.id, orderId))
      throw new Error('Could not start checkout. Try again.')
    }

    await db
      .update(merchOrders)
      .set({ stripeCheckoutSessionId: session.id, updatedAt: new Date() })
      .where(eq(merchOrders.id, orderId))

    return { url: session.url }
  } catch (error) {
    throw toPublicMerchError(error, 'Could not start checkout. Try again.')
  }
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
  if (['printful_draft', 'submitted_to_printful'].includes(order.fulfillmentStatus)) return

  if (event.type === 'checkout.session.async_payment_failed' || !completion.paid) {
    await db.update(merchOrders).set({
      stripeCheckoutSessionId: completion.sessionId,
      customerEmail: completion.email ?? order.customerEmail,
      shippingAddress: completion.shipping ?? order.shippingAddress,
      fulfillmentStatus: event.type === 'checkout.session.async_payment_failed' ? 'payment_failed' : 'awaiting_payment',
      updatedAt: new Date(),
    }).where(and(eq(merchOrders.id, order.id), inArray(merchOrders.fulfillmentStatus, ['pending', 'awaiting_payment', 'payment_failed'])))
    return
  }
  await fulfillPaidMerchOrder(db, order.id, completion, session.livemode === true, retry)
  await rememberStripeCustomer(order.userId, completion.customerId)
}

/** Operator-only CLI path: re-read Stripe payment before retrying the saved snapshot. */
export async function retryMerchOrder(orderId: string): Promise<void> {
  const [order] = await getDb().select().from(merchOrders).where(eq(merchOrders.id, orderId)).limit(1)
  if (!order?.stripeCheckoutSessionId) throw new Error('Order has no Stripe checkout session.')
  if (!['fulfillment_failed', 'processing', 'paid'].includes(order.fulfillmentStatus)) {
    throw new Error('Only failed, interrupted, or paid orders can be retried.')
  }
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is missing.')
  const stripe = new Stripe(key, { apiVersion: '2026-07-29.dahlia' })
  const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId)
  if (session.metadata?.orderId !== order.id || session.metadata?.orderType !== 'merch' || session.payment_status !== 'paid') {
    throw new Error('Stripe has not confirmed payment for this merch order.')
  }
  // Shipping and items come from the persisted paid order, not mutable catalog records.
  const completion = readMerchCheckoutCompletion(session)
  if (!completion) throw new Error('Invalid merch checkout session.')
  completion.shipping = order.shippingAddress
  completion.email = order.customerEmail
  await fulfillPaidMerchOrder(getDb(), order.id, completion, session.livemode, true)
}
