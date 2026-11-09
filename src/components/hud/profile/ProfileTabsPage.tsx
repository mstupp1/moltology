import React, { Suspense, lazy } from 'react'
import { Link } from '@tanstack/react-router'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests'
import { profilePageSection, type ProfilePageSection, type ProfilePageTab } from '@/lib/connections'
import { cn } from '@/lib/utils'

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

/** Switches between the parts of your own profile, styled like the Character page's switch. */
export function ProfileSectionNav({
  current,
  requestCount = 0,
  className,
}: {
  current: ProfilePageSection
  requestCount?: number
  className?: string
}) {
  return (
    <nav aria-label="Profile sections" className={cn('flex gap-1 rounded-control bg-surface-2 p-1', className)}>
      {SECTIONS.map((section) => {
        const selected = section.id === current
        const count = section.id === 'requests' ? requestCount : 0
        return (
          <Link
            key={section.id}
            to="/profile"
            search={{ tab: section.tab }}
            replace
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-control px-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              selected ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:bg-surface-3/60 hover:text-ink',
            )}
          >
            {section.label}
            {count > 0 && (
              <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-cyan-glow text-[11px] font-bold text-abyss tabular-nums">
                <span className="sr-only">, </span>
                {count > 99 ? '99+' : count}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </Link>
        )
      })}
    </nav>
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
    <div className="space-y-3 sm:space-y-4">
      <ProfileSectionNav current={section} requestCount={requestCount} className="w-max max-w-full overflow-x-auto" />
      <Suspense fallback={<HudWorkspaceGhost />}>
        {section === 'profile' ? (
          <LazyMemberProfilePage profileId={profileId} />
        ) : (
          <div className="chitin-card rounded-card p-3 sm:p-4 md:p-5 space-y-4 font-sans text-ink">
            <HudTitlePanel treatment="integrated" title={SECTION_TITLES[section]} />
            {section === 'activity' && <LazyActivityStreamPage />}
            {section === 'friends' && <LazyConnectionsPage view="friends" tab="friends" />}
            {section === 'requests' && (
              <LazyConnectionsPage
                view="requests"
                tab={tab === 'sent' ? 'sent' : 'incoming'}
                onTabChange={(next) => onTabChange(next === 'incoming' ? 'requests' : next)}
              />
            )}
          </div>
        )}
      </Suspense>
    </div>
  )
}
