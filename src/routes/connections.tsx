import { createFileRoute, redirect } from '@tanstack/react-router'
import { parseConnectionsTab } from '@/lib/connections'

// The friends list is now part of /profile. vercel.json sends a 301 in production;
// this covers notifications and in-app links saved before the move.
export const Route = createFileRoute('/connections')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: '/profile',
      search: { tab: parseConnectionsTab(search.tab) ?? 'friends' },
      replace: true,
    })
  },
})
