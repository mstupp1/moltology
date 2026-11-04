import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/i/$referrerId')({
  server: { handlers: {
    GET: async ({ request, params }) => {
      const { handleInvitation } = await import('@/lib/server/referrals')
      return handleInvitation(request, params.referrerId)
    },
  } },
})
