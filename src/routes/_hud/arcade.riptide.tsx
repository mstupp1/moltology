import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

const LazyRiptidePage = lazy(() => import('@/components/arcade/ArcadePages').then((m) => ({ default: m.RiptidePage })))

function RiptideRoute() {
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyRiptidePage />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/arcade/riptide')({
  head: () => ({
    meta: seo({
      title: 'Riptide | Moltology Arcade',
      description: 'Swim your own character through a reef current. Weekly top scores win Chitin Gems.',
    }),
  }),
  component: RiptideRoute,
  pendingComponent: HudWorkspaceGhost,
})
