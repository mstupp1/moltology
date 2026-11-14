import React, { Suspense, lazy } from 'react'
import { HudTitleBandTop, HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { BandSectionNav, type BandSection } from '@/components/hud/BandSectionNav'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests'
import { profilePageSection, type ProfilePageSection, type ProfilePageTab } from '@/lib/connections'

const LazyMemberProfilePage = lazy(() =>
  import('@/components/hud/member/MemberProfilePage').then((m) => ({ default: m.MemberProfilePage }))
)
const LazyActivityStreamPage = lazy(() =>
  import('@/components/hud/ActivityStreamPage').then((m) => ({ default: m.ActivityStreamPage }))
)
const LazyConnectionsPage = lazy(() =>
  import('@/components/hud/connections/ConnectionsPage').then((m) => ({ default: m.ConnectionsPage }))
)

/** Each section and the tab its link opens, so the address always names a real tab. */
const SECTIONS: Array<{ id: ProfilePageSection; label: string; tab: ProfilePageTab | undefined }> = [
  { id: 'profile', label: 'Profile', tab: undefined },
  { id: 'activity', label: 'Activity', tab: 'activity' },
  { id: 'friends', label: 'Friends', tab: 'friends' },
  { id: 'requests', label: 'Requests', tab: 'requests' },
]

const SECTION_TITLES: Record<Exclude<ProfilePageSection, 'profile'>, string> = {
  activity: 'Activity',
  friends: 'Friends',
  requests: 'Requests',
}

/** First row of the profile's header band: Profile, Activity, Friends, Requests. */
export function ProfileSectionNav({
  current,
  requestCount = 0,
  alone = false,
}: {
  current: ProfilePageSection
  requestCount?: number
  /** No title row follows, so this row closes the band itself. */
  alone?: boolean
}) {
  const sections: BandSection<ProfilePageSection>[] = SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    to: '/profile',
    search: { tab: section.tab },
    replace: true,
    badge: section.id === 'requests' ? requestCount : 0,
  }))
  return (
    <HudTitleBandTop className={alone ? 'border-b border-line-subtle pb-2' : undefined}>
      <BandSectionNav label="Profile sections" sections={sections} current={current} />
    </HudTitleBandTop>
  )
}

/**
 * Your own profile page: the profile itself, your full activity feed, your
 * friends with member search, and friend requests.
 */
export function ProfileTabsPage({
  profileId,
  tab,
  onTabChange,
}: {
  profileId: string
  tab?: ProfilePageTab
  onTabChange: (tab: ProfilePageTab) => void
}) {
  const section = profilePageSection(tab)
  const requestCount = usePendingFriendRequests(profileId)

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      <div>
        {/* The profile card below carries the member's name as the page heading, so that
            tab's band is the section row alone. */}
        <ProfileSectionNav current={section} requestCount={requestCount} alone={section === 'profile'} />
        {section !== 'profile' && <HudTitlePanel treatment="band" joined title={SECTION_TITLES[section]} />}
      </div>
      <Suspense fallback={<HudWorkspaceGhost />}>
        {section === 'profile' ? (
          <LazyMemberProfilePage profileId={profileId} />
        ) : section === 'activity' ? (
          <LazyActivityStreamPage />
        ) : section === 'friends' ? (
          <LazyConnectionsPage view="friends" tab="friends" />
        ) : (
          <LazyConnectionsPage
            view="requests"
            tab={tab === 'sent' ? 'sent' : 'incoming'}
            onTabChange={(next) => onTabChange(next === 'incoming' ? 'requests' : next)}
          />
        )}
      </Suspense>
    </div>
  )
}
