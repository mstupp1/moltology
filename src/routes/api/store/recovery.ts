import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/store/recovery')({ server: { handlers: {
  POST: async ({ request }) => (await import('@/lib/server/store-http')).handleStoreRecoveryRequest(request),
} } })
