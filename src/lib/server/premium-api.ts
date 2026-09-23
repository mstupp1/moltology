import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { publicMiddleware } from './functions'

const authDataSchema = z.object({
  token: z.string().optional(),
  userId: z.string().optional(),
})

export const getPremiumMembershipFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => authDataSchema.parse(data ?? {}))
  .handler(async (args) => {
    const { getPremiumMembershipHandler } = await import('./premium')
    return getPremiumMembershipHandler(args)
  })

export const getPremiumOfferFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => authDataSchema.parse(data ?? {}))
  .handler(async (args) => {
    const { getPremiumOfferHandler } = await import('./premium')
    return getPremiumOfferHandler(args)
  })

export const createPremiumCheckoutFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => authDataSchema.parse(data ?? {}))
  .handler(async (args) => {
    const { createPremiumCheckoutHandler } = await import('./premium')
    return createPremiumCheckoutHandler(args)
  })

export const createPremiumPortalFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => authDataSchema.parse(data ?? {}))
  .handler(async (args) => {
    const { createPremiumPortalHandler } = await import('./premium')
    return createPremiumPortalHandler(args)
  })
