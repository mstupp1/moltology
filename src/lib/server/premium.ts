import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { authUser, profiles } from '../../db/schema'
import { canViewHiddenPages } from '../hidden-pages'
import {
  buildPremiumCheckoutSessionParams,
  buildPremiumPortalParams,
  createPremiumIntegrationIdentifier,
  emptyPremiumMembership,
  formatPremiumPriceLabel,
  interpretPremiumStripeEvent,
  mergeRetrievedSubscription,
  premiumPriceMatchesProduct,
  readStripeId,
  readStripePremiumConfig,
  readSubscriptionPeriodEndUnix,
  reducePremiumMembership,
  resolvePremiumReturnOrigin,
  type PremiumMembershipState,
  type PremiumOffer,
  type PremiumStripeEffect,
  type RetrievedSubscription,
} from '../premium-membership'
import { createStripeWebhookVerifier, verifyStripeWebhookSignature } from '../stripe-webhook'
import { ensureUserProfile } from '../user-sync'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type HandlerArgs = {
  data?: { token?: string; userId?: string }
  context?: WriteAuthContext | null
}

class PremiumEventUnmatchedError extends Error {
  constructor() {
    super('No member matches this Stripe event.')
    this.name = 'PremiumEventUnmatchedError'
  }
}

function createStripeClient(secretKey: string) {
  return new Stripe(secretKey, {
    apiVersion: '2026-07-29.dahlia',
  })
}

function configErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.startsWith('Premium billing is not configured')) {
    return error.message
  }
  return null
}

function safeLog(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'unknown'
  if (/sk_|rk_|whsec_/.test(message)) {
    console.error(`[premium] ${scope} failed`)
    return
  }
  console.error(`[premium] ${scope} failed:`, message)
}

function toPublicBillingError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    if (
      configErrorMessage(error) ||
      error.message === 'This page is not available.' ||
      error.message === 'Subscribe to Premium before managing a membership.' ||
      error.message.startsWith('Unauthenticated') ||
      error.message.startsWith('Unauthorized') ||
      error.message === 'Could not load your membership. Try again.'
    ) {
      return error
    }
  }
  safeLog('billing', error)
  return new Error(fallback)
}

async function requirePremiumOperator(args: HandlerArgs) {
  const auth = await resolveWriteAuth({ data: args.data, context: args.context })
  if (!auth) throw new Error('Unauthenticated: Authentication required.')
  await ensureUserProfile(auth.userId)
  const [profile] = await auth.dbClient
    .select()
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  if (!profile) throw new Error('Could not load your membership. Try again.')
  const email = typeof auth.payload?.email === 'string' ? auth.payload.email : null
  if (!canViewHiddenPages({ email, role: profile.role }, profile.role)) {
    throw new Error('This page is not available.')
  }
  return { auth, profile }
}

async function memberEmail(dbClient: ReturnType<typeof getDb>, userId: string): Promise<string | null> {
  const [row] = await dbClient
    .select({ email: authUser.email })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1)
  return row?.email ?? null
}

export async function getPremiumMembershipHandler(args: HandlerArgs) {
  const auth = await resolveWriteAuth({ data: args.data, context: args.context, requireAuth: false })
  if (!auth) return null
  const [profile] = await auth.dbClient
    .select({
      hasPurchasedPremium: profiles.hasPurchasedPremium,
      isPremium: profiles.isPremium,
    })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  if (!profile) return { hasPurchasedPremium: false, isPremium: false }
  return profile
}

export async function getPremiumOfferHandler(args: HandlerArgs): Promise<PremiumOffer> {
  const { profile } = await requirePremiumOperator(args)
  const base = {
    hasPurchasedPremium: profile.hasPurchasedPremium,
    isPremium: profile.isPremium,
    canManage: Boolean(profile.stripeCustomerId),
  }
  try {
    const config = readStripePremiumConfig(process.env, { secret: true, price: true }, process.env.NODE_ENV)
    const stripe = createStripeClient(config.secretKey)
    const price = await stripe.prices.retrieve(config.priceId!)
    if (!premiumPriceMatchesProduct(price.product, config.productId)) {
      throw new Error(
        'Premium billing is not configured. STRIPE_PREMIUM_PRICE_ID does not match STRIPE_PREMIUM_PRODUCT_ID.',
      )
    }
    return {
      ...base,
      priceLabel: formatPremiumPriceLabel({
        unitAmount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval ?? null,
      }),
      configured: true,
      configMessage: null,
    }
  } catch (error) {
    const configMessage = configErrorMessage(error)
    if (!configMessage) safeLog('price lookup', error)
    return {
      ...base,
      priceLabel: null,
      configured: false,
      configMessage: configMessage ?? 'Could not load Premium pricing. Try again.',
    }
  }
}

