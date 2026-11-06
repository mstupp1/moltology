import React, { Suspense, lazy } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { FRIENDS_PAGE_DESCRIPTION, parseFriendsPageTab, type FriendsPageTab } from '@/lib/connections'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyFriendsPage = lazy(() =>
  import('@/components/hud/friends/FriendsPage').then((m) => ({ default: m.FriendsPage }))
)

export type FriendsSearch = {
  tab?: FriendsPageTab
}

function FriendsRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()

  return (
    <GuestLockGuard
      featureName="Friends"
      message="Your feed, friends, and friend requests need a signed-in account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyFriendsPage
          tab={search.tab}
          onTabChange={(next) => navigate({ to: '/friends', search: { tab: next }, replace: true })}
        />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/friends')({
  validateSearch: (search: Record<string, unknown>): FriendsSearch => ({
    tab: parseFriendsPageTab(search.tab),
  }),
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Friends | Moltology',
        description: FRIENDS_PAGE_DESCRIPTION,
      }),
    ],
  }),
  component: FriendsRoute,
  pendingComponent: HudWorkspaceGhost,
})
