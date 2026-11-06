import React, { Suspense, lazy } from 'react'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { CharacterSectionNav } from '@/components/hud/chassis/CharacterSectionNav'

const LazyChassisStatusPage = lazy(() =>
  import('@/components/hud/chassis/ChassisStatusPage').then((m) => ({ default: m.ChassisStatusPage }))
)

function ChassisRoute() {
  return (
    <GuestLockGuard
      featureName="Character"
      message="Chassis loadout, vault storage, and hardpoint calibration require an authorized initiate account."
    >
      <div className="flex flex-col flex-1 min-h-0 h-full w-full">
        {/* Sits above the workspace so the pinned phone stage keeps its single header row. */}
        <CharacterSectionNav current="customize" className="w-max mb-3 sm:mb-5 md:mb-7 lg:mb-5" />
        <Suspense fallback={<HudWorkspaceGhost />}>
          <LazyChassisStatusPage />
        </Suspense>
      </div>
    </GuestLockGuard>
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

