import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: '/auth',
      search: {
        ...search,
        mode: 'signup',
      },
    })
  },
})
