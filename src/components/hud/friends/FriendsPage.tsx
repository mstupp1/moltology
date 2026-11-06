import React from 'react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudTabs } from '@/components/ui/HudTabs'
import { ActivityStreamPage } from '@/components/hud/ActivityStreamPage'
import { ConnectionsPage } from '@/components/hud/connections/ConnectionsPage'
import { friendsPageSection, type FriendsPageSection, type FriendsPageTab } from '@/lib/connections'

const SECTIONS: Array<{ value: FriendsPageSection; label: string }> = [
  { value: 'feed', label: 'Feed' },
  { value: 'friends', label: 'Friends' },
  { value: 'requests', label: 'Requests' },
]

/** First tab value for each section, so the address always names a real tab. */
const SECTION_DEFAULT_TAB: Record<FriendsPageSection, FriendsPageTab> = {
  feed: 'feed',
  friends: 'friends',
  requests: 'incoming',
}

/**
 * One page for the people side of the app: the activity feed from your circle,
 * your friends list with member search, and friend requests.
 */
export function FriendsPage({
  tab,
  onTabChange,
}: {
  tab?: FriendsPageTab
  onTabChange: (tab: FriendsPageTab) => void
}) {
  const section = friendsPageSection(tab)

  return (
    <div className="chitin-card rounded-card p-3 sm:p-4 md:p-5 space-y-4 font-sans text-ink">
      <HudTitlePanel treatment="integrated" title="Friends" />
      <HudTabs
        label="Friends sections"
        idPrefix="friends-tab"
        value={section}
        onValueChange={(next) => onTabChange(SECTION_DEFAULT_TAB[next])}
        items={SECTIONS}
      />
      <div role="tabpanel" aria-labelledby={`friends-tab-${section}`}>
        {section === 'feed' && <ActivityStreamPage />}
        {section === 'friends' && <ConnectionsPage view="friends" tab="friends" />}
        {section === 'requests' && (
          <ConnectionsPage
            view="requests"
            tab={tab === 'sent' ? 'sent' : 'incoming'}
            onTabChange={(next) => onTabChange(next)}
          />
        )}
      </div>
    </div>
  )
}
