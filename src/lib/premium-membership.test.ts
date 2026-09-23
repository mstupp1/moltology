import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasSlashPair } from './copy-slash-pair'
import {
  PREMIUM_PAGE_COPY,
  STRIPE_SANDBOX_PREMIUM,
  buildPremiumCheckoutSessionParams,
  buildPremiumPortalParams,
  createPremiumIntegrationIdentifier,
  cancelPremiumWithoutCheckout,
  emptyPremiumMembership,
  grantPremiumWithoutCheckout,
  formatPremiumPriceLabel,
  interpretPremiumStripeEvent,
  listPremiumEntitlements,
  mergeRetrievedSubscription,
  missingStripePremiumKeys,
  parsePremiumCheckoutSearch,
  premiumBannerCopy,
  premiumPriceMatchesProduct,
  premiumStatusMessage,
  readStripePremiumConfig,
  reducePremiumMembership,
  resolvePremiumReturnOrigin,
  shouldShowPremiumBanner,
  shouldShowPremiumDashboardBanner,
  stripePremiumConfigError,
} from './premium-membership'

const secretEnv = {
  STRIPE_SECRET_KEY: 'restricted_key_from_env',
  STRIPE_WEBHOOK_SECRET: 'whsec_from_env',
  STRIPE_PREMIUM_PRICE_ID: STRIPE_SANDBOX_PREMIUM.priceId,
  STRIPE_PREMIUM_PRODUCT_ID: STRIPE_SANDBOX_PREMIUM.productId,
}

describe('premium banner visibility', () => {
  it('shows the banner for free and paid-lapsed members and hides it for current premium', () => {
    const free = { isPremium: false, hasPurchasedPremium: false }
    const lapsed = { isPremium: false, hasPurchasedPremium: true }
    const current = { isPremium: true, hasPurchasedPremium: true }
    expect(shouldShowPremiumBanner(free)).toBe(true)
    expect(shouldShowPremiumBanner(lapsed)).toBe(true)
    expect(shouldShowPremiumBanner(current)).toBe(false)
    expect(shouldShowPremiumDashboardBanner({ ...free, canViewHiddenPages: true })).toBe(true)
    expect(shouldShowPremiumDashboardBanner({ ...lapsed, canViewHiddenPages: true })).toBe(true)
    expect(shouldShowPremiumDashboardBanner({ ...current, canViewHiddenPages: true })).toBe(false)
  })

  it('uses paid history only for the banner wording, not for hiding it', () => {
    expect(shouldShowPremiumBanner({ isPremium: false })).toBe(true)
    expect(premiumBannerCopy(false).body).toMatch(/monthly membership/i)
    expect(premiumBannerCopy(true).body).toMatch(/not active/i)
    expect(premiumBannerCopy(false).action).toBe('View Premium')
  })

  it('keeps the soft-launch banner off the public dashboard', () => {
    expect(
      shouldShowPremiumDashboardBanner({ isPremium: false, canViewHiddenPages: false }),
    ).toBe(false)
    expect(
      shouldShowPremiumDashboardBanner({ isPremium: true, canViewHiddenPages: false }),
    ).toBe(false)
  })

  it('keeps banner and page copy free of stack names and slash-pairs', () => {
    const lines = [
      premiumBannerCopy(false).body,
      premiumBannerCopy(true).body,
      PREMIUM_PAGE_COPY.description,
      PREMIUM_PAGE_COPY.benefitsBody,
      PREMIUM_PAGE_COPY.checkoutSuccess,
      PREMIUM_PAGE_COPY.checkoutCancel,
      PREMIUM_PAGE_COPY.activate,
      PREMIUM_PAGE_COPY.activateHint,
      PREMIUM_PAGE_COPY.purchase,
      PREMIUM_PAGE_COPY.cancel,
      PREMIUM_PAGE_COPY.activated,
      PREMIUM_PAGE_COPY.canceled,
    ]
    for (const line of lines) {
      expect(line).not.toMatch(/stripe|postgres|vercel|drizzle/i)
      expect(line).not.toContain('//')
      expect(hasSlashPair(line)).toBe(false)
    }
    expect(PREMIUM_PAGE_COPY.description).toMatch(/rank, clearance, stage, or forum authority/i)
    expect(PREMIUM_PAGE_COPY.description).toMatch(/Chitin Gems stay earned/)
  })
})