export async function createPremiumCheckoutHandler(args: HandlerArgs): Promise<{ url: string }> {
  try {
    const { auth, profile } = await requirePremiumOperator(args)
    const config = readStripePremiumConfig(process.env, { secret: true, price: true }, process.env.NODE_ENV)
    const stripe = createStripeClient(config.secretKey)
    const price = await stripe.prices.retrieve(config.priceId!)
    if (!premiumPriceMatchesProduct(price.product, config.productId)) {
      throw new Error(
        'Premium billing is not configured. STRIPE_PREMIUM_PRICE_ID does not match STRIPE_PREMIUM_PRODUCT_ID.',
      )
    }
    const origin = resolvePremiumReturnOrigin(process.env.BETTER_AUTH_URL)
    const session = await stripe.checkout.sessions.create(
      buildPremiumCheckoutSessionParams({
        priceId: config.priceId!,
        userId: auth.userId,
        customerId: profile.stripeCustomerId,
        customerEmail: profile.stripeCustomerId ? null : await memberEmail(auth.dbClient, auth.userId),
        origin,
        integrationIdentifier: createPremiumIntegrationIdentifier(),
      }),
    )
    const customerId = readStripeId(session.customer)
    if (customerId && customerId !== profile.stripeCustomerId) {
      await auth.dbClient
        .update(profiles)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(profiles.id, auth.userId))
    }
    if (!session.url) throw new Error('Could not start checkout. Try again.')
    return { url: session.url }
  } catch (error) {
    throw toPublicBillingError(error, 'Could not start checkout. Try again.')
  }
}

export async function createPremiumPortalHandler(args: HandlerArgs): Promise<{ url: string }> {
  try {
    const { profile } = await requirePremiumOperator(args)
    if (!profile.stripeCustomerId) {
      throw new Error('Subscribe to Premium before managing a membership.')
    }
    const config = readStripePremiumConfig(process.env, { secret: true }, process.env.NODE_ENV)
    const stripe = createStripeClient(config.secretKey)
    const origin = resolvePremiumReturnOrigin(process.env.BETTER_AUTH_URL)
    const session = await stripe.billingPortal.sessions.create(
      buildPremiumPortalParams({ customerId: profile.stripeCustomerId, origin }),
    )
    if (!session.url) throw new Error('Could not open membership management. Try again.')
    return { url: session.url }
  } catch (error) {
    throw toPublicBillingError(error, 'Could not open membership management. Try again.')
  }
}

function subscriptionSnapshot(subscription: Stripe.Subscription): RetrievedSubscription {
  const record = subscription as unknown as Record<string, unknown>
  return {
    id: subscription.id,
    customerId: readStripeId(subscription.customer),
    status: subscription.status,
    periodEndUnix: readSubscriptionPeriodEndUnix(record),
    metadataUserId: subscription.metadata?.userId?.trim() || null,
  }
}

function isMissingStripeResource(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'resource_missing'
}

async function resolvePremiumUserId(
  dbClient: ReturnType<typeof getDb>,
  effect: Extract<PremiumStripeEffect, { kind: 'sync' }>,
): Promise<string | null> {
  if (effect.userId) {
    const [byId] = await dbClient
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, effect.userId))
      .limit(1)
    if (byId) return byId.id
  }
  if (effect.customerId) {
    const [byCustomer] = await dbClient
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.stripeCustomerId, effect.customerId))
      .limit(1)
    if (byCustomer) return byCustomer.id
  }
  if (effect.subscriptionId) {
    const [bySubscription] = await dbClient
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.stripeSubscriptionId, effect.subscriptionId))
      .limit(1)
    if (bySubscription) return bySubscription.id
  }
  return null
}

