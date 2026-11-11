import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HiddenPageGuard } from '@/components/hud/HiddenPageGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyAvatar3DLab = lazy(() => import('@/components/hud/avatar3d/Avatar3DLab'))

function Character3DRoute() {
  return (
    <HiddenPageGuard skeleton={<HudWorkspaceGhost />}>
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyAvatar3DLab />
      </Suspense>
    </HiddenPageGuard>
  )
}

export const Route = createFileRoute('/_hud/character_/3d')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: privatePageSeo({
      title: '3D character preview | Moltology',
      description: 'Preview the 3D character builder.',
    }),
  }),
  component: Character3DRoute,
  pendingComponent: HudWorkspaceGhost,
})