describe('premium without checkout', () => {
  const syncedAt = new Date('2026-09-23T00:00:00.000Z')

  it('activates Premium and keeps any existing billing ids', () => {
    const next = grantPremiumWithoutCheckout(
      {
        ...emptyPremiumMembership(),
        stripeCustomerId: 'cus_existing',
        stripeSubscriptionId: 'sub_existing',
      },
      syncedAt,
    )
    expect(next.isPremium).toBe(true)
    expect(next.hasPurchasedPremium).toBe(true)
    expect(next.premiumStatus).toBe('active')
    expect(next.premiumSyncedAt).toBe(syncedAt)
    expect(next.stripeCustomerId).toBe('cus_existing')
    expect(next.stripeSubscriptionId).toBe('sub_existing')
  })

  it('cancels the current membership and keeps the paid-once flag', () => {
    const next = cancelPremiumWithoutCheckout(
      {
        ...emptyPremiumMembership(),
        hasPurchasedPremium: true,
        isPremium: true,
        premiumStatus: 'active',
        stripeCustomerId: 'cus_existing',
      },
      syncedAt,
    )
    expect(next.isPremium).toBe(false)
    expect(next.hasPurchasedPremium).toBe(true)
    expect(next.premiumStatus).toBe('canceled')
    expect(next.stripeCustomerId).toBe('cus_existing')
    expect(premiumStatusMessage(next)).toMatch(/not active/i)
  })
})

describe('premium entitlements', () => {
  it('does not invent unlocks for free or current premium members', () => {
    expect(listPremiumEntitlements(false)).toEqual([])
    expect(listPremiumEntitlements(true)).toEqual([])
  })
})

describe('premium flag reducer', () => {
  const earlier = new Date('2026-09-01T00:00:00.000Z')
  const later = new Date('2026-09-22T00:00:00.000Z')

  it('marks a first successful payment without treating the member as current premium', () => {
    const next = reducePremiumMembership(emptyPremiumMembership(), {
      eventCreated: earlier,
      customerId: 'cus_123',
      markPurchased: true,
      applyStatus: false,
    })
    expect(next.hasPurchasedPremium).toBe(true)
    expect(next.isPremium).toBe(false)
    expect(next.stripeCustomerId).toBe('cus_123')
  })

  it('sets current premium only for an active subscription', () => {
    const next = reducePremiumMembership(emptyPremiumMembership(), {
      eventCreated: earlier,
      customerId: 'cus_123',
      subscriptionId: 'sub_123',
      subscriptionStatus: 'active',
      periodEnd: later,
      applyStatus: true,
    })
    expect(next.hasPurchasedPremium).toBe(true)
    expect(next.isPremium).toBe(true)
    expect(next.premiumStatus).toBe('active')
    expect(next.stripeSubscriptionId).toBe('sub_123')
    expect(premiumStatusMessage(next)).toBe(PREMIUM_PAGE_COPY.active)
  })

  it('keeps a lapsed payer paid while clearing current premium', () => {
    const active = reducePremiumMembership(emptyPremiumMembership(), {
      eventCreated: earlier,
      subscriptionId: 'sub_123',
      subscriptionStatus: 'active',
      applyStatus: true,
    })
    const lapsed = reducePremiumMembership(active, {
      eventCreated: later,
      subscriptionId: 'sub_123',
      subscriptionStatus: 'past_due',
      applyStatus: true,
    })
    expect(lapsed.hasPurchasedPremium).toBe(true)
    expect(lapsed.isPremium).toBe(false)
    expect(premiumStatusMessage(lapsed)).toBe(PREMIUM_PAGE_COPY.lapsed)
    expect(shouldShowPremiumBanner(lapsed)).toBe(true)
  })

  it('does not treat a canceled unpaid subscription as a purchase', () => {
    const next = reducePremiumMembership(emptyPremiumMembership(), {
      eventCreated: earlier,
      subscriptionId: 'sub_abandoned',
      subscriptionStatus: 'canceled',
      applyStatus: true,
    })
    expect(next.hasPurchasedPremium).toBe(false)
    expect(next.isPremium).toBe(false)
    expect(premiumStatusMessage(next)).toBe(PREMIUM_PAGE_COPY.free)
  })

  it('does not let an older event erase a newer active subscription', () => {
    const active = reducePremiumMembership(emptyPremiumMembership(), {
      eventCreated: later,
      subscriptionStatus: 'active',
      subscriptionId: 'sub_new',
      applyStatus: true,
      markPurchased: true,
    })
    const stale = reducePremiumMembership(active, {
      eventCreated: earlier,
      subscriptionStatus: 'canceled',
      subscriptionId: 'sub_old',
      applyStatus: true,
      markPurchased: true,
    })
    expect(stale.isPremium).toBe(true)
    expect(stale.premiumStatus).toBe('active')
    expect(stale.stripeSubscriptionId).toBe('sub_new')
    expect(stale.hasPurchasedPremium).toBe(true)
  })

  it('ignores trialing and incomplete as current premium and as a purchase', () => {
    for (const status of ['trialing', 'incomplete', 'incomplete_expired']) {
      const next = reducePremiumMembership(emptyPremiumMembership(), {
        eventCreated: earlier,
        subscriptionStatus: status,
        applyStatus: true,
      })
      expect(next.isPremium).toBe(false)
      expect(next.hasPurchasedPremium).toBe(false)
    }
  })
})

