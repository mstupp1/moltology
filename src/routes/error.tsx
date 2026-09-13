import { createFileRoute, redirect } from '@tanstack/react-router'
import { oauthErrorSearchSchema } from '@/lib/auth-search'

export const Route = createFileRoute('/error')({
  validateSearch: (search: Record<string, unknown>) => oauthErrorSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/auth',
      search: search.error ? { error: search.error } : {},
      replace: true,
    })
  },
})
