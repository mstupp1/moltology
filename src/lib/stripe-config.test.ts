import Stripe from 'stripe'
import { describe, expect, it } from 'vitest'
import { buildMerchCheckoutSessionParams } from './merch'
import { buildPremiumCheckoutSessionParams } from './premium-membership'
import { STRIPE_API_VERSION } from './stripe-config'

describe('Stripe checkout wire compatibility', () => {
  it('sends the reviewed API version and preserves Premium and physical-goods parameters', async () => {
    const requests: Request[] = []
    const stripe = new Stripe('sk_test_fixture', {
      apiVersion: STRIPE_API_VERSION,
      httpClient: Stripe.createFetchHttpClient(async (input, init) => {
        requests.push(new Request(input, init))
        return new Response(JSON.stringify({ id: 'cs_test_fixture', object: 'checkout.session' }), {
          headers: { 'content-type': 'application/json' },
        })
      }),
      telemetry: false,
    })

    await stripe.checkout.sessions.create(buildPremiumCheckoutSessionParams({
      priceId: 'price_fixture', userId: 'member-fixture', customerId: null,
      customerEmail: 'member@example.com', origin: 'https://example.com',
      integrationIdentifier: 'moltology_premium_fixture',
    }))
    await stripe.checkout.sessions.create(buildMerchCheckoutSessionParams({
      orderId: 'order-fixture', origin: 'https://example.com', shippingCents: 500,
      customerId: 'cus_fixture', customerEmail: null, automaticTax: true,
      lines: [{ variantId: 'variant-fixture', productId: 'product-fixture',
        productTitle: 'Fixture', productSlug: 'fixture', variantTitle: 'Medium',
        size: 'M', color: null, printfulSyncVariantId: 123, quantity: 2, unitPriceCents: 2000 }],
    }))

    for (const request of requests) {
      expect(request.headers.get('stripe-version')).toBe('2026-09-30.endive')
      expect(request.method).toBe('POST')
      expect(new URL(request.url).pathname).toBe('/v1/checkout/sessions')
    }
    const premium = new URLSearchParams(await requests[0].text())
    expect(premium.get('mode')).toBe('subscription')
    expect(premium.get('line_items[0][price]')).toBe('price_fixture')
    expect(premium.get('subscription_data[metadata][userId]')).toBe('member-fixture')
    const merch = new URLSearchParams(await requests[1].text())
    expect(merch.get('mode')).toBe('payment')
    expect(merch.get('managed_payments[enabled]')).toBe('false')
    expect(merch.get('line_items[0][price_data][unit_amount]')).toBe('2000')
    expect(merch.get('line_items[0][quantity]')).toBe('2')
    expect(merch.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]')).toBe('500')
    expect(merch.get('automatic_tax[enabled]')).toBe('true')
  })
})
