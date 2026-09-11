import React, { useEffect, useMemo, useState } from 'react'
import { Activity, ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getActivityFeedFn } from '@/lib/server/api'
import {
  ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
  ACTIVITY_STREAM_EMPTY_COPY,
  ACTIVITY_STREAM_SUBTITLE,
  kindsForActivityFilter,
  type ActivityEventView,
} from '@/lib/activity-events'
import { ActivityFeedGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { ActivityFeedItem } from '@/components/hud/ActivityFeedItem'

const HUB_STREAM_LIMIT = 5

function PulseChip({ label, count }: { label: string; count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-[#3a4a49] text-[#839493] chamfer-corner bg-[#070b0b]/60">
      {label}
      <span className="tabular-nums text-[#00ffff]">{count}</span>
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
    <div
      className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between"
      data-testid="activity-stream-panel"
    >
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#3a4a49] pb-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate({ to: '/stream' })}
            className="text-left min-w-0 hover:opacity-90"
          >
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00ffff]" />
              ACTIVITY STREAM
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">{ACTIVITY_STREAM_SUBTITLE}</p>
          </button>
        </div>

        <HudGhostWidget isLoading={isLoading} skeleton={<ActivityFeedGhost />}>
          {events.length === 0 ? (
            <div className="p-6 text-center space-y-1.5">
              <p className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wide uppercase">
                {ACTIVITY_STREAM_EMPTY_COPY.title}
              </p>
              <p className="text-xs text-[#839493] leading-relaxed">{ACTIVITY_STREAM_EMPTY_COPY.body}</p>
            </div>
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
      </div>

      <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
        <span className="text-[#839493] text-[10px]">OPEN THE CIRCLE FEED</span>
        <button
          type="button"
          onClick={() => navigate({ to: '/stream' })}
          className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
        >
          <span>OPEN STREAM</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
