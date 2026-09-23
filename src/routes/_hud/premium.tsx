import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HiddenPageGuard } from '@/components/hud/HiddenPageGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyPremiumView = lazy(() => import('@/components/hud/PremiumView'))

function PremiumPage() {
  return (
    <HiddenPageGuard skeleton={<HudWorkspaceGhost />}>
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyPremiumView />
      </Suspense>
    </HiddenPageGuard>
  )
}

export const Route = createFileRoute('/_hud/premium')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Premium membership | Moltology',
        description: 'Monthly Premium membership. Rank, clearance, and forum authority stay earned.',
      }),
    ],
  }),
  component: PremiumPage,
  pendingComponent: HudWorkspaceGhost,
})
