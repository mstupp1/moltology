import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

const LazyCurrentRunnerPage = lazy(() => import('@/components/arcade/ArcadePages').then((m) => ({ default: m.CurrentRunnerPage })))

function CurrentRunnerRoute() {
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyCurrentRunnerPage />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/arcade/current-runner')({
  head: () => ({
    meta: seo({
      title: 'Current Runner | Moltology Arcade',
      description: 'Run the seafloor as your own character, jumping urchins and ducking jellyfish. Weekly top scores win Chitin Gems.',
    }),
  }),
  component: CurrentRunnerRoute,
  pendingComponent: HudWorkspaceGhost,
})
