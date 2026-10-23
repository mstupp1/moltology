import React, { useEffect, useState } from 'react'
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

  const [events, setEvents] = useState<ActivityEventView[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      if (isAuthPending) return
      if (!userId) {
        if (isMounted) {
          setEvents([])
          setIsLoading(false)
        }
        return
      }

      try {
        const token = await getAuthJWTToken()
        const fetched = await getActivityFeedFn({
          data: {
            token: token ?? undefined,
            userId,
            scope: 'circle',
            filter: 'all',
            limit: HUB_STREAM_LIMIT,
          },
        })
        if (isMounted) {
          setEvents(Array.isArray(fetched?.events) ? fetched.events : [])
        }
      } catch {
        if (isMounted) setEvents([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadEvents()
    return () => {
      isMounted = false
    }
  }, [userId, isAuthPending])

  return (
    <DashboardPanel
      icon={<Activity />}
      title="Activity stream"
      action={{ label: 'Open stream', onClick: () => navigate({ to: '/stream' }) }}
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
