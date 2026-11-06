import { createFileRoute, redirect } from '@tanstack/react-router'

// The stage guide is now the Progress tab of /character. vercel.json sends a 301 in production;
// this covers activity items and in-app links saved before the move.
export const Route = createFileRoute('/pipeline')({
  beforeLoad: () => {
    throw redirect({ to: '/character/progress', replace: true })
  },
})
