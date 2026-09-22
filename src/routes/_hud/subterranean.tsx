import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HiddenPageGuard } from '@/components/hud/HiddenPageGuard'
import { SubterraneanHubGhost } from '@/components/hud/HudGhostSkeletons'

const LazySubterraneanView = lazy(() => import('@/components/hud/SubterraneanView'))

function SubterraneanPage() {
  return (
    <HiddenPageGuard skeleton={<SubterraneanHubGhost />}>
      <Suspense fallback={<SubterraneanHubGhost />}>
        <LazySubterraneanView />
      </Suspense>
    </HiddenPageGuard>
  )
}

export const Route = createFileRoute('/_hud/subterranean')({
  component: SubterraneanPage,
  pendingComponent: SubterraneanHubGhost,
})
