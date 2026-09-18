import { createFileRoute } from '@tanstack/react-router'
import { authRequestNeedsJwksHeal } from '@/lib/auth-config'
import { auth, ensureValidJwks } from '@/lib/auth-server'

async function handleAuthRequest(request: Request) {
  if (authRequestNeedsJwksHeal(request.url)) {
    await ensureValidJwks()
  }
  return auth.handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleAuthRequest(request),
      POST: async ({ request }: { request: Request }) => handleAuthRequest(request),
    },
  },
})
