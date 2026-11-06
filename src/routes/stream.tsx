import { createFileRoute, redirect } from '@tanstack/react-router'

// The activity feed is now the Activity tab of /profile. vercel.json sends a 301 in production;
// this covers in-app links saved before the move.
export const Route = createFileRoute('/stream')({
  beforeLoad: () => {
    throw redirect({ to: '/profile', search: { tab: 'activity' }, replace: true })
  },
})
