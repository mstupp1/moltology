/**
 * Premium membership rules.
 *
 * Paid user (`hasPurchasedPremium`) means the member has paid at least once.
 * Premium member (`isPremium`) means a Premium subscription is currently active.
 * Those flags stay distinct. This module does not grant rank, clearance, stage,
 * forum authority, or Chitin Gems.
 */

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
])

/** Stripe statuses that mean the subscription is currently in force. */
const CURRENT_PREMIUM_STATUSES = new Set(['active'])

/**
 * Statuses that only exist after a paid subscription has been established.
 * `canceled` is excluded: an unpaid checkout can also end as canceled.
 */
const PURCHASE_STATUSES = new Set(['active', 'past_due', 'unpaid', 'paused'])

export const PREMIUM_PAGE_COPY = {
  title: 'Premium membership',
  eyebrow: 'Monthly membership',
  description:
    'Premium does not change your rank, clearance, stage, or forum authority. Chitin Gems stay earned. Signup stays free.',
  benefitsTitle: 'What Premium unlocks',
  benefitsBody: 'Premium benefits are not available yet.',
  active: 'Your Premium membership is active.',
  lapsed: 'You have purchased Premium before. It is not active right now.',
  free: 'You do not have an active Premium membership.',
  subscribe: 'Subscribe to Premium',
  manage: 'Manage membership',
  checkoutSuccess: 'Checkout completed. Your membership status will update shortly.',
  checkoutCancel: 'Checkout was canceled. No charge was made.',
  pricePending: 'Monthly price will appear when billing is configured.',
} as const

export function premiumBannerCopy(hasPurchasedPremium: boolean): {
  title: string
  body: string
  action: string
} {
  if (hasPurchasedPremium) {
    return {
      title: 'Premium',
      body: 'Your Premium membership is not active. Rank, clearance, stage, and forum authority stay earned.',
      action: 'View Premium',
    }
  }
  return {
    title: 'Premium',
    body: 'A monthly membership. Rank, clearance, stage, and forum authority stay earned.',
    action: 'View Premium',
  }
}

/** Free and paid-but-not-current see the banner. Current Premium does not. */
export function shouldShowPremiumBanner(state: { isPremium: boolean }): boolean {
  return !state.isPremium
}

/**
 * Soft launch: the dashboard banner follows the membership matrix and stays
 * with the same admin audience that can open the hidden Premium page.
 */
export function shouldShowPremiumDashboardBanner(input: {
  isPremium: boolean
  canViewHiddenPages: boolean
}): boolean {
  return input.canViewHiddenPages && shouldShowPremiumBanner(input)
}

/**
 * TODO: define what an active Premium membership unlocks.
 * Do not grant rank, clearance, stage, forum authority, or Chitin Gems.
 */
export function listPremiumEntitlements(_isPremium: boolean): readonly string[] {
  return []
}

export function isCurrentPremiumStatus(status: string | null | undefined): boolean {
  return !!status && CURRENT_PREMIUM_STATUSES.has(status)
}

export function subscriptionStatusImpliesPurchase(status: string | null | undefined): boolean {
  return !!status && PURCHASE_STATUSES.has(status)
}

export interface PremiumMembershipState {
  hasPurchasedPremium: boolean
  isPremium: boolean
  premiumStatus: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  premiumPeriodEnd: Date | null
  premiumSyncedAt: Date | null
}

export function emptyPremiumMembership(): PremiumMembershipState {
  return {
    hasPurchasedPremium: false,
    isPremium: false,
    premiumStatus: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    premiumPeriodEnd: null,
    premiumSyncedAt: null,
  }
}

export interface PremiumSyncInput {
  eventCreated: Date
  customerId?: string | null
  subscriptionId?: string | null
  subscriptionStatus?: string | null
  periodEnd?: Date | null
  markPurchased?: boolean
  applyStatus?: boolean
}

