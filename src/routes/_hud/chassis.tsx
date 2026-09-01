import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

const LazyChassisStatusPage = lazy(() =>
  import('@/components/hud/chassis/ChassisStatusPage').then((m) => ({ default: m.ChassisStatusPage }))
)

function ChassisRoute() {
  return (
    <GuestLockGuard
      featureName="Chassis Configurator"
      message="Chassis loadout, vault storage, and hardpoint calibration require an authorized initiate account."
    >
      <div className="flex flex-col flex-1 min-h-0 h-full w-full">
        <Suspense fallback={<HudWorkspaceGhost />}>
          <LazyChassisStatusPage />
        </Suspense>
      </div>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/chassis')({
  component: ChassisRoute,
  pendingComponent: HudWorkspaceGhost,
})

