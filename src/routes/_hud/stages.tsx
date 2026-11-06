import React, { Suspense, lazy } from 'react'
import { SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'
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

export const Route = createFileRoute('/_hud/stages')({
  head: () => ({
    links: [canonicalLink(`${SITE_ORIGIN}/stages`)],
    meta: seo({
      canonical: `${SITE_ORIGIN}/stages`,
      title: 'Stages | Moltology',
      description: 'The four stages, your XP and what opens next.',
    }),
  }),
  component: PipelineRoute,
  pendingComponent: HudWorkspaceGhost,
})
