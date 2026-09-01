import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

const LazyIsolationView = lazy(() => import('@/components/hud/IsolationView'))

function IsolationRoute() {
  return (
    <GuestLockGuard
      featureName="Isolation Feed"
      message="Sub-benthic video isolation monitoring requires an authorized initiate account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyIsolationView />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/isolation')({
  component: IsolationRoute,
  pendingComponent: HudWorkspaceGhost,
})
