import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ConnectionsPage } from '@/components/hud/connections/ConnectionsPage'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function ConnectionsRoute() {
  return (
    <GuestLockGuard
      featureName="Connections"
      message="Connections, friend requests, and member search require a signed-in account."
    >
      <ConnectionsPage />
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/connections')({
  component: ConnectionsRoute,
  pendingComponent: HudWorkspaceGhost,
})
