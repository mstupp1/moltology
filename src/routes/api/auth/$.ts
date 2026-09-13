import { createFileRoute } from '@tanstack/react-router'
import { auth, ensureValidJwks } from '@/lib/auth-server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        await ensureValidJwks()
        return auth.handler(request)
      },
      POST: async ({ request }: { request: Request }) => {
        await ensureValidJwks()
        return auth.handler(request)
      },
    },
  },
})
