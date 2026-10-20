import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyDashboardView = lazy(() => import('@/components/hud/DashboardView'))

function DashboardRoute() {
  return (
    <Suspense fallback={<DashboardGhost />}>
      <LazyDashboardView />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/dashboard')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Dashboard | Moltology',
        description: 'Your day in Moltology: liturgies, streak, community and what is new.',
      }),
    ],
  }),
  component: DashboardRoute,
  pendingComponent: DashboardGhost,
})
