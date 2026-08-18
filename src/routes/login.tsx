import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
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
