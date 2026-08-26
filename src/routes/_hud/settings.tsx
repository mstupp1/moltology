import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/hud/settings/SettingsPage'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function SettingsRoute() {
  return (
    <GuestLockGuard
      featureName="Settings"
      message="Avatar and account preferences require a signed-in account."
    >
      <SettingsPage />
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/settings')({
  component: SettingsRoute,
  pendingComponent: HudWorkspaceGhost,
})
