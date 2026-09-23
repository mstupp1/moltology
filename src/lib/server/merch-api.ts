import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
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
  .validator((data: unknown) => {
    const parsed = authDataSchema
      .extend({
        items: z.array(checkoutItemSchema).max(30).optional(),
      })
      .safeParse(data ?? {})
    if (!parsed.success) {
      throw new Error('Add at least one piece before checkout.')
    }
    return {
      token: parsed.data.token,
      userId: parsed.data.userId,
      items: (parsed.data.items ?? []).map((item) => ({
        variantId: item.variantId ?? '',
        quantity: item.quantity ?? 0,
      })),
    }
  })
  .handler(async (args) => {
    const { createMerchCheckoutSessionHandler } = await import('./merch')
    return createMerchCheckoutSessionHandler(args)
  })
