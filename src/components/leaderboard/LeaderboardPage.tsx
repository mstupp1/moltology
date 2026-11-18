import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { ForumBandCrumbs } from '@/components/forum/ForumBandCrumbs'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { useAuthSession } from '@/hooks/useAuthSession'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import {
  CREST_TIERS,
  formatWeekRange,
  formatXp,
  type CrestRank,
  type LeaderboardWindow,
} from '@/lib/leaderboard'
import type { LeaderboardEntry, LeaderboardView } from '@/lib/server/api'
import { LoadMoreButton } from '@/components/ui/LoadMoreButton'
import { LeaderboardRows, LeaderboardRowsPending, useLeaderboardPages } from './LeaderboardList'
import { CrestMedal } from './RankCrest'
import { cn } from '@/lib/utils'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
const CARD = 'rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 lg:p-5'
const HEADING = 'font-grotesk text-sm font-semibold text-ink'

const WINDOW_LABELS: Record<LeaderboardWindow, string> = { week: 'This week', all: 'All time' }

function WindowTabs({ value, onChange }: { value: LeaderboardWindow; onChange: (next: LeaderboardWindow) => void }) {
  return (
    <div role="group" aria-label="Leaderboard period" className="inline-flex items-center gap-1 rounded-control bg-abyss/40 p-0.5">
      {(['week', 'all'] as const).map((key) => {
        const lit = key === value
        return (
          <button
            key={key}
            type="button"
            aria-pressed={lit}
            onClick={() => onChange(key)}
            className={cn(
              'min-h-8 px-3 rounded-control text-xs font-semibold transition-colors',
              lit ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface-2',
              FOCUS,
            )}
          >
            {WINDOW_LABELS[key]}
          </button>
        )
      })}
    </div>
  )
}

