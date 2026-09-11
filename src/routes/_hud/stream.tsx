import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyActivityStreamPage = lazy(() =>
  import('@/components/hud/ActivityStreamPage').then((m) => ({ default: m.ActivityStreamPage }))
)

function ActivityStreamRoute() {
  return (
    <GuestLockGuard
      featureName="Activity Stream"
      message="Seeing activity from your circle requires a signed-in account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyActivityStreamPage />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/stream')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Activity Stream | Moltology',
        description: 'See liturgies, streaks, and stage changes from you and your circle.',
      }),
    ],
  }),
  component: ActivityStreamRoute,
  pendingComponent: HudWorkspaceGhost,
})
