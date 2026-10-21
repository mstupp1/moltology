import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb } from '../../db'
import { createStoreCoupon, listStoreCoupons, resolveStorePromotion, setStoreCouponActive } from './store-coupons'

vi.mock('../../db', () => ({ getDb: vi.fn() }))

function promotion(overrides: Record<string, unknown> = {}, coupon: Record<string, unknown> = {}) {
  return {
    id: 'promo_1', code: 'LAUNCH15', active: true, created: 1_790_000_000, expires_at: null, max_redemptions: null, times_redeemed: 0,
    metadata: { scope: 'merch', oncePerEmail: 'false' }, restrictions: { minimum_amount: null },
    promotion: { type: 'coupon', coupon: { id: 'co_1', valid: true, percent_off: 15, amount_off: null, currency: null, ...coupon } },
    ...overrides,
  }
}
function fakeStripe(list: unknown[]) {
  return {
    promotionCodes: {
      list: vi.fn().mockResolvedValue({ data: list }),
      create: vi.fn(async (params: any) => promotion({ id: 'promo_new', code: params.code, metadata: params.metadata, expires_at: params.expires_at ?? null })),
      retrieve: vi.fn(async () => list[0]),
      update: vi.fn().mockResolvedValue({}),
    },
    coupons: { create: vi.fn().mockResolvedValue({ id: 'co_new' }) },
  } as any
}
const input = { code: 'launch15', email: 'a@example.com', subtotalCents: 3000 }

beforeEach(() => vi.clearAllMocks())

describe('resolveStorePromotion', () => {
  it('returns the label and estimated discount for a store code', async () => {
    const stripe = fakeStripe([promotion()])
    await expect(resolveStorePromotion(input, stripe)).resolves.toEqual(expect.objectContaining({ id: 'promo_1', code: 'LAUNCH15', label: '15% off', discountCents: 450 }))
    expect(stripe.promotionCodes.list).toHaveBeenCalledWith(expect.objectContaining({ code: 'LAUNCH15', active: true }))
  })

  it('refuses codes that were not made for the store', async () => {
    await expect(resolveStorePromotion(input, fakeStripe([promotion({ metadata: {} })]))).rejects.toThrow('That promo code is not valid.')
    await expect(resolveStorePromotion(input, fakeStripe([]))).rejects.toThrow('That promo code is not valid.')
  })

  it('explains expired, used up and minimum-order codes', async () => {
    await expect(resolveStorePromotion(input, fakeStripe([promotion({ expires_at: 1 })]))).rejects.toThrow('expired')
    await expect(resolveStorePromotion(input, fakeStripe([promotion({ max_redemptions: 2, times_redeemed: 2 })]))).rejects.toThrow('used up')
    await expect(resolveStorePromotion(input, fakeStripe([promotion({ restrictions: { minimum_amount: 5000 } })]))).rejects.toThrow('$50.00 or more')
  })

  it('allows a once-per-email code only once for each email', async () => {
    const limit = vi.fn().mockResolvedValueOnce([{ id: 'earlier-order' }]).mockResolvedValueOnce([])
    const query = { from: () => query, where: () => query, limit }
    vi.mocked(getDb).mockReturnValue({ select: () => query } as never)
    const stripe = fakeStripe([promotion({ metadata: { scope: 'merch', oncePerEmail: 'true' } })])
    await expect(resolveStorePromotion(input, stripe)).rejects.toThrow('already used with this email')
    await expect(resolveStorePromotion(input, stripe)).resolves.toMatchObject({ id: 'promo_1' })
  })
})

describe('admin store coupons', () => {
  it('lists only store codes', async () => {
    const coupons = await listStoreCoupons(fakeStripe([promotion(), promotion({ id: 'promo_other', metadata: {} })]))
    expect(coupons.map(c => c.id)).toEqual(['promo_1'])
  })

  it('creates a one-time store coupon and its code', async () => {
    const stripe = fakeStripe([])
    const created = await createStoreCoupon({ code: 'FIVE', kind: 'amount', value: 500, expiresAt: null, maxRedemptions: 10, oncePerEmail: true, minimumCents: null }, stripe)
    expect(stripe.coupons.create).toHaveBeenCalledWith(expect.objectContaining({ duration: 'once', amount_off: 500, currency: 'usd', metadata: { scope: 'merch' } }))
    expect(stripe.promotionCodes.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'FIVE', max_redemptions: 10, promotion: { type: 'coupon', coupon: 'co_new' }, metadata: { scope: 'merch', oncePerEmail: 'true' } }))
    expect(created).toMatchObject({ id: 'promo_new', code: 'FIVE', oncePerEmail: true })
  })

  it('refuses a code that already exists', async () => {
    await expect(createStoreCoupon({ code: 'LAUNCH15', kind: 'percent', value: 15, expiresAt: null, maxRedemptions: null, oncePerEmail: false, minimumCents: null }, fakeStripe([promotion()]))).rejects.toThrow('already exists')
  })

  it('only switches store codes on and off', async () => {
    const stripe = fakeStripe([promotion({ metadata: {} })])
    await expect(setStoreCouponActive('promo_1', false, stripe)).rejects.toThrow('not a store code')
    expect(stripe.promotionCodes.update).not.toHaveBeenCalled()
  })
})
