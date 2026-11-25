import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

const LazyVentHopperPage = lazy(() =>
  import('@/components/arcade/ArcadePages').then((m) => ({
    default: m.VentHopperPage,
  })),
)

function VentHopperRoute() {
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyVentHopperPage />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/arcade/vent-hopper')({
  head: () => ({
    meta: seo({
      title: 'Vent Hopper | Moltology Arcade',
      description: 'Bounce your own character up a vent shaft toward the light, pad by pad, dodging urchins. Weekly top scores win Chitin Gems.',
    }),
  }),
  component: VentHopperRoute,
  pendingComponent: HudWorkspaceGhost,
})
