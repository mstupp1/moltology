import Stripe from 'stripe'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { creditTransactions, profiles } from '../../db/schema'
import { hasExperiment } from '../experiments'
import { MOLT_CREDIT_PACKS } from '../molt-credits'
import { readStripeId, resolvePremiumReturnOrigin } from '../premium-membership'
import { STRIPE_API_VERSION } from '../stripe-config'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

export const MOLT_CREDIT_ORDER_TYPE = 'molt_credits'

/** Members can buy credits only once this is true for them. Admins test with the experiment. */
export function canBuyCredits(role: string | null | undefined, experiments: unknown): boolean {
  return hasExperiment(role, experiments, 'molt-credits')
}

/** Lock, then refresh the cached balance from a fresh ledger sum (see gems.ts). */
export function creditBalanceRefresh(db: Db, userId: string) {
  return [
    db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).for('update'),
    db
      .update(profiles)
      .set({
        moltCredits: sql`(SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE "userId" = ${userId})`,
      })
      .where(eq(profiles.id, userId)),
  ] as const
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Molt Credit checkout is not configured.')
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION, timeout: 10_000, maxNetworkRetries: 1 })
}

export function buildCreditCheckoutParams(input: {
  userId: string
  packId: string
  origin: string
  customerId: string | null
}): Stripe.Checkout.SessionCreateParams {
  const pack = MOLT_CREDIT_PACKS.find((p) => p.id === input.packId)
  if (!pack) throw new Error('That pack is not available.')
  const metadata = {
    orderType: MOLT_CREDIT_ORDER_TYPE,
    userId: input.userId,
    packId: pack.id,
    credits: String(pack.credits),
  }
  return {
    mode: 'payment',
    client_reference_id: input.userId,
    ...(input.customerId ? { customer: input.customerId } : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pack.priceCents,
          product_data: {
            name: `${pack.credits.toLocaleString('en-US')} Molt Credits`,
            description: 'Spend in the Moltology market. Credits pay at the same price as Chitin Gems.',
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${input.origin}/market?credits=success`,
    cancel_url: `${input.origin}/market?credits=cancel`,
  }
}

export async function createCreditCheckoutHandler(args: {
  data?: { token?: string; packId: string }
  context?: WriteAuthContext
}): Promise<{ url: string }> {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  const [profile] = await auth.dbClient
    .select({ role: profiles.role, experiments: profiles.experiments, customerId: profiles.stripeCustomerId })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  if (!canBuyCredits(profile?.role, profile?.experiments)) throw new Error('Molt Credits are coming soon.')
  const params = buildCreditCheckoutParams({
    userId: auth.userId,
    packId: args.data?.packId ?? '',
    origin: resolvePremiumReturnOrigin(process.env.BETTER_AUTH_URL),
    customerId: profile?.customerId ?? null,
  })
  const session = await stripeClient().checkout.sessions.create(params)
  if (!session.url) throw new Error('Could not start checkout. Try again.')
  return { url: session.url }
}

const CREDIT_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded']

export function isCreditCheckoutEvent(event: { type: string; data?: { object?: unknown } | null }): boolean {
  if (!CREDIT_EVENTS.includes(event.type)) return false
  const metadata = (event.data?.object as { metadata?: Record<string, string> } | undefined)?.metadata
  return metadata?.orderType === MOLT_CREDIT_ORDER_TYPE
}

/**
 * Grants a paid pack once. The ledger key is the payment intent, so Stripe retries and the
 * async-payment event for the same payment can't double it. The credit amount comes from
 * the pack list, never from client input.
 */
export async function grantCreditsFromCheckout(
  event: { type: string; data: { object: unknown } },
  db: Db = getDb(),
): Promise<boolean> {
  const session = event.data.object as Stripe.Checkout.Session
  if (session.payment_status !== 'paid') return false
  const userId = session.metadata?.userId ?? session.client_reference_id
  const pack = MOLT_CREDIT_PACKS.find((p) => p.id === session.metadata?.packId)
  const paymentIntent = readStripeId(session.payment_intent) ?? session.id
  if (!userId || !pack) throw new Error('Molt Credit checkout is missing its member or pack.')
  if (session.amount_total !== null && session.amount_total !== pack.priceCents)
    throw new Error('Molt Credit checkout amount does not match its pack.')
  await db.batch([
    db
      .insert(creditTransactions)
      .values({
        userId,
        amount: pack.credits,
        source: 'stripe',
        sourceKey: `stripe:${paymentIntent}`,
        description: `Bought ${pack.credits.toLocaleString('en-US')} Molt Credits`,
      })
      .onConflictDoNothing(),
    ...creditBalanceRefresh(db, userId),
  ])
  return true
}

/**
 * Takes back a pack when its payment is fully refunded. Credits already spent leave the
 * balance negative, which blocks spending until it is topped up. Partial refunds are left
 * to the admin to settle by hand.
 */
export async function handleCreditRefundEvent(
  event: { type: string; data: { object: unknown } },
  db: Db = getDb(),
): Promise<boolean> {
  if (event.type !== 'charge.refunded') return false
  const charge = event.data.object as Stripe.Charge
  const paymentIntent = readStripeId(charge.payment_intent)
  if (!paymentIntent || !charge.refunded) return false
  const [grant] = await db
    .select({ userId: creditTransactions.userId, amount: creditTransactions.amount })
    .from(creditTransactions)
    .where(eq(creditTransactions.sourceKey, `stripe:${paymentIntent}`))
    .limit(1)
  if (!grant) return false
  await db.batch([
    db
      .insert(creditTransactions)
      .values({
        userId: grant.userId,
        amount: -grant.amount,
        source: 'refund',
        sourceKey: `refund:${paymentIntent}`,
        description: 'Refunded Molt Credit pack',
      })
      .onConflictDoNothing(),
    ...creditBalanceRefresh(db, grant.userId),
  ])
  return true
}

export async function creditBalance(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ balance: sql<number>`COALESCE(SUM(amount), 0)::int` })
    .from(creditTransactions)
    .where(and(eq(creditTransactions.userId, userId)))
  return row?.balance ?? 0
}
