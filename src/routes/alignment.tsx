import { createFileRoute, redirect } from '@tanstack/react-router'

// The Daily alignment page was removed: today's tasks live in the avatar menu.
// vercel.json sends a 301 in production; this covers in-app links and saved activity rows.
export const Route = createFileRoute('/alignment')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard', replace: true })
  },
})
