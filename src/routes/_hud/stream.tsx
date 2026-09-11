import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { ACTIVITY_STREAM_GUEST_LOCK_MESSAGE, ACTIVITY_STREAM_PAGE_DESCRIPTION } from '@/lib/activity-events'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyActivityStreamPage = lazy(() =>
  import('@/components/hud/ActivityStreamPage').then((m) => ({ default: m.ActivityStreamPage }))
)

function ActivityStreamRoute() {
  return (
    <GuestLockGuard
      featureName="Activity Stream"
      message={ACTIVITY_STREAM_GUEST_LOCK_MESSAGE}
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
        description: ACTIVITY_STREAM_PAGE_DESCRIPTION,
      }),
    ],
  }),
  component: ActivityStreamRoute,
  pendingComponent: HudWorkspaceGhost,
})
