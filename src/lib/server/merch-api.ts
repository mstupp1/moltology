import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { storeDeliverySchema } from '../store'
import { publicMiddleware } from './functions'

const authDataSchema = z.object({
  token: z.string().optional(),
  userId: z.string().optional(),
})

const checkoutItemSchema = z.object({
  variantId: z.string().optional(),
  quantity: z.number().optional(),
})

export const getMerchCatalogFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => authDataSchema.parse(data ?? {}))
  .handler(async (args) => {
    const { getMerchCatalogHandler } = await import('./merch')
    return getMerchCatalogHandler(args)
  })

export const getMerchProductBySlugFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) =>
    authDataSchema
      .extend({
        slug: z.string().min(1),
      })
      .parse(data ?? {}),
  )
  .handler(async (args) => {
    const { getMerchProductBySlugHandler } = await import('./merch')
    return getMerchProductBySlugHandler(args)
  })

export const createMerchCheckoutSessionFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => storeDeliverySchema.extend({ token: z.string().optional(), userId: z.string().optional(), quoteId: z.uuid(), promoCode: z.string().max(40).optional() }).parse(data))
  .handler(async (args) => {
    const { createQuotedCheckout } = await import('./store')
    return createQuotedCheckout(args)
  })

export const quoteStoreShippingFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => storeDeliverySchema.extend({ token: z.string().optional(), userId: z.string().optional() }).parse(data))
  .handler(async args => {
    const { createStoreQuote } = await import('./store')
    return createStoreQuote(args)
  })

/** Checks a promo code against the cart before payment and returns the estimated discount. */
export const checkStorePromoFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => storeDeliverySchema.pick({ email: true, items: true }).extend({ token: z.string().optional(), userId: z.string().optional(), code: z.string().max(40) }).parse(data))
  .handler(async args => {
    const { limitStoreRequest, requireStoreOrdering, storePricedLines } = await import('./store')
    await requireStoreOrdering(args)
    await limitStoreRequest(`promo-ip:${(args.context as any)?.clientIp || 'unknown'}`, 20)
    const lines = await storePricedLines(args.data.items)
    const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
    const { resolveStorePromotion } = await import('./store-coupons')
    const promotion = await resolveStorePromotion({ code: args.data.code, email: args.data.email, subtotalCents })
    return { code: promotion.code, label: promotion.label, discountCents: promotion.discountCents }
  })

export const getStoreAccessFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .handler(async () => {
    const { readStoreSettings, isStorePublic } = await import('./store')
    const settings = await readStoreSettings()
    return { indexingEnabled: isStorePublic(settings) && settings.indexingEnabled, publicEnabled: isStorePublic(settings), orderingOpen: settings.orderingOpen, countries: settings.enabledCountries, checkoutPaused: settings.checkoutPaused,
      shippingPolicy: settings.shippingPolicy, returnsPolicy: settings.returnsPolicy, cancellationPolicy: settings.cancellationPolicy, supportEmail: settings.supportEmail }
  })

export const getStoreStatusFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => z.object({ order: z.uuid(), key: z.string().regex(/^[a-f0-9]{64}$/) }).parse(data))
  .handler(async ({ data, context }) => {
    const { getStoreStatus, limitStoreRequest } = await import('./store')
    await limitStoreRequest(`status-ip:${(context as any)?.clientIp || 'unknown'}`, 90)
    return getStoreStatus(data.order, data.key)
  })
