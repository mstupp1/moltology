import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

const LazyArcadeHome = lazy(() => import('@/components/arcade/ArcadePages').then((m) => ({ default: m.ArcadeHome })))

function ArcadeRoute() {
  // Open to guests: they play every game and sign up to keep their scores.
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyArcadeHome />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/arcade/')({
  head: () => ({
    meta: seo({
      title: 'Arcade | Moltology',
      description: 'Short games starring your own Moltology character, with weekly leaderboards.',
    }),
  }),
  component: ArcadeRoute,
  pendingComponent: HudWorkspaceGhost,
})
