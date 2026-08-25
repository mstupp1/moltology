import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_hud/hud')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: '/dashboard',
      search,
      replace: true,
    })
  },
})
