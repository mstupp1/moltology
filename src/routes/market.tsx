import { createFileRoute, redirect } from '@tanstack/react-router'

// The gear shop moved to /character/shop. vercel.json sends a 301 in production;
// this covers toasts and in-app links saved before the move.
export const Route = createFileRoute('/market')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({ to: '/character/shop', search, replace: true })
  },
})
