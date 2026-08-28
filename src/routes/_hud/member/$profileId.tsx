import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { MemberProfilePage } from '@/components/hud/member/MemberProfilePage'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function MemberProfileRoute() {
  const { profileId } = Route.useParams()
  return (
    <GuestLockGuard
      featureName="Member Profiles"
      message="Member profiles, loadouts, and friend requests require a signed-in account."
    >
      <MemberProfilePage profileId={profileId} />
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/member/$profileId')({
  component: MemberProfileRoute,
  pendingComponent: HudWorkspaceGhost,
})
