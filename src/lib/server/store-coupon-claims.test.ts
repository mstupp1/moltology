import { describe, expect, it, vi } from 'vitest'
import { createStoreCouponOrderClaim } from './store-coupon-claims'

const input = {
  orderId: '11111111-1111-4111-8111-111111111111', userId: null, email: 'shopper@example.com',
  shippingAddress: { line1: '1 Trench' }, subtotalCents: 3000, shippingCents: 695, totalCents: 3695,
  lineItems: [{ variantId: 'mug' }], quoteSnapshot: { storeId: 'store' }, promotionCode: 'LAUNCH15',
  promotionCodeId: 'promo_1', statusTokenHash: 'hash', fulfillmentMode: 'manual', livemode: false,
}

function client(outcomes: Array<unknown>) {
  const queries: string[] = []
  const transaction = vi.fn(async (_queries: unknown[], options: unknown) => {
    expect(options).toEqual({ isolationLevel: 'Serializable' })
    const next = outcomes.shift()
    if (next instanceof Error) throw next
    return next
  })
  const tag = ((parts: TemplateStringsArray, ...values: unknown[]) => {
    const query = parts.reduce((text, part, index) => text + part + (index < values.length ? String(values[index]) : ''), '')
    queries.push(query)
    return query
  }) as any
  tag.transaction = transaction
  return { tag, queries, transaction }
}

describe('atomic once-per-email store coupon claim', () => {
  it('uses a serializable conditional insert and treats pending/consumed orders as claims', async () => {
    const db = client([[[{ outcome: 'created' }]]])
    await expect(createStoreCouponOrderClaim(db.tag, input)).resolves.toBe('created')
    expect(db.queries[0]).toContain('lower("customerEmail")')
    expect(db.queries[0]).toContain('"paymentStatus" <> \'failed\'')
    expect(db.queries[0]).toContain('id <> ' + input.orderId)
  })

  it('returns a conflict when another quote already holds the reservation', async () => {
    const db = client([[[{ outcome: 'conflict' }]]])
    await expect(createStoreCouponOrderClaim(db.tag, input)).resolves.toBe('conflict')
  })

  it('retries serialization conflicts and allows idempotent same-order replay', async () => {
    const serializationError = Object.assign(new Error('serialization failure'), { code: '40001' })
    const db = client([serializationError, [[{ outcome: 'existing' }]]])
    await expect(createStoreCouponOrderClaim(db.tag, input)).resolves.toBe('existing')
    expect(db.transaction).toHaveBeenCalledTimes(2)
  })
})
