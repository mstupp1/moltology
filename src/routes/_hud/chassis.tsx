import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChassisStatusPage } from '@/components/hud/chassis/ChassisStatusPage'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function ChassisRoute() {
  return (
    <GuestLockGuard
      featureName="Chassis Configurator"
      message="Chassis loadout, vault storage, and hardpoint calibration require an authorized initiate account."
    >
      <div className="flex flex-col flex-1 min-h-0 h-full w-full">
        <ChassisStatusPage />
      </div>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/chassis')({
  component: ChassisRoute,
  pendingComponent: HudWorkspaceGhost,
})
