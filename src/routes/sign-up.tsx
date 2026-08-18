import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up')({
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
