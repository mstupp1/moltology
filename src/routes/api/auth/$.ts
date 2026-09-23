import { createFileRoute } from '@tanstack/react-router'
import { authRequestNeedsJwksHeal } from '@/lib/auth-config'
import { auth, ensureValidJwks } from '@/lib/auth-server'
import { readEmailSignupGate } from '@/lib/server/signup-gate'
import { runWithSignupTelemetry } from '@/lib/server/signup-request-state'

async function handleAuthRequest(request: Request) {
  if (authRequestNeedsJwksHeal(request.url)) {
    await ensureValidJwks()
  }
  const gate = await readEmailSignupGate(request)
  if (gate.kind === 'reject') return gate.response
  if (gate.telemetry) {
    return runWithSignupTelemetry(gate.telemetry, () => auth.handler(request))
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