describe('premium stripe event interpretation', () => {
  it('records a paid subscription checkout without inventing an active status', () => {
    const effect = interpretPremiumStripeEvent({
      type: 'checkout.session.completed',
      created: 100,
      data: {
        object: {
          mode: 'subscription',
          payment_status: 'paid',
          client_reference_id: 'user_1',
          customer: 'cus_1',
          subscription: 'sub_1',
          metadata: { userId: 'user_1' },
        },
      },
    })
    expect(effect).toMatchObject({
      kind: 'sync',
      userId: 'user_1',
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
      markPurchased: true,
      applyStatus: false,
    })
  })

  it('ignores unpaid and non-subscription checkouts', () => {
    expect(
      interpretPremiumStripeEvent({
        type: 'checkout.session.completed',
        created: 100,
        data: { object: { mode: 'subscription', payment_status: 'unpaid', metadata: { userId: 'user_1' } } },
      }),
    ).toMatchObject({ kind: 'sync', markPurchased: false })
    expect(
      interpretPremiumStripeEvent({
        type: 'checkout.session.completed',
        created: 100,
        data: { object: { mode: 'payment', payment_status: 'paid' } },
      }),
    ).toEqual({ kind: 'ignore' })
  })

  it('applies subscription status from the subscription object', () => {
    const effect = interpretPremiumStripeEvent({
      type: 'customer.subscription.updated',
      created: 200,
      data: {
        object: {
          id: 'sub_1',
          customer: { id: 'cus_1' },
          status: 'active',
          metadata: { userId: 'user_1' },
          items: { data: [{ current_period_end: 1_800_000_000 }] },
        },
      },
    })
    expect(effect).toMatchObject({
      kind: 'sync',
      userId: 'user_1',
      customerId: 'cus_1',
      subscriptionStatus: 'active',
      periodEndUnix: 1_800_000_000,
      markPurchased: true,
      applyStatus: true,
    })
  })

  it('marks invoice.paid as a purchase and leaves status to the subscription', () => {
    const effect = interpretPremiumStripeEvent({
      type: 'invoice.paid',
      created: 300,
      data: {
        object: {
          customer: 'cus_1',
          amount_paid: 599,
          status: 'paid',
          parent: {
            subscription_details: {
              subscription: 'sub_1',
              metadata: { userId: 'user_1' },
            },
          },
        },
      },
    })
    expect(effect).toMatchObject({
      kind: 'sync',
      userId: 'user_1',
      subscriptionId: 'sub_1',
      markPurchased: true,
      applyStatus: false,
    })
  })

  it('lets a retrieved subscription become the status source of truth', () => {
    const effect = interpretPremiumStripeEvent({
      type: 'invoice.payment_failed',
      created: 400,
      data: { object: { customer: 'cus_1', subscription: 'sub_1' } },
    })
    const merged = mergeRetrievedSubscription(effect, {
      id: 'sub_1',
      customerId: 'cus_1',
      status: 'past_due',
      periodEndUnix: 1_800_000_000,
      metadataUserId: 'user_1',
    })
    expect(merged).toMatchObject({
      kind: 'sync',
      userId: 'user_1',
      subscriptionStatus: 'past_due',
      markPurchased: true,
      applyStatus: true,
    })
  })

  it('ignores unrelated events', () => {
    expect(
      interpretPremiumStripeEvent({
        type: 'charge.succeeded',
        created: 1,
        data: { object: { id: 'ch_1' } },
      }),
    ).toEqual({ kind: 'ignore' })
  })
})

