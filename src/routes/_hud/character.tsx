import React, { Suspense, lazy } from 'react'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

const LazyChassisStatusPage = lazy(() =>
  import('@/components/hud/chassis/ChassisStatusPage').then((m) => ({ default: m.ChassisStatusPage }))
)

function ChassisRoute() {
  return (
    // Open to guests: they edit the starter character and sign up to keep it.
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyChassisStatusPage />
      </Suspense>
    </div>
  )
}

export const Route = createFileRoute('/_hud/character')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: privatePageSeo({
      title: 'Character | Moltology',
      description: 'Customize your character and seat gear from your vault.',
    }),
  }),
  component: ChassisRoute,
  pendingComponent: HudWorkspaceGhost,
})