/**
 * Apply one billing update. A stale event may still set the sticky paid flag,
 * but it must not roll back a newer subscription status.
 */
export function reducePremiumMembership(
  previous: PremiumMembershipState,
  input: PremiumSyncInput,
): PremiumMembershipState {
  const next: PremiumMembershipState = { ...previous }
  if (input.customerId) next.stripeCustomerId = input.customerId
  if (input.markPurchased) next.hasPurchasedPremium = true

  const stale =
    previous.premiumSyncedAt != null && input.eventCreated.getTime() < previous.premiumSyncedAt.getTime()
  if (input.applyStatus && !stale) {
    if (input.subscriptionId) next.stripeSubscriptionId = input.subscriptionId
    next.premiumStatus = input.subscriptionStatus ?? null
    next.premiumPeriodEnd = input.periodEnd ?? null
    next.premiumSyncedAt = input.eventCreated
    next.isPremium = isCurrentPremiumStatus(input.subscriptionStatus)
    if (subscriptionStatusImpliesPurchase(input.subscriptionStatus)) {
      next.hasPurchasedPremium = true
    }
  }
  return next
}

export type PremiumStripeEffect =
  | { kind: 'ignore' }
  | {
      kind: 'sync'
      eventCreated: number
      userId: string | null
      customerId: string | null
      subscriptionId: string | null
      subscriptionStatus: string | null
      periodEndUnix: number | null
      markPurchased: boolean
      applyStatus: boolean
    }

export interface RetrievedSubscription {
  id: string
  customerId: string | null
  status: string
  periodEndUnix: number | null
  metadataUserId: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function readStripeId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  const record = asRecord(value)
  if (record && typeof record.id === 'string' && record.id.trim()) return record.id.trim()
  return null
}

function readMetadataUserId(metadata: unknown): string | null {
  const record = asRecord(metadata)
  if (!record || typeof record.userId !== 'string') return null
  const userId = record.userId.trim()
  return userId || null
}

export function readSubscriptionPeriodEndUnix(subscription: Record<string, unknown>): number | null {
  const items = asRecord(subscription.items)
  const data = items && Array.isArray(items.data) ? items.data : []
  const first = asRecord(data[0])
  if (first && typeof first.current_period_end === 'number') return first.current_period_end
  if (typeof subscription.current_period_end === 'number') return subscription.current_period_end
  return null
}

function ignoreEffect(): PremiumStripeEffect {
  return { kind: 'ignore' }
}

function syncEffect(
  eventCreated: number,
  fields: Omit<Extract<PremiumStripeEffect, { kind: 'sync' }>, 'kind' | 'eventCreated'>,
): PremiumStripeEffect {
  return { kind: 'sync', eventCreated, ...fields }
}

