import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { ForumBandCrumbs } from '@/components/forum/ForumBandCrumbs'
import { ForumAvatar } from '@/components/forum/ForumAvatar'
import { useAuthSession } from '@/hooks/useAuthSession'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import {
  CREST_TIERS,
  LEADERBOARD_PAGE_SIZE,
  formatWeekRange,
  formatXp,
  type CrestRank,
  type LeaderboardWindow,
} from '@/lib/leaderboard'
import type { LeaderboardEntry, LeaderboardView } from '@/lib/server/api'
import { LeaderboardRows, LeaderboardRowsPending, useLeaderboard } from './LeaderboardList'
import { CrestMedal } from './RankCrest'
import { cn } from '@/lib/utils'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
const CARD = 'rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 lg:p-5'
const HEADING = 'font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase'

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
              'min-h-8 px-3 rounded-control text-xs font-bold transition-colors',
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
          Crests this week
        </h2>
        <p className="text-xs text-ink-muted">{weekLabel ? `Top 3 from ${weekLabel}` : 'Top 3 from last week'}</p>
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
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: tier.color }}>
                    <CrestMedal rank={rank} />#{rank}
                  </span>
                  <span className="w-full text-xs font-bold text-ink truncate group-hover:text-cyan-glow transition-colors">{entry.name}</span>
                  <span className="text-[11px] text-ink-muted tabular-nums">{formatXp(entry.xp)}</span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center px-1 py-2">
                  <span
                    className={cn('rounded-full border border-dashed border-line-subtle bg-surface-2', rank === 1 ? 'w-14 h-14' : 'w-11 h-11 sm:w-12 sm:h-12')}
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: tier.color }}>
                    <CrestMedal rank={rank} />#{rank}
                  </span>
                  <span className="text-xs text-ink-muted">{view ? 'Unclaimed' : ' '}</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function HowItWorks() {
  return (
    <section aria-labelledby="leaderboard-how-heading" className={cn(CARD, 'space-y-2')}>
      <h2 id="leaderboard-how-heading" className={cn(HEADING, 'flex items-center gap-2')}>
        <Info className="w-4 h-4 text-cyan-glow" aria-hidden="true" />
        How it works
      </h2>
      <ul className="space-y-1.5 text-xs text-ink-body leading-relaxed list-disc pl-4">
        <li>The weekly board counts XP earned from Monday 00:00 UTC. It starts fresh every Monday.</li>
        <li>Daily tasks are the main way to earn XP. Finishing all of them in a day adds a bonus.</li>
        <li>The top 3 each week wear a gold, silver or bronze crest for the following week, beside their name in the forum and on their profile.</li>
        <li>Every top 3 finish is kept on your profile.</li>
      </ul>
    </section>
  )
}

export function LeaderboardPage() {
  const session = useAuthSession()
  const viewerId = session.isPending ? null : session.userId
  const [period, setPeriod] = useState<LeaderboardWindow>('week')
  const board = useLeaderboard(period, viewerId, LEADERBOARD_PAGE_SIZE)
  // The crest podium comes with either list; keep showing it while the other tab loads.
  const weekBoard = useLeaderboard('week', viewerId, LEADERBOARD_PAGE_SIZE)
  const podiumView = board.data ?? weekBoard.data

  const listLabel =
    period === 'week'
      ? board.data
        ? `This week · ${formatWeekRange(board.data.weekStart)}`
        : 'This week'
      : 'All time'
  const empty = board.data && board.data.entries.length === 0

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans relative pb-8" data-testid="leaderboard-page">
      <div>
        <ForumBandCrumbs page="Leaderboard" />
        <HudTitlePanel
          treatment="band"
          joined
          title="Leaderboard"
          description="Members ranked by the XP they earn. The weekly top 3 wear a crest for the next week."
          toolbar={<WindowTabs value={period} onChange={setPeriod} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">
        <section aria-labelledby="leaderboard-list-heading" className={cn(CARD, 'lg:col-span-8 space-y-3 min-w-0')}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="leaderboard-list-heading" className={HEADING}>
              {listLabel}
            </h2>
            {board.data && period === 'week' && !empty ? (
              <span className="text-[11px] text-ink-muted">Resets Monday 00:00 UTC</span>
            ) : null}
          </div>
          {board.data ? (
            <>
              {empty ? (
                <p className="text-xs text-ink-muted">
                  {period === 'week'
                    ? 'Nobody has earned XP yet this week. Finish a daily task and the top spot is yours.'
                    : 'Nobody has earned XP yet.'}
                </p>
              ) : null}
              <LeaderboardRows
                view={board.data}
                viewerId={viewerId}
                minRows={period === 'week' ? 5 : 3}
                firstHint={period === 'week' ? 'Open spot. Claim it with a daily task' : 'Open spot'}
              />
            </>
          ) : board.isError ? (
            <p className="text-sm text-ink-muted">The leaderboard could not load. Try again in a moment.</p>
          ) : (
            <LeaderboardRowsPending count={5} />
          )}
        </section>

        <div className="lg:col-span-4 space-y-3 sm:space-y-4 lg:sticky lg:top-4">
          <CrestPodium view={podiumView} />
          <div className="hidden lg:block">
            <HowItWorks />
          </div>
        </div>

        <div className="lg:hidden">
          <HowItWorks />
        </div>
      </div>
    </div>
  )
}
