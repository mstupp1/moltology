import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: '/auth',
      search: {
        ...search,
        mode: 'login',
      },
    })
  },
})
