import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/email/confirm')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleEmailOptInConfirm } = await import('@/lib/server/email-opt-in')
        return handleEmailOptInConfirm(request)
      },
    },
  },
})
