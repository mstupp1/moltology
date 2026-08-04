import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/blog/$slug')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/news/$slug', params: { slug: params.slug }, replace: true })
  },
})
