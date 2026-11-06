import { createFileRoute, redirect } from '@tanstack/react-router'

// Old duplicate of the homepage. vercel.json sends a 301 in production.
export const Route = createFileRoute('/landing')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({ to: '/', search, replace: true })
  },
})
