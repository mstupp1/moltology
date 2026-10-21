import { z } from 'zod'

/** Stripe metadata that marks a promotion code as made for the merch store. Others are refused. */
export const STORE_COUPON_SCOPE = 'merch'
export const STORE_COUPON_INVALID = 'That promo code is not valid.'

export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase()
}

export const storeCouponCodeSchema = z.string().transform(normalizeCouponCode).pipe(z.string().regex(/^[A-Z0-9_-]{3,32}$/, 'Codes use 3 to 32 letters, numbers, dashes or underscores.'))

export const storeCouponCreateSchema = z.object({
  code: storeCouponCodeSchema,
  kind: z.enum(['percent', 'amount']),
  /** Percent off (1 to 100) or dollars off in cents. */
  value: z.number().int().positive(),
  expiresAt: z.iso.date().nullable().default(null),
  maxRedemptions: z.number().int().min(1).max(100_000).nullable().default(null),
  oncePerEmail: z.boolean().default(false),
  minimumCents: z.number().int().min(0).max(1_000_000).nullable().default(null),
}).superRefine((v, ctx) => {
  if (v.kind === 'percent' && v.value > 100) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Percent off must be 1 to 100.' })
  if (v.kind === 'amount' && v.value > 100_000) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Amount off must be $1,000 or less.' })
})
export type StoreCouponCreate = z.infer<typeof storeCouponCreateSchema>

export interface StoreCouponTerms {
  percentOff: number | null
  amountOffCents: number | null
}

export interface StoreCouponView extends StoreCouponTerms {
  id: string
  code: string
  active: boolean
  expiresAt: string | null
  maxRedemptions: number | null
  timesRedeemed: number
  oncePerEmail: boolean
  minimumCents: number | null
  createdAt: string
}

/** "15% off" or "$5.00 off". */
export function storeCouponLabel(terms: StoreCouponTerms): string {
  if (terms.percentOff != null) return `${Number(terms.percentOff.toFixed(2))}% off`
  if (terms.amountOffCents != null) return `$${(terms.amountOffCents / 100).toFixed(2)} off`
  return 'Discount'
}

/**
 * The discount Stripe will take off the items. Coupons never apply to shipping or tax.
 * Stripe rounds per line item, so this can differ by a cent; the order saves Stripe's figure.
 */
export function estimateCouponDiscountCents(terms: StoreCouponTerms, subtotalCents: number): number {
  if (terms.percentOff != null) return Math.min(subtotalCents, Math.round(subtotalCents * terms.percentOff / 100))
  if (terms.amountOffCents != null) return Math.min(subtotalCents, terms.amountOffCents)
  return 0
}

/** End of the chosen day in UTC, so a code dated today still works today. */
export function couponExpiryTimestamp(date: string): number {
  return Math.floor(Date.parse(`${date}T23:59:59Z`) / 1000)
}
