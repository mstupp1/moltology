import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

const LazySettingsPage = lazy(() =>
  import('@/components/hud/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)

function SettingsRoute() {
  return (
    <GuestLockGuard
      featureName="Settings"
      message="Avatar and account preferences require a signed-in account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazySettingsPage />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/settings')({
  component: SettingsRoute,
  pendingComponent: HudWorkspaceGhost,
})
