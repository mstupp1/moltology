import type Stripe from 'stripe'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../../db'
import { merchOrders } from '../../db/schema'
import { PAID_PAYMENT_STATUSES } from '../shop-orders'
import {
  STORE_COUPON_INVALID,
  STORE_COUPON_SCOPE,
  couponExpiryTimestamp,
  estimateCouponDiscountCents,
  normalizeCouponCode,
  storeCouponLabel,
  type StoreCouponCreate,
  type StoreCouponTerms,
  type StoreCouponView,
} from '../store-coupons'
import { storeStripe } from './store'

export interface StorePromotion extends StoreCouponTerms {
  id: string
  code: string
  label: string
  discountCents: number
  oncePerEmail: boolean
}

function couponOf(promotion: Stripe.PromotionCode): Stripe.Coupon | null {
  const coupon = promotion.promotion?.coupon
  return coupon && typeof coupon === 'object' ? coupon : null
}

function termsOf(coupon: Stripe.Coupon): StoreCouponTerms {
  return { percentOff: coupon.percent_off ?? null, amountOffCents: coupon.amount_off ?? null }
}

/**
 * Checks a code the shopper typed. Stripe enforces expiry and use limits again at checkout;
 * the store adds its own scope check and the once-per-email rule, since store customers are per order.
 */
export async function resolveStorePromotion(input: { code: string; email: string; subtotalCents: number }, stripe = storeStripe()): Promise<StorePromotion> {
  const code = normalizeCouponCode(input.code)
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new Error(STORE_COUPON_INVALID)
  const { data } = await stripe.promotionCodes.list({ code, active: true, limit: 1, expand: ['data.promotion.coupon'] })
  const promotion = data[0]
  const coupon = promotion ? couponOf(promotion) : null
  if (!promotion || !coupon || !coupon.valid || promotion.metadata?.scope !== STORE_COUPON_SCOPE) throw new Error(STORE_COUPON_INVALID)
  if (promotion.expires_at && promotion.expires_at * 1000 <= Date.now()) throw new Error('That promo code has expired.')
  if (promotion.max_redemptions != null && promotion.times_redeemed >= promotion.max_redemptions) throw new Error('That promo code has been used up.')
  if (coupon.amount_off != null && coupon.currency !== 'usd') throw new Error(STORE_COUPON_INVALID)
  const minimum = promotion.restrictions?.minimum_amount
  if (minimum && input.subtotalCents < minimum) throw new Error(`That promo code needs an order of $${(minimum / 100).toFixed(2)} or more.`)
  if (promotion.metadata?.oncePerEmail === 'true') {
    const [used] = await getDb().select({ id: merchOrders.id }).from(merchOrders).where(and(
      eq(merchOrders.promotionCodeId, promotion.id),
      eq(merchOrders.customerEmail, input.email),
      inArray(merchOrders.paymentStatus, [...PAID_PAYMENT_STATUSES]),
    )).limit(1)
    if (used) throw new Error('That promo code was already used with this email.')
  }
  const terms = termsOf(coupon)
  return { id: promotion.id, code: promotion.code, ...terms, label: storeCouponLabel(terms), discountCents: estimateCouponDiscountCents(terms, input.subtotalCents), oncePerEmail: promotion.metadata?.oncePerEmail === 'true' }
}

function toView(promotion: Stripe.PromotionCode): StoreCouponView | null {
  const coupon = couponOf(promotion)
  if (!coupon) return null
  return {
    id: promotion.id,
    code: promotion.code,
    active: promotion.active,
    ...termsOf(coupon),
    expiresAt: promotion.expires_at ? new Date(promotion.expires_at * 1000).toISOString() : null,
    maxRedemptions: promotion.max_redemptions,
    timesRedeemed: promotion.times_redeemed,
    oncePerEmail: promotion.metadata?.oncePerEmail === 'true',
    minimumCents: promotion.restrictions?.minimum_amount ?? null,
    createdAt: new Date(promotion.created * 1000).toISOString(),
  }
}

/** Store codes only, newest first. Codes made for anything else in Stripe stay out of this list. */
export async function listStoreCoupons(stripe = storeStripe()): Promise<StoreCouponView[]> {
  const { data } = await stripe.promotionCodes.list({ limit: 100, expand: ['data.promotion.coupon'] })
  return data.filter(p => p.metadata?.scope === STORE_COUPON_SCOPE).map(toView).filter((v): v is StoreCouponView => v !== null)
}

export async function createStoreCoupon(input: StoreCouponCreate, stripe = storeStripe()): Promise<StoreCouponView> {
  const { data: taken } = await stripe.promotionCodes.list({ code: input.code, limit: 1 })
  if (taken.length) throw new Error('That code already exists in Stripe. Pick another.')
  const expiresAt = input.expiresAt ? couponExpiryTimestamp(input.expiresAt) : undefined
  if (expiresAt && expiresAt * 1000 <= Date.now()) throw new Error('Pick an expiry date in the future.')
  const coupon = await stripe.coupons.create({
    name: input.code,
    duration: 'once',
    ...(input.kind === 'percent' ? { percent_off: input.value } : { amount_off: input.value, currency: 'usd' }),
    metadata: { scope: STORE_COUPON_SCOPE },
  })
  const promotion = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code: input.code,
    ...(expiresAt ? { expires_at: expiresAt } : {}),
    ...(input.maxRedemptions ? { max_redemptions: input.maxRedemptions } : {}),
    ...(input.minimumCents ? { restrictions: { minimum_amount: input.minimumCents, minimum_amount_currency: 'usd' } } : {}),
    metadata: { scope: STORE_COUPON_SCOPE, oncePerEmail: String(input.oncePerEmail) },
    expand: ['promotion.coupon'],
  })
  const view = toView(promotion)
  if (!view) throw new Error('Stripe did not return the new code.')
  return view
}

export async function setStoreCouponActive(id: string, active: boolean, stripe = storeStripe()): Promise<void> {
  const promotion = await stripe.promotionCodes.retrieve(id)
  if (promotion.metadata?.scope !== STORE_COUPON_SCOPE) throw new Error('That code is not a store code.')
  await stripe.promotionCodes.update(id, { active })
}