/** Last week's top 3, gold in the middle on wider screens. */
function CrestPodium({ view }: { view: LeaderboardView | undefined }) {
  const weekLabel = view ? formatWeekRange(view.crestWeekStart) : null
  const byRank = new Map<CrestRank, LeaderboardEntry>()
  for (const entry of view?.podium ?? []) byRank.set(entry.rank as CrestRank, entry)
  const order: CrestRank[] = [2, 1, 3]

  return (
    <section aria-labelledby="crest-podium-heading" className={cn(CARD, 'space-y-3')} data-testid="leaderboard-podium">
      <div className="space-y-0.5">
        <h2 id="crest-podium-heading" className={HEADING}>
          Last week's top 3
        </h2>
        {weekLabel ? <p className="text-xs text-ink-muted">{weekLabel}</p> : null}
      </div>
      <ol className="grid grid-cols-3 gap-2 items-end">
        {order.map((rank) => {
          const entry = byRank.get(rank)
          const tier = CREST_TIERS[rank]
          return (
            <li key={rank} className={cn('min-w-0', rank === 1 ? '' : 'pt-3')}>
              {entry ? (
                <Link
                  to="/member/$profileId"
                  params={{ profileId: resolveMemberPublicParam({ id: entry.userId, handle: entry.handle }) }}
                  className={cn(
                    'group flex flex-col items-center gap-1.5 text-center rounded-control px-1 py-2 hover:bg-surface-2 transition-colors',
                    FOCUS,
                  )}
                >
                  <span className="rounded-full p-0.5" style={{ boxShadow: `0 0 0 2px ${tier.ring}` }}>
                    <ForumAvatar
                      authorName={entry.name}
                      authorHandle={entry.handle}
                      userId={entry.userId}
                      avatarConfig={entry.avatarConfig}
                      size={rank === 1 ? 'xl' : 'lg'}
                      alt=""
                    />
                  </span>
                  <span className="inline-flex items-center gap-1 text-2xs font-semibold" style={{ color: tier.color }}>
                    <CrestMedal rank={rank} />#{rank}
                  </span>
                  <span className="w-full text-xs font-semibold text-ink truncate group-hover:text-cyan-glow transition-colors">{entry.name}</span>
                  <span className="text-2xs text-ink-muted tabular-nums">{formatXp(entry.xp)}</span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center px-1 py-2">
                  <span
                    className={cn('rounded-full border border-dashed border-line-subtle bg-surface-2', rank === 1 ? 'w-14 h-14' : 'w-11 h-11 sm:w-12 sm:h-12')}
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-center gap-1 text-2xs font-semibold" style={{ color: tier.color }}>
                    <CrestMedal rank={rank} />#{rank}
                  </span>
                  <span className="text-xs text-ink-muted">{view ? 'Open' : ' '}</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const STAGE_FILTERS: { value: number | null; label: string }[] = [
  { value: null, label: 'All stages' },
  { value: 1, label: 'Stage 1' },
  { value: 2, label: 'Stage 2' },
  { value: 3, label: 'Stage 3' },
  { value: 4, label: 'Stage 4' },
]

function StageFilter({ value, onChange }: { value: number | null; onChange: (next: number | null) => void }) {
  return (
    <label className="relative shrink-0">
      <span className="sr-only">Filter by stage</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        data-testid="leaderboard-stage-filter"
        className="min-h-8 rounded-control border border-line bg-surface-2 px-2.5 text-xs font-semibold text-ink outline-hidden hover:border-line-hover focus:border-cyan-glow"
      >
        {STAGE_FILTERS.map((f) => (
          <option key={f.label} value={f.value ?? ''} className="bg-surface-2 text-ink">
            {f.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function LeaderboardPage() {
  const session = useAuthSession()
  const viewerId = session.isPending ? null : session.userId
  const [period, setPeriod] = useState<LeaderboardWindow>('week')
  const [stage, setStage] = useState<number | null>(null)
  const board = useLeaderboardPages(period, viewerId, stage)
  // Last week's podium comes with the first page of the unfiltered weekly board.
  const podiumBoard = useLeaderboardPages('week', viewerId, null)
  const pages = board.data?.pages ?? []
  const first = pages[0]
  const last = pages[pages.length - 1]
  const entries = pages.flatMap((p) => p.entries)
  const podiumView = podiumBoard.data?.pages[0]

  const listLabel = period === 'week' ? (first ? `This week · ${formatWeekRange(first.weekStart)}` : 'This week') : 'All time'
  const empty = first && entries.length === 0

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans relative pb-8" data-testid="leaderboard-page">
      <div>
        <ForumBandCrumbs page="Leaderboard" />
        <HudTitlePanel
          treatment="band"
          joined
          title="Leaderboard"
          toolbar={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <WindowTabs value={period} onChange={setPeriod} />
              <StageFilter value={stage} onChange={setStage} />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">
        <section aria-labelledby="leaderboard-list-heading" className={cn(CARD, 'lg:col-span-8 space-y-3 min-w-0')}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="leaderboard-list-heading" className={HEADING}>
              {listLabel}
            </h2>
            {first ? (
              <span className="text-2xs text-ink-muted tabular-nums">
                {first.total} {first.total === 1 ? 'member' : 'members'}
                {period === 'week' ? ' · resets Monday 00:00 UTC' : ''}
              </span>
            ) : null}
          </div>
          {first ? (
            <>
              {empty ? (
                <p className="text-xs text-ink-muted">{stage ? `No Stage ${stage} members here yet.` : 'No XP earned yet.'}</p>
              ) : null}
              <LeaderboardRows
                entries={entries}
                viewer={last?.viewer ?? null}
                viewerId={viewerId}
                minRows={stage ? 0 : period === 'week' ? 5 : 3}
              />
              {board.hasNextPage ? (
                <LoadMoreButton
                  label="Show more"
                  loading={board.isFetchingNextPage}
                  testId="leaderboard-load-more"
                  onClick={() => void board.fetchNextPage()}
                />
              ) : null}
            </>
          ) : board.isError ? (
            <p className="text-sm text-ink-muted">The leaderboard could not load. Try again in a moment.</p>
          ) : (
            <LeaderboardRowsPending count={5} />
          )}
        </section>

        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <CrestPodium view={podiumView} />
        </div>
      </div>
    </div>
  )
}
