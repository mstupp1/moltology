import { createFileRoute, redirect } from '@tanstack/react-router'

// The gear page moved to /character. vercel.json sends a 301 in production;
// this covers in-app links saved before the move.
export const Route = createFileRoute('/chassis')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({ to: '/character', search, replace: true })
  },
})
