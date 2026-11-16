import React from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Trophy } from 'lucide-react'
import { LEADERBOARD_RAIL_SIZE } from '@/lib/leaderboard'
import { useAuthSession } from '@/hooks/useAuthSession'
import { LeaderboardRows, LeaderboardRowsPending, useLeaderboard } from './LeaderboardList'
import { cn } from '@/lib/utils'

/** Forum rail: this week's top 5 by XP, with a link to the full board. */
export function LeaderboardRailCard({ className }: { className?: string }) {
  const session = useAuthSession()
  const viewerId = session.isPending ? null : session.userId
  const board = useLeaderboard('week', viewerId, LEADERBOARD_RAIL_SIZE)

  return (
    <section
      aria-labelledby="leaderboard-rail-heading"
      className={cn('rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 space-y-2.5', className)}
      data-testid="leaderboard-rail"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="leaderboard-rail-heading"
          className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted flex items-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
          Top members this week
        </h2>
        <Link
          to="/forum/leaderboard"
          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-ink-muted hover:text-cyan-glow rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          See all
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
      {board.data ? (
        <LeaderboardRows entries={board.data.entries} viewer={board.data.viewer} viewerId={viewerId} minRows={3} size="sm" />
      ) : board.isError ? (
        <p className="text-xs text-ink-muted">The leaderboard could not load.</p>
      ) : (
        <LeaderboardRowsPending count={3} size="sm" />
      )}
    </section>
  )
}
