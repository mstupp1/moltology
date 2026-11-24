import React, { useState } from 'react'
import { Trophy } from 'lucide-react'
import { pillTabClass } from '@/components/ui/pillTab'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { getArcadeBoardFn, type ArcadeBoard as Board, type ArcadeBoardEntry } from '@/lib/server/api'
import { authToken, useAppQuery } from '@/lib/query/account'
import { ARCADE_GAMES, ARCADE_WEEKLY_GEMS, type ArcadeBoardWindow, type ArcadeGameId } from '@/lib/arcade'
import { cn } from '@/lib/utils'

export const arcadeBoardKey = (game: ArcadeGameId, window: ArcadeBoardWindow, userId: string | null) =>
  ['arcade', game, window, userId ?? 'guest'] as const

export function useArcadeBoard(game: ArcadeGameId, window: ArcadeBoardWindow, userId: string | null, enabled = true) {
  return useAppQuery<Board>({
    queryKey: arcadeBoardKey(game, window, userId),
    queryFn: async () => getArcadeBoardFn({ data: { game, window, token: await authToken() } }),
    staleTime: 60_000,
    enabled,
  })
}

function Row({ entry, you }: { entry: ArcadeBoardEntry; you: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5',
        you && 'bg-cyan-soft',
      )}
    >
      <span className={cn('w-6 text-right text-sm tabular-nums', entry.rank <= 3 ? 'text-ink' : 'text-ink-muted')}>{entry.rank}</span>
      <LobsterAvatarPortrait
        config={entry.avatarConfig}
        fallbackSeed={entry.userId}
        size={64}
        alt=""
        className="w-8 h-8 shrink-0"
        fisheyeLens={false}
      />
      <span className="flex-1 min-w-0 truncate text-sm text-ink-body">
        {entry.name}
        {you && <span className="ml-1.5 text-xs text-cyan-glow">You</span>}
      </span>
      <span className="text-sm font-medium tabular-nums text-ink">{entry.score}</span>
    </li>
  )
}

/** A game's top 10 this week or all time, with the viewer's own place when they are further down. */
export function ArcadeBoard({ game, userId, className }: { game: ArcadeGameId; userId: string | null; className?: string }) {
  const [window, setWindow] = useState<ArcadeBoardWindow>('week')
  const board = useArcadeBoard(game, window, userId)
  const data = board.data

  return (
    <section className={cn('rounded-card border border-line-subtle bg-surface-1', className)} aria-label={`${ARCADE_GAMES[game].title} leaderboard`}>
      <div className="flex items-center justify-between gap-2 p-3 sm:p-4 pb-2 sm:pb-3">
        <h2 className="flex items-center gap-2 text-md font-semibold text-ink">
          <Trophy className="w-4 h-4 text-ink-muted" aria-hidden="true" />
          Leaderboard
        </h2>
        <div className="flex gap-1" role="group" aria-label="Leaderboard period">
          {(['week', 'all'] as const).map((w) => (
            <button key={w} type="button" aria-pressed={window === w} onClick={() => setWindow(w)} className={pillTabClass(window === w)}>
              {w === 'week' ? 'This week' : 'All time'}
            </button>
          ))}
        </div>
      </div>
      {!data && board.isError ? (
        <p className="border-t border-line-subtle p-3 sm:p-4 text-sm text-ink-muted">The leaderboard could not load. Try again in a moment.</p>
      ) : !data ? (
        <ul aria-hidden="true" className="divide-y divide-line-subtle border-t border-line-subtle">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="h-12 animate-pulse bg-surface-1" />
          ))}
        </ul>
      ) : data.entries.length === 0 ? (
        <p className="border-t border-line-subtle p-3 sm:p-4 text-sm text-ink-muted">
          {window === 'week' ? 'No scores yet this week. The top spot is open.' : 'No scores yet.'}
        </p>
      ) : (
        <ol className="divide-y divide-line-subtle border-t border-line-subtle">
          {data.entries.map((entry) => (
            <Row key={entry.userId} entry={entry} you={entry.userId === userId} />
          ))}
          {data.viewer && (
            <>
              <li aria-hidden="true" className="px-4 py-1 text-xs text-ink-muted">···</li>
              <Row entry={data.viewer} you />
            </>
          )}
        </ol>
      )}
      {window === 'week' && (
        <p className="border-t border-line-subtle px-3 sm:px-4 py-2.5 text-xs text-ink-muted">
          Each Monday the week's top 10 win Chitin Gems: {ARCADE_WEEKLY_GEMS[0]} for first, {ARCADE_WEEKLY_GEMS[1]} for second,{' '}
          {ARCADE_WEEKLY_GEMS[2]} for third and {ARCADE_WEEKLY_GEMS[3]} for the rest.
        </p>
      )}
    </section>
  )
}
