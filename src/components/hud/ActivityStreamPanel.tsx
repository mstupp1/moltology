import React, { useEffect, useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getActivityFeedFn } from '@/lib/server/api'
import {
  ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
  kindsForActivityFilter,
  type ActivityEventView,
} from '@/lib/activity-events'
import { ActivityFeedGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { ActivityFeedItem } from '@/components/hud/ActivityFeedItem'
import { DashboardEmptyRow, DashboardPanel } from '@/components/hud/dashboard/DashboardPanel'

const HUB_STREAM_LIMIT = 5

/** Shorter than the stream page copy, and distinct from the Connections empty state beside it. */
export const ACTIVITY_HUB_SUBTITLE = 'Pulses from the members you keep close.'
export const ACTIVITY_HUB_EMPTY_COPY = {
  title: 'No pulses yet',
  body: 'Liturgies, streaks and posts from your circle show up here.',
} as const

function PulseChip({ label, count }: { label: string; count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] border border-line-subtle text-ink-muted rounded-chip bg-surface-1">
      {label}
      <span className="tabular-nums text-cyan-glow">{count}</span>
    </span>
  )
}

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

  const pulse = useMemo(() => {
    const liturgies = kindsForActivityFilter('liturgies') ?? []
    const streaks = kindsForActivityFilter('streaks') ?? []
    const stages = kindsForActivityFilter('stages') ?? []
    const community = kindsForActivityFilter('community') ?? []
    return {
      liturgies: events.filter((event) => liturgies.includes(event.kind)).length,
      streaks: events.filter((event) => streaks.includes(event.kind)).length,
      stages: events.filter((event) => stages.includes(event.kind)).length,
      community: events.filter(
        (event) => community.includes(event.kind) && event.kind !== ACTIVITY_EVENT_KIND_ORACLE_MILESTONE
      ).length,
      oracle: events.filter((event) => event.kind === ACTIVITY_EVENT_KIND_ORACLE_MILESTONE).length,
    }
  }, [events])

  return (
    <DashboardPanel
      icon={<Activity />}
      title="Activity stream"
      subtitle={ACTIVITY_HUB_SUBTITLE}
      action={{ label: 'Open stream', onClick: () => navigate({ to: '/stream' }) }}
      className="h-full"
      data-testid="activity-stream-panel"
    >
      <HudGhostWidget isLoading={isLoading} skeleton={<ActivityFeedGhost />}>
        {events.length === 0 ? (
          <DashboardEmptyRow title={ACTIVITY_HUB_EMPTY_COPY.title} body={ACTIVITY_HUB_EMPTY_COPY.body} />
        ) : (
          <div className="space-y-2.5 font-sans">
            {(pulse.liturgies > 0 ||
              pulse.streaks > 0 ||
              pulse.stages > 0 ||
              pulse.community > 0 ||
              pulse.oracle > 0) && (
              <div className="flex flex-wrap gap-1.5">
                <PulseChip label="Liturgies" count={pulse.liturgies} />
                <PulseChip label="Streaks" count={pulse.streaks} />
                <PulseChip label="Stages" count={pulse.stages} />
                <PulseChip label="Community" count={pulse.community} />
                <PulseChip label="Oracle" count={pulse.oracle} />
              </div>
            )}
            <div className="space-y-2">
              {events.slice(0, HUB_STREAM_LIMIT).map((event) => (
                <ActivityFeedItem key={event.id} event={event} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </HudGhostWidget>
    </DashboardPanel>
  )
}
