import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyConnectionsPage = lazy(() =>
  import('@/components/hud/connections/ConnectionsPage').then((m) => ({ default: m.ConnectionsPage }))
)

function ConnectionsRoute() {
  return (
    <GuestLockGuard
      featureName="Connections"
      message="Connections, friend requests, and member search require a signed-in account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyConnectionsPage />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/connections')({
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
