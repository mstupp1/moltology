import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import React from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { ForumCategoryEntry } from '@/lib/server/api'
import { formatForumUnreadCount } from '@/lib/forum-visits'
import { cn } from '@/lib/utils'
import { ForumUnreadMark } from './ForumBits'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

export type ForumSortKey = 'hot' | 'latest' | 'top' | 'active'

export const FORUM_SORT_LABELS: Record<ForumSortKey, string> = {
  hot: 'Hot',
  latest: 'New',
  top: 'Top',
  active: 'Active',
}

/** Sort choice as a row of lit tiles: the current sort is the lit one. No underline marks. */
export function ForumSortTabs({
  value,
  onChange,
  options = ['hot', 'latest', 'top'],
  className,
}: {
  value: ForumSortKey
  onChange: (value: ForumSortKey) => void
  options?: ForumSortKey[]
  className?: string
}) {
  return (
    <div role="group" aria-label="Sort posts" className={cn('flex items-center gap-1 rounded-control bg-abyss/40 p-0.5', className)}>
      {options.map((key) => {
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
            {FORUM_SORT_LABELS[key]}
          </button>
        )
      })}
    </div>
  )
}

function postCount(count: number) {
  return `${count} ${count === 1 ? 'post' : 'posts'}`
}

/**
 * The board directory. `list` is the desktop rail: one row per board with its colour dot,
 * description and counts. `strip` is the phone version: swipeable tiles with a hidden scrollbar.
 */
export function ForumBoardNav({
  boards,
  variant,
  className,
}: {
  boards: ForumCategoryEntry[]
  variant: 'list' | 'strip'
  className?: string
}) {
  if (boards.length === 0) return null

  if (variant === 'strip') {
    return (
      <HorizontalScroll as="nav" aria-label="Boards" className={cn('min-w-0 overflow-x-auto no-scrollbar -mx-1 px-1', className)} data-testid="forum-board-strip">
        <ul className="flex items-stretch gap-2 w-max py-1">
          {boards.map((board) => (
            <li key={board.id} className="min-w-0">
              <Link
                to="/forum/$categorySlug"
                params={{ categorySlug: board.slug }}
                className={cn(
                  'flex flex-col gap-1 w-36 min-w-0 h-full p-3 rounded-card border border-line-subtle bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line transition-colors',
                  FOCUS,
                )}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: board.color }} aria-hidden="true" />
                  <span className="text-xs font-bold text-ink leading-snug line-clamp-2">{board.name}</span>
                </span>
                <span className="mt-auto flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted tabular-nums">
                  <span>{postCount(board.topicCount)}</span>
                  {board.unreadCount && board.unreadCount > 0 ? (
                    <ForumUnreadMark label={formatForumUnreadCount(board.unreadCount)} />
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HorizontalScroll>
    )
  }

  return (
    <nav aria-label="Boards" className={className} data-testid="forum-board-list">
      <ul className="space-y-2">
        {boards.map((board) => (
          <li key={board.id}>
            <Link
              to="/forum/$categorySlug"
              params={{ categorySlug: board.slug }}
              className={cn('group flex items-start gap-3 px-3 py-2.5 rounded-card border border-line-subtle bg-surface-1 hud-sheen hover:bg-surface-2 transition-colors', FOCUS, 'focus-visible:outline-offset-[-2px]')}
            >
              <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: board.color }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink group-hover:text-cyan-glow transition-colors truncate">{board.name}</span>
                  {board.unreadCount && board.unreadCount > 0 ? (
                    <ForumUnreadMark label={formatForumUnreadCount(board.unreadCount)} />
                  ) : null}
                </span>
                <span className="text-[11px] text-ink-muted leading-relaxed line-clamp-1">{board.description}</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-ink-muted tabular-nums shrink-0 mt-0.5">
                {postCount(board.topicCount)}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
