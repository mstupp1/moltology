import { createAuthClient } from '@neondatabase/neon-js/auth'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react'

const neonAuthUrl = (import.meta as any).env?.VITE_NEON_AUTH_URL || 'https://ep-cold-breeze-aye6s748.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth'

export const authClient = createAuthClient(neonAuthUrl, {
  adapter: BetterAuthReactAdapter()
})
