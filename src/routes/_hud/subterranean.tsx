import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SubterraneanHubGhost } from '@/components/hud/HudGhostSkeletons'

const LazySubterraneanView = lazy(() => import('@/components/hud/SubterraneanView'))

export const Route = createFileRoute('/_hud/subterranean')({
  component: () => (
    <Suspense fallback={<SubterraneanHubGhost />}>
      <LazySubterraneanView />
    </Suspense>
  ),
  pendingComponent: SubterraneanHubGhost,
})
