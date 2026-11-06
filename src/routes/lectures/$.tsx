import { createFileRoute, redirect } from '@tanstack/react-router'

// Academy moved from /lectures to /academy. vercel.json sends a 301 in production;
// this covers in-app links saved before the move.
export const Route = createFileRoute('/lectures/$')({
  beforeLoad: ({ params }) => {
    const rest = params._splat ? `/${params._splat}` : ''
    throw redirect({ href: `/academy${rest}`, replace: true })
  },
})
