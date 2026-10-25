import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { publicMiddleware } from './functions'

export const getOracleUsageFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => z.object({ token: z.string().optional(), userId: z.string().optional() }).parse(data ?? {}))
  .handler(async (args) => {
    const { getOracleUsageHandler } = await import('./oracle-usage')
    return getOracleUsageHandler(args)
  })
