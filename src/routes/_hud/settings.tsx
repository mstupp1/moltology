import React, { Suspense, lazy, useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { settingsSearchSchema } from '@/lib/auth-search'

const LazySettingsPage = lazy(() =>
  import('@/components/hud/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)

function SettingsRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [oauthError] = useState(search.error)

  useEffect(() => {
    if (!search.error) return
    void navigate({ to: '/settings', search: {}, replace: true })
  }, [search.error, navigate])

  return (
    <GuestLockGuard
      featureName="Settings"
      message="Avatar and account preferences require a signed-in account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazySettingsPage oauthError={oauthError} />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/settings')({
  validateSearch: (search: Record<string, unknown>) => settingsSearchSchema.parse(search),
  component: SettingsRoute,
  pendingComponent: HudWorkspaceGhost,
})
