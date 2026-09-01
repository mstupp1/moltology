import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyDashboardView = lazy(() => import('@/components/hud/DashboardView'))

function DashboardRoute() {
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyDashboardView />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/dashboard')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Central HUD | Moltology',
        description: 'Initiate telemetry, daily alignment, and benthic workspace for authenticated units.',
      }),
    ],
  }),
  component: DashboardRoute,
  pendingComponent: HudWorkspaceGhost,
})
