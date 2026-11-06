import { createFileRoute, redirect } from '@tanstack/react-router'
import { parseConnectionsTab } from '@/lib/connections'

// The friends list is now part of /friends. vercel.json sends a 301 in production;
// this covers notifications and in-app links saved before the move.
export const Route = createFileRoute('/connections')({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: '/friends',
      search: { tab: parseConnectionsTab(search.tab) },
      replace: true,
    })
  },
})
