import { createFileRoute, redirect } from '@tanstack/react-router'

// Covenant Watch is the first tab of /admin. vercel.json sends a 301 in production;
// this covers in-app links saved before the move.
export const Route = createFileRoute('/watch')({
  beforeLoad: () => {
    throw redirect({ to: '/admin', search: { tab: 'watch' }, replace: true })
  },
})
