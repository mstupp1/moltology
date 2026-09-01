import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { MemberProfilePage } from '@/components/hud/member/MemberProfilePage'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { useAuthSession } from '@/hooks/useAuthSession'
import { MEMBER_PROFILE_SEO, privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

function OwnProfileRoute() {
  const session = useAuthSession()
  const profileId = session.userId

  return (
    <GuestLockGuard
      featureName="Member Profiles"
      message="Member profiles, loadouts, and friend requests require a signed-in account."
    >
      {profileId ? <MemberProfilePage profileId={profileId} /> : <HudWorkspaceGhost />}
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/profile')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [...privatePageSeo(MEMBER_PROFILE_SEO)],
  }),
  component: OwnProfileRoute,
  pendingComponent: HudWorkspaceGhost,
})