export function interpretPremiumStripeEvent(event: {
  type: string
  created: number
  data: { object: unknown }
}): PremiumStripeEffect {
  const object = asRecord(event.data?.object)
  if (!object) return ignoreEffect()

  if (event.type === 'checkout.session.completed') {
    if (object.mode !== 'subscription') return ignoreEffect()
    const paid = object.payment_status === 'paid'
    return syncEffect(event.created, {
      userId: readMetadataUserId(object.metadata) || (typeof object.client_reference_id === 'string'
        ? object.client_reference_id.trim() || null
        : null),
      customerId: readStripeId(object.customer),
      subscriptionId: readStripeId(object.subscription),
      subscriptionStatus: null,
      periodEndUnix: null,
      markPurchased: paid,
      applyStatus: false,
    })
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const status = typeof object.status === 'string' ? object.status : null
    return syncEffect(event.created, {
      userId: readMetadataUserId(object.metadata),
      customerId: readStripeId(object.customer),
      subscriptionId: readStripeId(object.id),
      subscriptionStatus: status,
      periodEndUnix: readSubscriptionPeriodEndUnix(object),
      markPurchased: subscriptionStatusImpliesPurchase(status),
      applyStatus: true,
    })
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
    const parent = asRecord(object.parent)
    const details = asRecord(parent?.subscription_details)
    const subscriptionId = readStripeId(object.subscription) || readStripeId(details?.subscription)
    const amountPaid = typeof object.amount_paid === 'number' ? object.amount_paid : 0
    const paid = object.status === 'paid' || object.paid === true || amountPaid > 0
    return syncEffect(event.created, {
      userId: readMetadataUserId(details?.metadata) || readMetadataUserId(object.metadata),
      customerId: readStripeId(object.customer),
      subscriptionId,
      subscriptionStatus: null,
      periodEndUnix: null,
      markPurchased: paid,
      applyStatus: false,
    })
  }

  if (event.type === 'invoice.payment_failed') {
    const parent = asRecord(object.parent)
    const details = asRecord(parent?.subscription_details)
    const subscriptionId = readStripeId(object.subscription) || readStripeId(details?.subscription)
    return syncEffect(event.created, {
      userId: readMetadataUserId(details?.metadata) || readMetadataUserId(object.metadata),
      customerId: readStripeId(object.customer),
      subscriptionId,
      subscriptionStatus: null,
      periodEndUnix: null,
      markPurchased: false,
      applyStatus: false,
    })
  }

  return ignoreEffect()
}

export function mergeRetrievedSubscription(
  effect: PremiumStripeEffect,
  retrieved: RetrievedSubscription | null,
): PremiumStripeEffect {
  if (effect.kind !== 'sync' || !retrieved) return effect
  return {
    ...effect,
    userId: effect.userId || retrieved.metadataUserId,
    customerId: effect.customerId || retrieved.customerId,
    subscriptionId: retrieved.id,
    subscriptionStatus: retrieved.status,
    periodEndUnix: retrieved.periodEndUnix,
    markPurchased: effect.markPurchased || subscriptionStatusImpliesPurchase(retrieved.status),
    applyStatus: true,
  }
}

export type StripePremiumNeeds = {
  secret?: boolean
  webhook?: boolean
  price?: boolean
}

export interface StripePremiumConfig {
  secretKey: string
  webhookSecret: string | null
  priceId: string | null
  productId: string | null
}

export function missingStripePremiumKeys(
  source: Record<string, string | undefined>,
  needs: StripePremiumNeeds,
): string[] {
  const missing: string[] = []
  if (needs.secret && !source.STRIPE_SECRET_KEY?.trim()) missing.push('STRIPE_SECRET_KEY')
  if (needs.webhook && !source.STRIPE_WEBHOOK_SECRET?.trim()) missing.push('STRIPE_WEBHOOK_SECRET')
  if (needs.price && !source.STRIPE_PREMIUM_PRICE_ID?.trim()) missing.push('STRIPE_PREMIUM_PRICE_ID')
  return missing
}

export function stripePremiumConfigError(missing: string[], nodeEnv: string | undefined): Error {
  const lead =
    nodeEnv === 'production'
      ? 'Premium billing is not configured.'
      : 'Premium billing is not configured in this environment.'
  return new Error(`${lead} Missing: ${missing.join(', ')}.`)
}

export function readStripePremiumConfig(
  source: Record<string, string | undefined>,
  needs: StripePremiumNeeds,
  nodeEnv?: string,
): StripePremiumConfig {
  const missing = missingStripePremiumKeys(source, needs)
  if (missing.length > 0) throw stripePremiumConfigError(missing, nodeEnv)
  return {
    secretKey: source.STRIPE_SECRET_KEY?.trim() || '',
    webhookSecret: source.STRIPE_WEBHOOK_SECRET?.trim() || null,
    priceId: source.STRIPE_PREMIUM_PRICE_ID?.trim() || null,
    productId: source.STRIPE_PREMIUM_PRODUCT_ID?.trim() || null,
  }
}

