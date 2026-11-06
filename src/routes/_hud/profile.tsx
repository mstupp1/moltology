import React from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { ProfileTabsPage } from '@/components/hud/profile/ProfileTabsPage'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { useAuthSession } from '@/hooks/useAuthSession'
import { parseProfilePageTab, type ProfilePageTab } from '@/lib/connections'
import { memberProfileSeo, xRobotsNoindexHeaders } from '@/lib/seo'

export type ProfileSearch = {
  tab?: ProfilePageTab
}

function OwnProfileRoute() {
  const session = useAuthSession()
  const navigate = useNavigate()
  const search = useSearch({ from: '/_hud/profile' })
  const profileId = session.userId

  return (
    <GuestLockGuard
      featureName="Member Profiles"
      message="Your profile, activity, friends and friend requests need a signed-in account."
    >
      {profileId ? (
        <ProfileTabsPage
          profileId={profileId}
          tab={search.tab}
          onTabChange={(next) => navigate({ to: '/profile', search: { tab: next }, replace: true })}
        />
      ) : (
        <HudWorkspaceGhost />
      )}
    </GuestLockGuard>
  )
}

// /friends, /connections and /stream all land on a tab here (301s in vercel.json).
export const Route = createFileRoute('/_hud/profile')({
  validateSearch: (search: Record<string, unknown>): ProfileSearch => ({
    tab: parseProfilePageTab(search.tab),
  }),
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [...memberProfileSeo()],
  }),
  component: OwnProfileRoute,
  pendingComponent: HudWorkspaceGhost,
})