describe('premium checkout configuration', () => {
  it('fails clearly when billing env is missing outside production', () => {
    expect(missingStripePremiumKeys({}, { secret: true, webhook: true, price: true })).toEqual([
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PREMIUM_PRICE_ID',
    ])
    expect(() => readStripePremiumConfig({}, { secret: true, price: true }, 'development')).toThrow(
      /not configured in this environment.*STRIPE_SECRET_KEY.*STRIPE_PREMIUM_PRICE_ID/,
    )
    expect(stripePremiumConfigError(['STRIPE_WEBHOOK_SECRET'], 'production').message).toBe(
      'Premium billing is not configured. Missing: STRIPE_WEBHOOK_SECRET.',
    )
  })

  it('reads the sandbox price and product ids from env and never invents an amount', () => {
    expect(STRIPE_SANDBOX_PREMIUM).toEqual({
      accountId: 'acct_1Se62XQ7tNSavLB7',
      livemode: false,
      priceId: 'price_1UIfEjQ7tNSavLB7C4N9velE',
      productId: 'prod_VJHoQFNhsIRtt0',
    })
    const example = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')
    expect(example).toContain(`STRIPE_PREMIUM_PRICE_ID="${STRIPE_SANDBOX_PREMIUM.priceId}"`)
    expect(example).toContain(`STRIPE_PREMIUM_PRODUCT_ID="${STRIPE_SANDBOX_PREMIUM.productId}"`)
    expect(example).toContain('acct_1Se62XQ7tNSavLB7')
    expect(example).toContain('livemode=false')
    expect(example).toContain('STRIPE_SECRET_KEY=""')
    expect(example).toContain('STRIPE_WEBHOOK_SECRET=""')
    const config = readStripePremiumConfig(secretEnv, { secret: true, price: true, webhook: true }, 'test')
    expect(config.priceId).toBe('price_1UIfEjQ7tNSavLB7C4N9velE')
    expect(config.productId).toBe('prod_VJHoQFNhsIRtt0')
    expect(config.secretKey).toBe('restricted_key_from_env')
    expect(JSON.stringify(config)).not.toContain('599')
  })

  it('builds a subscription checkout from the env price id', () => {
    const config = readStripePremiumConfig(secretEnv, { secret: true, price: true }, 'test')
    const params = buildPremiumCheckoutSessionParams({
      priceId: config.priceId!,
      userId: 'user_1',
      customerId: null,
      customerEmail: 'member@example.com',
      origin: 'https://moltology.org',
      integrationIdentifier: 'moltology_premium_abcdefgh',
    })
    expect(params.mode).toBe('subscription')
    expect(params.line_items).toEqual([{ price: 'price_1UIfEjQ7tNSavLB7C4N9velE', quantity: 1 }])
    expect(params.customer_email).toBe('member@example.com')
    expect(params.customer).toBeUndefined()
    expect(params.metadata.userId).toBe('user_1')
    expect(params.subscription_data.metadata.userId).toBe('user_1')
    expect(params.success_url).toBe('https://moltology.org/premium?checkout=success')
    expect(params.cancel_url).toBe('https://moltology.org/premium?checkout=cancel')
    expect(params).not.toHaveProperty('payment_method_types')
    expect(params).not.toHaveProperty('automatic_tax')
    expect(JSON.stringify(params)).not.toMatch(/5\.99|599/)
  })

  it('reuses an existing customer instead of also sending an email', () => {
    const params = buildPremiumCheckoutSessionParams({
      priceId: STRIPE_SANDBOX_PREMIUM.priceId,
      userId: 'user_1',
      customerId: 'cus_1',
      customerEmail: 'member@example.com',
      origin: 'https://moltology.org',
      integrationIdentifier: createPremiumIntegrationIdentifier(() => 0),
    })
    expect(params.customer).toBe('cus_1')
    expect(params.customer_email).toBeUndefined()
    expect(params.integration_identifier).toBe('moltology_premium_aaaaaaaa')
  })

  it('tags checkout with an eight-letter integration suffix', () => {
    expect(createPremiumIntegrationIdentifier((index) => index + 1)).toBe('moltology_premium_bcdefghi')
  })

  it('sends the member back to the Premium page from the customer portal', () => {
    expect(buildPremiumPortalParams({ customerId: 'cus_1', origin: 'http://localhost:3000' })).toEqual({
      customer: 'cus_1',
      return_url: 'http://localhost:3000/premium',
    })
  })

  it('rejects a price that belongs to a different product', () => {
    expect(premiumPriceMatchesProduct(STRIPE_SANDBOX_PREMIUM.productId, STRIPE_SANDBOX_PREMIUM.productId)).toBe(
      true,
    )
    expect(premiumPriceMatchesProduct({ id: 'prod_other' }, STRIPE_SANDBOX_PREMIUM.productId)).toBe(false)
    expect(premiumPriceMatchesProduct('prod_other', null)).toBe(true)
  })

  it('formats the Stripe price for display without treating that string as the charge', () => {
    expect(formatPremiumPriceLabel({ unitAmount: 599, currency: 'usd', interval: 'month' })).toBe(
      '$5.99 per month',
    )
    expect(formatPremiumPriceLabel({ unitAmount: null, currency: 'usd', interval: 'month' })).toBeNull()
  })

  it('requires an absolute return origin', () => {
    expect(resolvePremiumReturnOrigin('https://moltology.org/hud')).toBe('https://moltology.org')
    expect(() => resolvePremiumReturnOrigin('')).toThrow(/BETTER_AUTH_URL/)
    expect(() => resolvePremiumReturnOrigin('not a url')).toThrow(/absolute URL/)
  })

  it('reads only the checkout result query the page understands', () => {
    expect(parsePremiumCheckoutSearch('success')).toBe('success')
    expect(parsePremiumCheckoutSearch('cancel')).toBe('cancel')
    expect(parsePremiumCheckoutSearch('paid')).toBeUndefined()
  })
})
