import React, { useCallback, useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { ActivityFeedItem } from '@/components/hud/ActivityFeedItem'
import { HudButton } from '@/components/ui/HudButton'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getActivityFeedFn } from '@/lib/server/api'
import {
  ACTIVITY_FEED_FILTERS,
  ACTIVITY_FEED_SCOPES,
  ACTIVITY_STREAM_PAGE_DESCRIPTION,
  emptyCopyForFeed,
  type ActivityEventView,
  type ActivityFeedFilter,
  type ActivityFeedScope,
} from '@/lib/activity-events'
import {
  getCachedActivityFeed,
  setCachedActivityFeed,
} from '@/lib/activity-feed-cache'

const PAGE_LIMIT = 20

function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: Array<{ id: T; label: string }>
  value: T
  onChange: (id: T) => void
  ariaLabel: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1 p-1 border border-[#3a4a49] bg-[#050808]/80 chamfer-corner"
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`px-2.5 py-1.5 text-[11px] font-bold tracking-wide chamfer-corner transition-colors ${
              active
                ? 'bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/50'
                : 'text-[#839493] border border-transparent hover:text-[#dfe3e3] hover:border-[#3a4a49]'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function ActivityStreamPage() {
  const session = useAuthSession()
  const userId = session.userId
  const isAuthPending = session.isPending

  const [scope, setScope] = useState<ActivityFeedScope>('circle')
  const [filter, setFilter] = useState<ActivityFeedFilter>('all')
  const [events, setEvents] = useState<ActivityEventView[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const applyPage = useCallback(
    (page: { events: ActivityEventView[]; nextCursor: string | null }, append: boolean) => {
      setEvents((prev) => (append ? [...prev, ...page.events] : page.events))
      setNextCursor(page.nextCursor)
    },
    []
  )

  const loadFeed = useCallback(
    async (opts: { cursor?: string; append?: boolean }) => {
      if (!userId) {
        setEvents([])
        setNextCursor(null)
        setIsLoading(false)
        return
      }

      const append = Boolean(opts.append)
      if (append) setIsLoadingMore(true)

      try {
        const token = await getAuthJWTToken()
        const page = await getActivityFeedFn({
          data: {
            token: token ?? undefined,
            userId,
            scope,
            filter,
            limit: PAGE_LIMIT,
            cursor: opts.cursor,
          },
        })
        const next = {
          events: Array.isArray(page?.events) ? page.events : [],
          nextCursor: page?.nextCursor ?? null,
        }
        applyPage(next, append)
        if (!append) setCachedActivityFeed(userId, scope, filter, next)
      } catch {
        if (!append) {
          setEvents([])
          setNextCursor(null)
        }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [applyPage, filter, scope, userId]
  )

  useEffect(() => {
    if (isAuthPending) return
    if (!userId) {
      setEvents([])
      setIsLoading(false)
      return
    }

    const cached = getCachedActivityFeed(userId, scope, filter)
    if (cached) {
      applyPage(cached, false)
      setIsLoading(false)
      void loadFeed({})
      return
    }

    setEvents([])
    setNextCursor(null)
    setIsLoading(true)
    void loadFeed({})
  }, [applyPage, filter, isAuthPending, loadFeed, scope, userId])

  const empty = emptyCopyForFeed(scope, filter)
  const showEmpty = !isLoading && events.length === 0

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      <HudTitlePanel
        accent="cyan"
        eyebrow={
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Community
          </span>
        }
        title="Activity Stream"
        description={ACTIVITY_STREAM_PAGE_DESCRIPTION}
      />

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SegmentedControl
            items={ACTIVITY_FEED_SCOPES}
            value={scope}
            onChange={setScope}
            ariaLabel="Feed audience"
          />
          <SegmentedControl
            items={ACTIVITY_FEED_FILTERS}
            value={filter}
            onChange={setFilter}
            ariaLabel="Feed filters"
          />
        </div>

        {isLoading && events.length === 0 ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="chitin-card-inset h-24 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner"
              />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="p-8 text-center space-y-1.5">
            <p className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wide uppercase">
              {empty.title}
            </p>
            <p className="text-xs text-[#839493] leading-relaxed max-w-md mx-auto">{empty.body}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map((event) => (
              <ActivityFeedItem key={event.id} event={event} variant="full" />
            ))}
          </div>
        )}

        {nextCursor ? (
          <div className="pt-1 flex justify-center">
            <HudButton
              variant="dark"
              size="sm"
              disabled={isLoadingMore}
              onClick={() => void loadFeed({ cursor: nextCursor, append: true })}
            >
              {isLoadingMore ? 'Loading' : 'Show earlier'}
            </HudButton>
          </div>
        ) : null}
      </div>
    </div>
  )
}
