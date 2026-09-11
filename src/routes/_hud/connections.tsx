import React, { Suspense, lazy } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { parseConnectionsTab, type ConnectionsTab } from '@/lib/connections'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyConnectionsPage = lazy(() =>
  import('@/components/hud/connections/ConnectionsPage').then((m) => ({ default: m.ConnectionsPage }))
)

export type ConnectionsSearch = {
  tab?: ConnectionsTab
}

function ConnectionsRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const tab = parseConnectionsTab(search.tab)

  return (
    <GuestLockGuard
      featureName="Connections"
      message="Connections, friend requests, and member search require a signed-in account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyConnectionsPage
          tab={tab}
          onTabChange={(next) =>
            navigate({ to: '/connections', search: { tab: next }, replace: true })
          }
        />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/connections')({
  validateSearch: (search: Record<string, unknown>): ConnectionsSearch => ({
    tab: parseConnectionsTab(search.tab),
  }),
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Connections | Moltology',
        description: 'Find members, send friend requests, and keep your circle close.',
      }),
    ],
  }),
  component: ConnectionsRoute,
  pendingComponent: HudWorkspaceGhost,
})
