import React, { useEffect, useState } from 'react'
import { Activity, CheckCircle2, Clock } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { getAuthJWTToken } from '@/lib/jwt'
import { getActivityEventsFn } from '@/lib/server/api'
import {
  ACTIVITY_STREAM_EMPTY_COPY,
  ACTIVITY_STREAM_SUBTITLE,
  type ActivityEventView,
} from '@/lib/activity-events'
import { ActivityFeedGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'

function eventIcon() {
  return <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />
}

export function ActivityStreamPanel() {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null
  const isAuthPending = sessionRes?.isPending ?? false

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
        const fetched = await getActivityEventsFn({
          data: { token: token ?? undefined, userId },
        })
        if (isMounted) {
          setEvents(Array.isArray(fetched) ? fetched : [])
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
    <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3 shrink-0">
          <div>
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00ffff]" />
              ACTIVITY STREAM
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">{ACTIVITY_STREAM_SUBTITLE}</p>
          </div>
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
            <div className="space-y-1.5 font-sans">
              {events.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="chitin-card-inset p-2.5 flex items-start justify-between gap-2.5 hover:border-[#00ffff]/50 transition-colors group chamfer-corner"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 bg-[#070b0b] border border-[#3a4a49] shrink-0 mt-0.5">
                      {eventIcon()}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-grotesk text-xs font-bold text-[#dfe3e3] uppercase group-hover:text-[#00ffff] transition-colors truncate">
                          {act.title}
                        </span>
                        <span className="text-[9px] text-[#00ffff] bg-[#070b0b] border border-[#3a4a49] px-1.5 py-0.2 shrink-0">
                          {act.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#839493] leading-snug line-clamp-1">{act.detail}</p>
                      <div className="text-[10px] text-[#3a4a49] group-hover:text-[#839493] transition-colors flex items-center gap-1 pt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{act.occurredLabel}</span>
                      </div>
                    </div>
                  </div>

                  {act.valueBadge ? (
                    <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#070b0b] border border-[#3a4a49] px-1.5 py-0.5 shrink-0">
                      {act.valueBadge}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </HudGhostWidget>
      </div>
    </div>
  )
}
