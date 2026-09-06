import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyCovenantWatchPage = lazy(() =>
  import('@/components/forum/CovenantWatchPage').then((m) => ({ default: m.CovenantWatchPage })),
)

function CovenantWatchRoute() {
  return (
    <GuestLockGuard
      featureName="Covenant Watch"
      message="Covenant Watch is a signed-in steward ledger. Create a free account to continue."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyCovenantWatchPage />
      </Suspense>
    </GuestLockGuard>
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
