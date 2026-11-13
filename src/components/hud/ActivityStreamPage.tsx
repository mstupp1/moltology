import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityFeedItem } from '@/components/hud/ActivityFeedItem'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { LoadMoreButton } from '@/components/ui/LoadMoreButton'
import { cn } from '@/lib/utils'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getActivityFeedFn } from '@/lib/server/api'
import {
  ACTIVITY_FEED_FILTERS,
  ACTIVITY_FEED_SCOPES,
  emptyCopyForFeed,
  groupActivityByDay,
  type ActivityEventView,
  type ActivityFeedFilter,
  type ActivityFeedScope,
} from '@/lib/activity-events'
import {
  getCachedActivityFeed,
  isCachedActivityFeedFresh,
  setCachedActivityFeed,
} from '@/lib/activity-feed-cache'
import { FRESH } from '@/lib/query/content'

const PAGE_LIMIT = 20

/** Under a past day's heading, a clock time reads better than "yesterday" or a repeated date. */
function clockTime(iso: string): string | undefined {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return undefined
  return at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** A quiet pill switch, the same look as the Profile and Market section switches. */
function PillSwitch<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: Array<{ id: T; label: string }>
  value: T
  onChange: (id: T) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex gap-1 rounded-control bg-surface-2 p-1', className)}>
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'shrink-0 inline-flex min-h-8 items-center rounded-control px-3 text-xs font-semibold transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              active ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:bg-surface-3/60 hover:text-ink',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function FeedRowsGhost() {
  return (
    <ul className="rounded-card border border-line-subtle divide-y divide-line-subtle overflow-hidden" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 bg-surface-1 px-3 py-3 sm:px-4">
          <HudGhostSkeleton variant="neutral" preset="avatar" width={36} height={36} />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <HudGhostSkeleton variant="neutral" preset="heading" width={`${45 + ((i * 17) % 30)}%`} height={13} />
            <HudGhostSkeleton variant="neutral" preset="text" width={`${55 + ((i * 11) % 25)}%`} height={11} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** The full activity feed on the Profile page's Activity tab. */
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
      if (!isCachedActivityFeedFresh(userId, scope, filter, FRESH.panel)) void loadFeed({})
      return
    }

    setEvents([])
    setNextCursor(null)
    setIsLoading(true)
    void loadFeed({})
  }, [applyPage, filter, isAuthPending, loadFeed, scope, userId])

  const empty = emptyCopyForFeed(scope, filter)
  const showEmpty = !isLoading && events.length === 0
  const groups = groupActivityByDay(events, new Date())

  // Page in the next batch as the reader nears the end; the button stays for keyboards and old browsers.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<() => void>(() => {})
  loadMoreRef.current = () => {
    if (nextCursor && !isLoadingMore) void loadFeed({ cursor: nextCursor, append: true })
  }
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !nextCursor || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current()
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [nextCursor])

  return (
    <div className="font-sans text-ink max-w-3xl space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <PillSwitch
          items={ACTIVITY_FEED_SCOPES}
          value={scope}
          onChange={setScope}
          ariaLabel="Feed audience"
          className="w-max"
        />
        <PillSwitch
          items={ACTIVITY_FEED_FILTERS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Feed filters"
          className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:ml-auto"
        />
      </div>

      {isLoading && events.length === 0 ? (
        <FeedRowsGhost />
      ) : showEmpty ? (
        <div className="rounded-card border border-line-subtle bg-surface-1 px-4 py-10 text-center space-y-1.5">
          <p className="font-grotesk text-sm font-bold text-ink">{empty.title}</p>
          <p className="text-xs text-ink-muted leading-relaxed max-w-md mx-auto">{empty.body}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`activity-day-${group.key}`} className="space-y-1.5">
              <h2
                id={`activity-day-${group.key}`}
                className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted"
              >
                {group.label}
              </h2>
              <ul className="rounded-card border border-line-subtle divide-y divide-line-subtle overflow-hidden">
                {group.events.map((event) => (
                  <li key={event.id}>
                    <ActivityFeedItem
                      event={event}
                      variant="full"
                      timeLabel={group.label === 'Today' ? undefined : clockTime(event.occurredAt)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {nextCursor ? (
        <>
          <div ref={sentinelRef} aria-hidden="true" />
          <LoadMoreButton
            label="Show earlier"
            loading={isLoadingMore}
            onClick={() => loadMoreRef.current()}
          />
        </>
      ) : null}
    </div>
  )
}
