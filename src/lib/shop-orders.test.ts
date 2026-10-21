import { describe, expect, it } from 'vitest'
import { shopOrderNeedsAttention, shopPaymentLabel, shopShippingLabel, type ShopOrderStatusInput } from './shop-orders'

const base: ShopOrderStatusInput = {
  paymentStatus: 'paid', fulfillmentStatus: 'submitted_to_printful', providerStatus: 'pending',
  refundCents: 0, printfulOrderId: '1', shipments: [],
}

describe('shop order labels', () => {
  it('names payment states plainly', () => {
    expect(shopPaymentLabel('partially_refunded')).toEqual({ label: 'Partly refunded', tone: 'wait' })
    expect(shopPaymentLabel('paid').tone).toBe('ok')
  })

  it('prefers what Printful last reported', () => {
    expect(shopShippingLabel({ ...base, providerStatus: 'fulfilled' }).label).toBe('Shipped')
    expect(shopShippingLabel({ ...base, providerStatus: 'inprocess' }).label).toBe('In production')
    expect(shopShippingLabel({ ...base, providerStatus: 'canceled' }).tone).toBe('bad')
    expect(shopShippingLabel({ ...base, fulfillmentStatus: 'printful_draft', providerStatus: 'draft' }).label).toBe('Waiting for Printful approval')
    expect(shopShippingLabel({ ...base, shipments: [{ shippedAt: '2026-10-20T00:00:00Z' }] }).label).toBe('Partly shipped')
  })
})

describe('needs attention', () => {
  it.each([
    ['failed fulfillment', { fulfillmentStatus: 'fulfillment_failed' }, true],
    ['draft waiting for approval', { fulfillmentStatus: 'printful_draft', providerStatus: 'draft' }, true],
    ['paid but never sent', { fulfillmentStatus: 'paid', printfulOrderId: null, providerStatus: null }, true],
    ['refund while Printful keeps producing', { paymentStatus: 'partially_refunded', refundCents: 500, providerStatus: 'inprocess' }, true],
    ['Printful canceled, customer not refunded', { providerStatus: 'canceled' }, true],
    ['Printful canceled and fully refunded', { paymentStatus: 'refunded', refundCents: 2000, providerStatus: 'canceled' }, false],
    ['refund after delivery', { paymentStatus: 'refunded', refundCents: 2000, providerStatus: 'fulfilled' }, false],
    ['sent and moving', {}, false],
    ['abandoned checkout', { paymentStatus: 'unpaid', fulfillmentStatus: 'awaiting_payment', printfulOrderId: null, providerStatus: null }, false],
  ])('%s', (_name, patch, expected) => {
    expect(shopOrderNeedsAttention({ ...base, ...patch } as ShopOrderStatusInput)).toBe(expected)
  })
})
