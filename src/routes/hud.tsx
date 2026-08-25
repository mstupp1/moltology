import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/hud')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: '/dashboard',
      search,
      replace: true,
    })
  },
})