export function resolvePremiumReturnOrigin(betterAuthUrl: string | undefined): string {
  const raw = betterAuthUrl?.trim()
  if (!raw) {
    throw new Error('Premium billing is not configured. Missing: BETTER_AUTH_URL.')
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Premium billing is not configured. BETTER_AUTH_URL must be an absolute URL.')
  }
  return url.origin
}

const INTEGRATION_LETTERS = 'abcdefghijklmnopqrstuvwxyz'

export function createPremiumIntegrationIdentifier(byteAt: (index: number) => number = randomByte): string {
  let suffix = ''
  for (let index = 0; index < 8; index += 1) {
    suffix += INTEGRATION_LETTERS[Math.abs(byteAt(index)) % INTEGRATION_LETTERS.length]
  }
  return `moltology_premium_${suffix}`
}

function randomByte(index: number): number {
  void index
  return crypto.getRandomValues(new Uint8Array(1))[0] ?? 0
}

export interface PremiumCheckoutSessionParams {
  mode: 'subscription'
  client_reference_id: string
  line_items: Array<{ price: string; quantity: number }>
  success_url: string
  cancel_url: string
  metadata: { userId: string; kind: 'premium' }
  subscription_data: { metadata: { userId: string; kind: 'premium' } }
  integration_identifier: string
  customer?: string
  customer_email?: string
}

export function buildPremiumCheckoutSessionParams(input: {
  priceId: string
  userId: string
  customerId: string | null
  customerEmail: string | null
  origin: string
  integrationIdentifier: string
}): PremiumCheckoutSessionParams {
  const params: PremiumCheckoutSessionParams = {
    mode: 'subscription',
    client_reference_id: input.userId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${input.origin}/premium?checkout=success`,
    cancel_url: `${input.origin}/premium?checkout=cancel`,
    metadata: { userId: input.userId, kind: 'premium' },
    subscription_data: {
      metadata: { userId: input.userId, kind: 'premium' },
    },
    integration_identifier: input.integrationIdentifier,
  }
  if (input.customerId) params.customer = input.customerId
  else if (input.customerEmail) params.customer_email = input.customerEmail
  return params
}

export function buildPremiumPortalParams(input: { customerId: string; origin: string }): {
  customer: string
  return_url: string
} {
  return {
    customer: input.customerId,
    return_url: `${input.origin}/premium`,
  }
}

export function stripeProductId(product: unknown): string | null {
  return readStripeId(product)
}

export function premiumPriceMatchesProduct(priceProduct: unknown, expectedProductId: string | null): boolean {
  if (!expectedProductId) return true
  return stripeProductId(priceProduct) === expectedProductId
}

export function formatPremiumPriceLabel(input: {
  unitAmount: number | null
  currency: string | null
  interval: string | null
}): string | null {
  if (input.unitAmount == null || !input.currency) return null
  const currency = input.currency.toLowerCase()
  const major = ZERO_DECIMAL_CURRENCIES.has(currency) ? input.unitAmount : input.unitAmount / 100
  let formatted: string
  try {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(major)
  } catch {
    return null
  }
  if (input.interval === 'month') return `${formatted} per month`
  if (input.interval === 'year') return `${formatted} per year`
  if (input.interval) return `${formatted} per ${input.interval}`
  return formatted
}

export function parsePremiumCheckoutSearch(value: unknown): 'success' | 'cancel' | undefined {
  if (value === 'success' || value === 'cancel') return value
  return undefined
}

export interface PremiumOffer {
  hasPurchasedPremium: boolean
  isPremium: boolean
  priceLabel: string | null
  canManage: boolean
  configured: boolean
  configMessage: string | null
}

export function premiumStatusMessage(state: {
  isPremium: boolean
  hasPurchasedPremium: boolean
}): string {
  if (state.isPremium) return PREMIUM_PAGE_COPY.active
  if (state.hasPurchasedPremium) return PREMIUM_PAGE_COPY.lapsed
  return PREMIUM_PAGE_COPY.free
}
