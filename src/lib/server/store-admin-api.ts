import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { publicMiddleware } from './functions'
const auth = z.object({ token: z.string().optional(), userId: z.string().optional() })
export const getAdminStoreFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => auth.extend({ query: z.string().max(100).optional(), reviewOnly: z.boolean().optional(), mode: z.enum(['test','live']).optional() }).parse(data))
  .handler(async args => (await import('./store-operations')).getAdminStore(args))
export const mutateAdminStoreFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => auth.extend({ action: z.enum(['settings','availability','retry','reconcile']), target: z.string().max(100).optional(), value: z.unknown().optional() }).parse(data))
  .handler(async args => (await import('./store-operations')).mutateAdminStore(args))
