import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/email/webhook')({
  server: { handlers: {
    POST: async ({ request }) => {
      const { handleResendWebhook } = await import('@/lib/server/resend-webhook')
      return handleResendWebhook(request)
    },
  } },
})
