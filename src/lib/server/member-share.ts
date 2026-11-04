import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { loggingOnlyMiddleware } from './functions'

/** Only the public member name is available to link-preview crawlers. */
export const getMemberShareIdentityFn = createServerFn({ method: 'GET' })
  .middleware(loggingOnlyMiddleware)
  .validator((data: { profileId: string }) => z.object({ profileId: z.string().min(1).max(128) }).parse(data))
  .handler(async ({ data }) => {
    const { getMemberShareIdentity } = await import('./member-share-data')
    return getMemberShareIdentity(data.profileId)
  })
