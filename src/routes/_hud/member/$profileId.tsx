import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { memberProfileSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { getMemberShareIdentityFn } from '@/lib/server/member-share'

const LazyMemberProfilePage = lazy(() =>
  import('@/components/hud/member/MemberProfilePage').then((m) => ({ default: m.MemberProfilePage }))
)

function MemberProfileRoute() {
  const { profileId } = Route.useParams()
  return (
    <GuestLockGuard
      featureName="Member Profiles"
      message="Member profiles, loadouts, and friend requests require a signed-in account."
    >
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyMemberProfilePage profileId={profileId} canonicalizePath />
      </Suspense>
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/member/$profileId')({
  loader: async ({ params }) => {
    try { return await getMemberShareIdentityFn({ data: { profileId: params.profileId } }) }
    catch { return null }
  },
  headers: () => xRobotsNoindexHeaders(),
  head: ({ loaderData }) => ({
    meta: [...memberProfileSeo(loaderData)],
  }),
  component: MemberProfileRoute,
  pendingComponent: HudWorkspaceGhost,
})
