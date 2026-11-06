import { createFileRoute, redirect } from '@tanstack/react-router'
import { parseProfilePageTab } from '@/lib/connections'

// Friends is now part of /profile. vercel.json sends a 301 in production;
// this covers notifications and in-app links saved before the move.
export const Route = createFileRoute('/friends')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: '/profile',
      search: { tab: parseProfilePageTab(search.tab) ?? 'friends' },
      replace: true,
    })
  },
})
