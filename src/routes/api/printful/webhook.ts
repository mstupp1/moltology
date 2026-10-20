import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/printful/webhook')({ server: { handlers: {
  POST: async ({ request }) => (await import('@/lib/server/store-http')).handlePrintfulWebhookRequest(request),
} } })
