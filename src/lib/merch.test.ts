import { describe, expect, it } from 'vitest'
import { interpretPremiumStripeEvent } from './premium-membership'
import {
  buildMerchCheckoutSessionParams,
  buildPricedCheckoutLines,
  buildPrintfulOrderPayload,
  cartSubtotalCents,
  formatMerchPrice,
  isMerchCheckoutCompletedEvent,
  readMerchCheckoutCompletion,
  readMerchShippingCents,
  readStoredCart,
  resolveStoreHref,
  setCartLineQuantity,
  shouldDraftPrintfulOrder,
  upsertCartLine,
  type MerchCartLine,
  type PricedVariant,
} from './merch'

const tee: PricedVariant = {
  variantId: 'var-tee',
  productId: 'prod-tee',
  productTitle: 'Benthic Shell Tee',
  productSlug: 'benthic-shell-tee',
  productPublished: true,
  variantTitle: 'Abyss / M',
  size: 'M',
  color: 'Abyss',
  printfulSyncVariantId: 910002,
  priceCents: 2800,
  isAvailable: true,
}

describe('merch store helpers', () => {
  it('keeps the public store on Etsy until an admin can view the native store', () => {
    expect(resolveStoreHref(false)).toBe('https://www.etsy.com/shop/SaasTrash')
    expect(resolveStoreHref(true)).toBe('/store')
  })

  it('prices checkout from the database and rejects bad quantities', () => {
    const priced = buildPricedCheckoutLines([tee], [
      { variantId: 'var-tee', quantity: 2 },
      { variantId: 'var-tee', quantity: 1 },
    ])
    expect(priced.ok).toBe(true)
    if (!priced.ok) return
    expect(priced.lines).toEqual([
      expect.objectContaining({
        variantId: 'var-tee',
        quantity: 3,
        unitPriceCents: 2800,
        printfulSyncVariantId: 910002,
      }),
    ])
    expect(buildPricedCheckoutLines([tee], [{ variantId: 'missing', quantity: 1 }])).toEqual({
      ok: false,
      message: 'One of those pieces is no longer available.',
    })
    expect(buildPricedCheckoutLines([tee], [{ variantId: 'var-tee', quantity: 11 }]).ok).toBe(false)
    expect(buildPricedCheckoutLines([{ ...tee, productPublished: false }], [{ variantId: 'var-tee', quantity: 1 }]).ok).toBe(false)
  })

  it('builds a payment checkout session with flat shipping and merch metadata', () => {
    const priced = buildPricedCheckoutLines([tee], [{ variantId: 'var-tee', quantity: 1 }])
    if (!priced.ok) throw new Error(priced.message)
    const params = buildMerchCheckoutSessionParams({
      orderId: 'order-1',
      lines: priced.lines,
      origin: 'https://moltology.org',
      shippingCents: 695,
      customerId: 'cus_1',
      customerEmail: 'ops@example.com',
      automaticTax: false,
    })
    expect(params.mode).toBe('payment')
    expect(params.customer).toBe('cus_1')
    expect(params.customer_email).toBeUndefined()
    expect(params.metadata).toEqual({ orderType: 'merch', orderId: 'order-1' })
    expect(params.success_url).toBe('https://moltology.org/store?checkout=success')
    expect(params.line_items[0]?.price_data.unit_amount).toBe(2800)
    expect(params.line_items[0]?.price_data.product_data.metadata.printfulSyncVariantId).toBe('910002')
    expect(params.shipping_options[0]?.shipping_rate_data.fixed_amount.amount).toBe(695)
    expect(params.automatic_tax).toBeUndefined()
    expect(readMerchShippingCents('800')).toBe(800)
    expect(readMerchShippingCents('nope')).toBe(695)
  })

  it('detects merch checkout events without treating them as premium', () => {
    const event = {
      type: 'checkout.session.completed',
      created: 100,
      data: {
        object: {
          id: 'cs_1',
          mode: 'payment',
          metadata: { orderType: 'merch', orderId: 'order-1' },
          customer_details: {
            email: 'ops@example.com',
            phone: '555-0100',
          },
          collected_information: {
            shipping_details: {
              name: 'Ops',
              address: {
                line1: '1 Trench',
                city: 'Seattle',
                state: 'WA',
                postal_code: '98101',
                country: 'US',
              },
            },
          },
          amount_subtotal: 2800,
          amount_total: 3495,
          currency: 'usd',
          shipping_cost: { amount_total: 695 },
          total_details: { amount_tax: 0, amount_shipping: 695 },
        },
      },
    }
    expect(isMerchCheckoutCompletedEvent(event)).toBe(true)
    expect(interpretPremiumStripeEvent(event)).toEqual({ kind: 'ignore' })
    expect(readMerchCheckoutCompletion(event.data.object)).toMatchObject({
      orderId: 'order-1',
      email: 'ops@example.com',
      shippingCents: 695,
      totalCents: 3495,
      shipping: { city: 'Seattle', state: 'WA', country: 'US', phone: '555-0100' },
    })
    expect(isMerchCheckoutCompletedEvent({ type: 'checkout.session.completed', data: { object: { metadata: { orderType: 'premium' } } } })).toBe(false)
  })

  it('builds a Printful draft payload outside production', () => {
    const payload = buildPrintfulOrderPayload({
      externalId: 'order-1',
      email: 'ops@example.com',
      draft: shouldDraftPrintfulOrder({ NODE_ENV: 'development' }),
      shipping: {
        name: 'Ops',
        line1: '1 Trench',
        line2: null,
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
        phone: null,
      },
      items: [{ printfulSyncVariantId: 910002, quantity: 1 }],
    })
    expect(payload.draft).toBe(true)
    expect(shouldDraftPrintfulOrder({ NODE_ENV: 'production', PRINTFUL_DRAFT: 'true' })).toBe(true)
    expect(shouldDraftPrintfulOrder({ NODE_ENV: 'development', PRINTFUL_DRAFT: 'false' })).toBe(false)
    expect(payload.items).toEqual([{ sync_variant_id: 910002, quantity: 1 }])
    expect(payload.recipient.address1).toBe('1 Trench')
    expect(payload.recipient.address2).toBeUndefined()
  })

  it('merges cart lines and formats prices', () => {
    const line: MerchCartLine = {
      variantId: 'var-tee',
      productSlug: 'benthic-shell-tee',
      productTitle: 'Benthic Shell Tee',
      variantTitle: 'Abyss / M',
      size: 'M',
      color: 'Abyss',
      colorHex: '#12181c',
      imageUrl: null,
      unitPriceCents: 2800,
      quantity: 1,
    }
    const next = upsertCartLine([line], { ...line, quantity: 2 })
    expect(next[0]?.quantity).toBe(3)
    expect(cartSubtotalCents(next)).toBe(8400)
    expect(setCartLineQuantity(next, 'var-tee', 0)).toEqual([])
    expect(formatMerchPrice(2800)).toBe('$28.00')
    expect(readStoredCart('not-json')).toEqual([])
  })
})
