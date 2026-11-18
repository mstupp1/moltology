import React from 'react'
import { Medal, Trophy } from 'lucide-react'
import { getRankHonorsFn, type RankHonors } from '@/lib/server/api'
import { useAppQuery } from '@/lib/query/account'
import { FRESH, contentKeys } from '@/lib/query/content'
import { CREST_TIERS, crestTitle, recordLabel, type CrestRank, type CrestRecord } from '@/lib/leaderboard'
import { cn } from '@/lib/utils'

/** Last week's top 3 and everyone's record: one small shared read for every badge on screen. */
export function useRankHonors() {
  return useAppQuery<RankHonors>({
    queryKey: contentKeys.rankHonors,
    queryFn: async () => (await getRankHonorsFn()) as RankHonors,
    staleTime: FRESH.honors,
    refetchOnWindowFocus: false,
  })
}

export function useCrestFor(userId: string | null | undefined): { rank: CrestRank | null; record: CrestRecord | null } {
  const honors = useRankHonors()
  if (!userId || !honors.data) return { rank: null, record: null }
  const holder = honors.data.holders.find((h) => h.userId === userId)
  return { rank: holder?.rank ?? null, record: honors.data.records[userId] ?? null }
}

/** The medal itself, tinted gold, silver or bronze. */
export function CrestMedal({ rank, className }: { rank: CrestRank; className?: string }) {
  const tier = CREST_TIERS[rank]
  return <Medal className={cn('w-3.5 h-3.5 shrink-0', className)} style={{ color: tier.color }} aria-hidden="true" />
}

/**
 * A member's crest beside their name: shown only while they hold one (top 3 last week).
 * `chip` adds the "#1 last week" words for roomy places such as the profile and account menu.
 */
export function RankCrest({
  userId,
  rank: rankProp,
  variant = 'icon',
  className,
}: {
  userId?: string | null
  /** Known rank (leaderboard rows); skips the lookup. */
  rank?: CrestRank | null
  variant?: 'icon' | 'chip'
  className?: string
}) {
  const looked = useCrestFor(rankProp === undefined ? userId : null)
  const rank = rankProp === undefined ? looked.rank : rankProp
  if (!rank) return null
  const tier = CREST_TIERS[rank]
  const title = crestTitle(rank)

  if (variant === 'chip') {
    return (
      <span
        data-testid="rank-crest"
        data-rank={rank}
        className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold rounded-chip border shrink-0', className)}
        style={{ color: tier.color, borderColor: tier.ring, backgroundColor: tier.soft }}
      >
        <CrestMedal rank={rank} />
        {title}
      </span>
    )
  }

  return (
    <span
      data-testid="rank-crest"
      data-rank={rank}
      title={`${title} on the leaderboard`}
      className={cn('inline-flex items-center justify-center shrink-0', className)}
    >
      <CrestMedal rank={rank} />
      <span className="sr-only">{title} on the leaderboard</span>
    </span>
  )
}

/** Lasting record on a profile: "Top 3 · 4 weeks · 2× #1". Hidden until a member has placed. */
export function RankRecordChip({ userId, className }: { userId: string | null | undefined; className?: string }) {
  const { record } = useCrestFor(userId)
  const label = recordLabel(record)
  if (!label) return null
  return (
    <span
      data-testid="rank-record"
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold rounded-chip border border-line-subtle bg-surface-2 text-ink-body shrink-0',
        className,
      )}
      title="Weeks this member finished in the leaderboard's top 3"
    >
      <Trophy className="w-3 h-3 text-ink-muted" aria-hidden="true" />
      {label}
    </span>
  )
}
