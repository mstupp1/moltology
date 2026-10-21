import { describe, expect, it } from 'vitest'
import { couponExpiryTimestamp, estimateCouponDiscountCents, storeCouponCreateSchema, storeCouponLabel } from './store-coupons'

describe('store coupon helpers', () => {
  it('labels percent and dollar codes', () => {
    expect(storeCouponLabel({ percentOff: 15, amountOffCents: null })).toBe('15% off')
    expect(storeCouponLabel({ percentOff: null, amountOffCents: 500 })).toBe('$5.00 off')
  })

  it('never discounts more than the items', () => {
    expect(estimateCouponDiscountCents({ percentOff: 15, amountOffCents: null }, 2999)).toBe(450)
    expect(estimateCouponDiscountCents({ percentOff: 100, amountOffCents: null }, 2999)).toBe(2999)
    expect(estimateCouponDiscountCents({ percentOff: null, amountOffCents: 5000 }, 1800)).toBe(1800)
  })

  it('normalizes codes and checks limits', () => {
    expect(storeCouponCreateSchema.parse({ code: ' launch15 ', kind: 'percent', value: 15 })).toMatchObject({ code: 'LAUNCH15', expiresAt: null, oncePerEmail: false })
    expect(storeCouponCreateSchema.safeParse({ code: 'TOO MANY SPACES', kind: 'percent', value: 15 }).success).toBe(false)
    expect(storeCouponCreateSchema.safeParse({ code: 'BIG', kind: 'percent', value: 101 }).success).toBe(false)
    expect(storeCouponCreateSchema.safeParse({ code: 'FIVE', kind: 'amount', value: 500 }).success).toBe(true)
  })

  it('keeps a code valid through the end of its expiry day', () => {
    expect(new Date(couponExpiryTimestamp('2026-12-31') * 1000).toISOString()).toBe('2026-12-31T23:59:59.000Z')
  })
})
