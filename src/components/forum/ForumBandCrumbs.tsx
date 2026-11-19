import React from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { HudTitleBandTop } from '@/components/hud/HudTitlePanel'
import { cn } from '@/lib/utils'

const CRUMB =
  'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 text-2xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow'

/**
 * Top row of the forum's header band: Forum › Board, in the same quiet style as the
 * section tabs elsewhere. The board is full ink when it is the page itself.
 */
export function ForumBandCrumbs({
  board,
  current,
  page,
}: {
  board?: { slug: string; name: string; color?: string | null } | null
  /** The board page itself, so its crumb is the current page rather than a link back. */
  current?: boolean
  /** A forum page that is not a board (Leaderboard): shown as the current crumb. */
  page?: string
}) {
  return (
    <HudTitleBandTop>
      <nav aria-label="Forum" className="-ml-2.5 min-w-0">
        <ol className="flex min-w-0 items-center">
          <li className="shrink-0">
            <Link to="/forum" className={cn(CRUMB, 'font-semibold text-ink-muted hover:text-ink')} data-testid="forum-crumb-forum">
              Forum
            </Link>
          </li>
          {board ? (
            <li className="flex min-w-0 items-center">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted/60" aria-hidden="true" />
              {current ? (
                <span aria-current="page" className={cn(CRUMB, 'min-w-0 font-semibold text-ink')}>
                  <BoardDot color={board.color} />
                  <span className="truncate">{board.name}</span>
                </span>
              ) : (
                <Link
                  to="/forum/$categorySlug"
                  params={{ categorySlug: board.slug }}
                  className={cn(CRUMB, 'min-w-0 font-semibold text-ink-muted hover:text-ink')}
                  data-testid="forum-crumb-board"
                >
                  <BoardDot color={board.color} />
                  <span className="truncate">{board.name}</span>
                </Link>
              )}
            </li>
          ) : null}
          {page ? (
            <li className="flex min-w-0 items-center">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted/60" aria-hidden="true" />
              <span aria-current="page" className={cn(CRUMB, 'min-w-0 font-semibold text-ink')}>
                <span className="truncate">{page}</span>
              </span>
            </li>
          ) : null}
        </ol>
      </nav>
    </HudTitleBandTop>
  )
}

export function BoardDot({ color, className }: { color?: string | null; className?: string }) {
  return (
    <span
      className={cn('h-2 w-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color || '#00c3ff' }}
      aria-hidden="true"
    />
  )
}
