import { createFileRoute, redirect } from '@tanstack/react-router'

// Member voices are now a section of the About overview. vercel.json sends a 301 in production.
export const Route = createFileRoute('/what-is-moltology/what-moltologists-say')({
  beforeLoad: () => {
    throw redirect({ to: '/what-is-moltology', hash: 'voices', replace: true })
  },
})
