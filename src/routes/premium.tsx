import { createFileRoute, redirect } from '@tanstack/react-router'

// Oracle MAX moved from /premium to /max. vercel.json sends a 301 in production;
// this covers in-app links and checkout returns saved before the move.
export const Route = createFileRoute('/premium')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({ to: '/max', search, replace: true })
  },
})
