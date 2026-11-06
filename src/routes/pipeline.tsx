import { createFileRoute, redirect } from '@tanstack/react-router'

// The stage guide moved to /stages. vercel.json sends a 301 in production;
// this covers activity items and in-app links saved before the move.
export const Route = createFileRoute('/pipeline')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({ to: '/stages', search, replace: true })
  },
})