function membershipFromRow(row: {
  hasPurchasedPremium: boolean
  isPremium: boolean
  premiumStatus: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  premiumPeriodEnd: Date | null
  premiumSyncedAt: Date | null
}): PremiumMembershipState {
  return {
    hasPurchasedPremium: row.hasPurchasedPremium,
    isPremium: row.isPremium,
    premiumStatus: row.premiumStatus,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    premiumPeriodEnd: row.premiumPeriodEnd,
    premiumSyncedAt: row.premiumSyncedAt,
  }
}

export async function applyPremiumStripeEvent(event: Stripe.Event, secretKey: string): Promise<{ ignored: boolean }> {
  let effect = interpretPremiumStripeEvent(event)
  if (effect.kind === 'ignore') return { ignored: true }

  let eventCreated = new Date(effect.eventCreated * 1000)
  if (effect.subscriptionId) {
    const stripe = createStripeClient(secretKey)
    try {
      const subscription = await stripe.subscriptions.retrieve(effect.subscriptionId)
      effect = mergeRetrievedSubscription(effect, subscriptionSnapshot(subscription))
      eventCreated = new Date()
    } catch (error) {
      if (!(isMissingStripeResource(error) && effect.kind === 'sync' && effect.applyStatus)) {
        safeLog('subscription retrieve', error)
        throw new Error('Could not apply Stripe event.')
      }
    }
  }
  if (effect.kind !== 'sync') return { ignored: true }

  const dbClient = getDb()
  const userId = await resolvePremiumUserId(dbClient, effect)
  if (!userId) throw new PremiumEventUnmatchedError()

  const [row] = await dbClient
    .select({
      hasPurchasedPremium: profiles.hasPurchasedPremium,
      isPremium: profiles.isPremium,
      premiumStatus: profiles.premiumStatus,
      stripeCustomerId: profiles.stripeCustomerId,
      stripeSubscriptionId: profiles.stripeSubscriptionId,
      premiumPeriodEnd: profiles.premiumPeriodEnd,
      premiumSyncedAt: profiles.premiumSyncedAt,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  if (!row) throw new PremiumEventUnmatchedError()

  const next = reducePremiumMembership(membershipFromRow(row) ?? emptyPremiumMembership(), {
    eventCreated,
    customerId: effect.customerId,
    subscriptionId: effect.subscriptionId,
    subscriptionStatus: effect.subscriptionStatus,
    periodEnd: effect.periodEndUnix ? new Date(effect.periodEndUnix * 1000) : null,
    markPurchased: effect.markPurchased,
    applyStatus: effect.applyStatus,
  })

  await dbClient
    .update(profiles)
    .set({
      hasPurchasedPremium: next.hasPurchasedPremium,
      isPremium: next.isPremium,
      premiumStatus: next.premiumStatus,
      stripeCustomerId: next.stripeCustomerId,
      stripeSubscriptionId: next.stripeSubscriptionId,
      premiumPeriodEnd: next.premiumPeriodEnd,
      premiumSyncedAt: next.premiumSyncedAt,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))

  return { ignored: false }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function handleStripeWebhookRequest(request: Request): Promise<Response> {
  let secretKey = ''
  let webhookSecret = ''
  try {
    const config = readStripePremiumConfig(process.env, { secret: true, webhook: true }, process.env.NODE_ENV)
    secretKey = config.secretKey
    webhookSecret = config.webhookSecret || ''
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Premium billing is not configured.'
    return json({ error: message }, 500)
  }

  const payload = await request.text()
  let event: Stripe.Event
  try {
    event = verifyStripeWebhookSignature(
      createStripeWebhookVerifier(),
      payload,
      request.headers.get('stripe-signature'),
      webhookSecret,
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('STRIPE_WEBHOOK_SECRET')) {
      return json({ error: error.message }, 500)
    }
    return json({ error: 'Invalid Stripe signature.' }, 400)
  }

  try {
    const result = await applyPremiumStripeEvent(event, secretKey)
    return json({ received: true, ignored: result.ignored }, 200)
  } catch (error) {
    safeLog(`webhook ${event.type}`, error)
    if (error instanceof PremiumEventUnmatchedError) {
      return json({ error: error.message }, 500)
    }
    return json({ error: 'Could not apply Stripe event.' }, 500)
  }
}
