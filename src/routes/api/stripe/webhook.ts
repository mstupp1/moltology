import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleStripeWebhookRequest } = await import('@/lib/server/premium')
        return handleStripeWebhookRequest(request)
      },
    },
  },
})
