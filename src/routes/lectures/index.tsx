import { createFileRoute, redirect } from '@tanstack/react-router'

// Academy moved from /lectures to /academy. vercel.json sends a 301 in production.
export const Route = createFileRoute('/lectures/')({
  beforeLoad: () => {
    throw redirect({ to: '/academy', replace: true })
  },
})
