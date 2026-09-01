import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

const LazyPipelineView = lazy(() => import('@/components/hud/PipelineView'))

function PipelineRoute() {
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyPipelineView />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/pipeline')({
  component: PipelineRoute,
  pendingComponent: HudWorkspaceGhost,
})
