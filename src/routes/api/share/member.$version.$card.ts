import { createFileRoute } from '@tanstack/react-router'

/** A member's share card (og:image), drawn from their saved 3D portrait. */
export const Route = createFileRoute('/api/share/member/$version/$card')({
  server: {
    handlers: {
      GET: async ({ params }) =>
        (await import('@/lib/server/share-card')).handleMemberCardRequest(params.version, params.card),
    },
  },
})
