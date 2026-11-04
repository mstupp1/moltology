import { describe, expect, it, vi } from 'vitest'
import { MOLT_CREDIT_PACKS } from '../molt-credits'
import {
  MOLT_CREDIT_ORDER_TYPE,
  buildCreditCheckoutParams,
  canBuyCredits,
  grantCreditsFromCheckout,
  handleCreditRefundEvent,
  isCreditCheckoutEvent,
} from './molt-credits'

/** A chainable stand-in for the Drizzle client that records inserted values and batches. */
function fakeDb(selectRows: unknown[] = []) {
  const inserted: unknown[] = []
  const chain = (result: unknown): any =>
    new Proxy(() => {}, {
      get: (_t, prop) => (prop === 'then' ? (r: (v: unknown) => void) => r(result) : chain(result)),
      apply: () => chain(result),
    })
  const db = {
    inserted,
    batch: vi.fn(async (statements: unknown[]) => statements),
    select: () => chain(selectRows),
    update: () => chain([]),
    insert: () => ({
      values: (v: unknown) => {
        inserted.push(v)
        return chain([])
      },
    }),
  }
  return db as typeof db & any
}

const pouch = MOLT_CREDIT_PACKS[0]!

function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        payment_status: 'paid',
        payment_intent: 'pi_1',
        amount_total: pouch.priceCents,
        client_reference_id: 'user-1',
        metadata: { orderType: MOLT_CREDIT_ORDER_TYPE, userId: 'user-1', packId: pouch.id },
        ...overrides,
      },
    },
  }
}

describe('Molt Credits', () => {
  it('only lets admins with the experiment buy for now', () => {
    expect(canBuyCredits('admin', ['molt-credits'])).toBe(true)
    expect(canBuyCredits('admin', [])).toBe(false)
    expect(canBuyCredits('user', ['molt-credits'])).toBe(false)
  })

  it('prices checkout from the pack list and tags the order', () => {
    const params = buildCreditCheckoutParams({ userId: 'user-1', packId: 'chest', origin: 'https://x.test', customerId: null })
    const chest = MOLT_CREDIT_PACKS.find((p) => p.id === 'chest')!
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(chest.priceCents)
    expect(params.metadata).toMatchObject({ orderType: MOLT_CREDIT_ORDER_TYPE, packId: 'chest', userId: 'user-1' })
    expect(params.payment_intent_data?.metadata).toEqual(params.metadata)
    expect(params.success_url).toBe('https://x.test/market?credits=success')
    expect(params).not.toHaveProperty('customer')
    expect(() => buildCreditCheckoutParams({ userId: 'u', packId: 'free-lunch', origin: 'o', customerId: null })).toThrow()
  })

  it('routes only credit checkouts to the credit handler', () => {
    expect(isCreditCheckoutEvent(checkoutEvent())).toBe(true)
    expect(isCreditCheckoutEvent({ ...checkoutEvent(), type: 'checkout.session.async_payment_succeeded' })).toBe(true)
    expect(isCreditCheckoutEvent(checkoutEvent({ metadata: { orderType: 'merch' } }))).toBe(false)
    expect(isCreditCheckoutEvent({ ...checkoutEvent(), type: 'invoice.paid' })).toBe(false)
  })

  it('grants the pack once, keyed by the payment intent', async () => {
    const db = fakeDb()
    expect(await grantCreditsFromCheckout(checkoutEvent(), db)).toBe(true)
    expect(db.inserted).toEqual([
      expect.objectContaining({ userId: 'user-1', amount: pouch.credits, source: 'stripe', sourceKey: 'stripe:pi_1' }),
    ])
    expect(db.batch).toHaveBeenCalledOnce()
  })

  it('waits for unpaid sessions and rejects mismatched amounts', async () => {
    const db = fakeDb()
    expect(await grantCreditsFromCheckout(checkoutEvent({ payment_status: 'unpaid' }), db)).toBe(false)
    await expect(grantCreditsFromCheckout(checkoutEvent({ amount_total: 1 }), db)).rejects.toThrow(/amount/)
    await expect(grantCreditsFromCheckout(checkoutEvent({ metadata: { orderType: MOLT_CREDIT_ORDER_TYPE } , client_reference_id: null }), db)).rejects.toThrow()
    expect(db.inserted).toEqual([])
  })

  it('takes a fully refunded pack back', async () => {
    const db = fakeDb([{ userId: 'user-1', amount: 200 }])
    const event = { type: 'charge.refunded', data: { object: { payment_intent: 'pi_1', refunded: true } } }
    expect(await handleCreditRefundEvent(event, db)).toBe(true)
    expect(db.inserted).toEqual([
      expect.objectContaining({ userId: 'user-1', amount: -200, source: 'refund', sourceKey: 'refund:pi_1' }),
    ])
  })

  it('leaves partial refunds and unknown payments alone', async () => {
    const partial = fakeDb([{ userId: 'user-1', amount: 200 }])
    expect(
      await handleCreditRefundEvent({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_1', refunded: false } } }, partial),
    ).toBe(false)
    const unknown = fakeDb([])
    expect(
      await handleCreditRefundEvent({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_9', refunded: true } } }, unknown),
    ).toBe(false)
    expect([...partial.inserted, ...unknown.inserted]).toEqual([])
  })
})
