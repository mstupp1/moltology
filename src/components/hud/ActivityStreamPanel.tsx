import React from 'react'
import { Activity } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getActivityFeedFn } from '@/lib/server/api'
import type { ActivityEventView } from '@/lib/activity-events'
import { ActivityFeedGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { ActivityFeedItem } from '@/components/hud/ActivityFeedItem'
import { DashboardEmptyRow, DashboardPanel } from '@/components/hud/dashboard/DashboardPanel'
import { accountKeys, useAppQuery } from '@/lib/query/account'
import { FRESH } from '@/lib/query/content'

const HUB_STREAM_LIMIT = 5

/** Shorter than the stream page copy, and distinct from the Connections empty state beside it. */
export const ACTIVITY_HUB_EMPTY_COPY = {
  title: 'No pulses yet',
  body: 'Liturgies, streaks and posts from your circle show up here.',
} as const

export function ActivityStreamPanel() {
  const navigate = useNavigate()
  const session = useAuthSession()
  const userId = session.userId
  const isAuthPending = session.isPending

  const params = { scope: 'circle', filter: 'all', limit: HUB_STREAM_LIMIT } as const
  const feed = useAppQuery<ActivityEventView[]>({
    queryKey: accountKeys.activity(userId ?? '', params),
    queryFn: async () => {
      const token = await getAuthJWTToken()
      const fetched = await getActivityFeedFn({ data: { token: token ?? undefined, userId: userId!, ...params } })
      return Array.isArray(fetched?.events) ? fetched.events : []
    },
    enabled: Boolean(userId) && !isAuthPending,
    staleTime: FRESH.panel,
  })
  const events = feed.data ?? []
  // Guests have nothing to load; members wait for their first read (or its failure).
  const isLoading = isAuthPending || (Boolean(userId) && feed.isPending && !feed.isError)

  return (
    <DashboardPanel
      icon={<Activity />}
      title="Activity stream"
      action={{ label: 'See all', onClick: () => navigate({ to: '/profile', search: { tab: 'activity' } }) }}
      className="h-full"
      data-testid="activity-stream-panel"
    >
      <HudGhostWidget isLoading={isLoading} skeleton={<ActivityFeedGhost />}>
        {events.length === 0 ? (
          <DashboardEmptyRow title={ACTIVITY_HUB_EMPTY_COPY.title} body={ACTIVITY_HUB_EMPTY_COPY.body} />
        ) : (
          <ul className="rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden font-sans">
            {events.slice(0, HUB_STREAM_LIMIT).map((event) => (
              <li key={event.id}>
                <ActivityFeedItem event={event} variant="compact" />
              </li>
            ))}
          </ul>
        )}
      </HudGhostWidget>
    </DashboardPanel>
  )
}
