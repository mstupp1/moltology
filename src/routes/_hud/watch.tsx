import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyCovenantWatchPage = lazy(() =>
  import('@/components/forum/CovenantWatchPage').then((m) => ({ default: m.CovenantWatchPage })),
)

function CovenantWatchRoute() {
  return (
    <AdminAccessGuard skeleton={<HudWorkspaceGhost />}>
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyCovenantWatchPage />
      </Suspense>
    </AdminAccessGuard>
  )
}

export const Route = createFileRoute('/_hud/watch')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Covenant Watch | Moltology',
        description: 'Quiet steward review of flagged forum transmissions.',
      }),
    ],
  }),
  component: CovenantWatchRoute,
  pendingComponent: HudWorkspaceGhost,
})
