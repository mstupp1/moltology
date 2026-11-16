import React from 'react'
import { Link } from '@tanstack/react-router'
import { getLeaderboardFn, type LeaderboardEntry, type LeaderboardView } from '@/lib/server/api'
import { useAppQuery } from '@/lib/query/account'
import { FRESH, contentKeys } from '@/lib/query/content'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { CREST_TIERS, formatXp, isCrestRank, type LeaderboardWindow } from '@/lib/leaderboard'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { StageBadge } from '@/components/forum/ForumBits'
import { RankCrest } from './RankCrest'
import { cn } from '@/lib/utils'

export function useLeaderboard(period: LeaderboardWindow, viewerId: string | null | undefined, limit: number) {
  return useAppQuery<LeaderboardView>({
    queryKey: contentKeys.leaderboard(period, viewerId, limit),
    queryFn: async () =>
      (await getLeaderboardFn({ data: { window: period, viewerId: viewerId ?? undefined, limit } })) as LeaderboardView,
    staleTime: FRESH.forum,
    refetchOnWindowFocus: false,
  })
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** Rank number; the top 3 of the current list are tinted like the crests they are playing for. */
function RankNumber({ rank, size }: { rank: number; size: 'sm' | 'md' }) {
  const tier = isCrestRank(rank) ? CREST_TIERS[rank] : null
  return (
    <span
      className={cn(
        'shrink-0 inline-flex items-center justify-center rounded-full font-grotesk font-bold tabular-nums',
        size === 'md' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs',
        tier ? 'border' : 'text-ink-muted',
      )}
      style={tier ? { color: tier.color, borderColor: tier.ring, backgroundColor: tier.soft } : undefined}
    >
      {rank}
    </span>
  )
}

export function LeaderboardRow({
  entry,
  isViewer,
  size = 'md',
}: {
  entry: LeaderboardEntry
  isViewer?: boolean
  size?: 'sm' | 'md'
}) {
  return (
    <Link
      to="/member/$profileId"
      params={{ profileId: resolveMemberPublicParam({ id: entry.userId, handle: entry.handle }) }}
      data-testid="leaderboard-row"
      aria-current={isViewer ? 'true' : undefined}
      className={cn(
        'group flex items-center gap-2.5 sm:gap-3 rounded-control transition-colors',
        size === 'md' ? 'px-2.5 py-2 sm:px-3 sm:py-2.5' : 'px-2 py-1.5',
        isViewer ? 'bg-surface-3 shadow-nav-current' : 'hover:bg-surface-2',
        FOCUS,
      )}
    >
      <RankNumber rank={entry.rank} size={size} />
      <ForumAvatar
        authorName={entry.name}
        authorHandle={entry.handle}
        userId={entry.userId}
        avatarConfig={entry.avatarConfig}
        size={size === 'md' ? 'md' : 'sm'}
        alt=""
      />
      <span className="min-w-0 flex-1 flex items-center gap-1.5">
        <span className={cn('font-bold text-ink truncate group-hover:text-cyan-glow transition-colors', size === 'md' ? 'text-sm' : 'text-xs')}>
          {entry.name}
        </span>
        <RankCrest rank={entry.crest} />
        {isViewer ? <span className="text-[11px] text-ink-muted shrink-0">You</span> : null}
        {size === 'md' ? (
          <span className="hidden sm:inline-flex shrink-0">
            <StageBadge stage={entry.stage} />
          </span>
        ) : null}
      </span>
      <span className={cn('shrink-0 font-grotesk font-bold tabular-nums text-ink', size === 'md' ? 'text-sm' : 'text-xs')}>
        {formatXp(entry.xp)}
      </span>
    </Link>
  )
}

/** Empty places under a short list, so a quiet week still reads as a board with room on it. */
export function OpenSpotRow({ rank, size = 'md', hint }: { rank: number; size?: 'sm' | 'md'; hint?: string }) {
  return (
    <div
      data-testid="leaderboard-open-spot"
      className={cn(
        'flex items-center gap-2.5 sm:gap-3 rounded-control border border-dashed border-line-subtle',
        size === 'md' ? 'px-2.5 py-2 sm:px-3 sm:py-2.5' : 'px-2 py-1.5',
      )}
    >
      <RankNumber rank={rank} size={size} />
      <span className={cn('shrink-0 rounded-full bg-surface-2', size === 'md' ? 'w-9 h-9' : 'w-7 h-7')} aria-hidden="true" />
      <span className={cn('min-w-0 flex-1 truncate text-ink-muted', size === 'md' ? 'text-sm' : 'text-xs')}>{hint ?? 'Open spot'}</span>
    </div>
  )
}

/** Sized stand-ins while the list loads. */
export function LeaderboardRowsPending({ count, size = 'md' }: { count: number; size?: 'sm' | 'md' }) {
  return (
    <div className="space-y-1" aria-busy="true" data-testid="leaderboard-pending">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn('rounded-control bg-surface-2/60 animate-pulse', size === 'md' ? 'h-[52px]' : 'h-10')} />
      ))}
    </div>
  )
}

/** Ranked rows plus open spots up to `minRows`; the first open spot invites the viewer. */
export function LeaderboardRows({
  view,
  viewerId,
  minRows,
  size = 'md',
  firstHint,
}: {
  view: LeaderboardView
  viewerId: string | null | undefined
  minRows: number
  size?: 'sm' | 'md'
  firstHint: string
}) {
  const open = Math.max(0, minRows - view.entries.length)
  return (
    <ol className="space-y-1" data-testid="leaderboard-rows">
      {view.entries.map((entry) => (
        <li key={entry.userId}>
          <LeaderboardRow entry={entry} isViewer={entry.userId === viewerId} size={size} />
        </li>
      ))}
      {Array.from({ length: open }, (_, i) => (
        <li key={`open-${i}`}>
          <OpenSpotRow rank={view.entries.length + i + 1} size={size} hint={i === 0 ? firstHint : undefined} />
        </li>
      ))}
      {view.viewer ? (
        <li className="pt-1 mt-1 border-t border-line-subtle">
          <LeaderboardRow entry={view.viewer} isViewer size={size} />
        </li>
      ) : null}
    </ol>
  )
}
