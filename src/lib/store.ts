import { z } from 'zod'
import type { MerchLineItemSnapshot, MerchShippingAddress } from './merch'

export const STORE_QUOTE_TTL_MS = 10 * 60_000
export const STORE_DEFAULTS = {
  indexingEnabled: false, publicEnabled: false, checkoutPaused: false, enabledCountries: ['US'],
  fulfillmentMode: 'manual' as const,
  policiesApproved: false,
  shippingPolicy: '', returnsPolicy: '', cancellationPolicy: '', supportEmail: '',
}
export const storeSettingsSchema = z.object({
  indexingEnabled: z.boolean().default(false), publicEnabled: z.boolean(), checkoutPaused: z.boolean(),
  enabledCountries: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(30),
  fulfillmentMode: z.enum(['manual', 'automatic']), policiesApproved: z.boolean(),
  shippingPolicy: z.string().max(4000), returnsPolicy: z.string().max(4000),
  cancellationPolicy: z.string().max(4000), supportEmail: z.union([z.email(), z.literal('')]),
}).superRefine((v, ctx) => {
  if (v.publicEnabled && (!v.policiesApproved || !v.shippingPolicy || !v.returnsPolicy || !v.cancellationPolicy || !v.supportEmail))
    ctx.addIssue({ code: 'custom', message: 'Approve shipping, returns, cancellation and support information before opening the store.' })
})
export type StoreSettings = z.infer<typeof storeSettingsSchema>
const field = z.string().trim().min(1).max(150)
export const storeAddressSchema = z.object({
  name: field, line1: field, line2: z.string().trim().max(150).nullable().default(null),
  city: field, state: z.string().trim().max(100).nullable().default(null),
  postalCode: z.string().trim().min(1).max(20), country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  phone: z.string().trim().max(30).nullable().default(null),
}).superRefine((v, ctx) => {
  if (v.country === 'US' && (!/^[A-Z]{2}$/.test(v.state ?? '') || !/^\d{5}(-\d{4})?$/.test(v.postalCode)))
    ctx.addIssue({ code: 'custom', message: 'Enter a two-letter state and valid US ZIP code.' })
})
export const storeItemsSchema = z.array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(10) })).min(1).max(20)
export const storeDeliverySchema = z.object({ email: z.email().max(254).transform(v => v.trim().toLowerCase()), address: storeAddressSchema, items: storeItemsSchema })
export interface ShippingQuoteSnapshot {
  email: string
  address: MerchShippingAddress
  lines: MerchLineItemSnapshot[]
  service: string
  serviceName: string
  amountCents: number
  currency: 'usd'
  storeId: string
  quotedAt: string
}
export interface StoreShipment {
  id: string
  carrier: string
  trackingNumber: string
  trackingUrl: string | null
  shippedAt: string | null
  items: Array<{ itemId: string; quantity: number }>
}
export function quoteBinding(input: { email: string; address: MerchShippingAddress; lines: MerchLineItemSnapshot[] }) {
  return JSON.stringify({ email: input.email, address: input.address, lines: [...input.lines].sort((a,b) => a.variantId.localeCompare(b.variantId)) })
}
export function selectStandardRate(rates: Array<{ id?: string; name?: string; rate?: string; currency?: string }>) {
  const rate = rates.find(r => r.id === 'STANDARD' && r.currency?.toUpperCase() === 'USD' && /^\d+(\.\d{1,2})?$/.test(r.rate ?? ''))
  if (!rate) throw new Error('Standard shipping is unavailable for this address and cart.')
  const cents = Math.round(Number(rate.rate) * 100)
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Invalid shipping rate.')
  return { service: rate.id!, serviceName: rate.name || 'Standard shipping', amountCents: cents }
}
export function safeTrackingUrl(value: unknown): string | null {
  try { const url = new URL(String(value)); return url.protocol === 'https:' ? url.href : null } catch { return null }
}
