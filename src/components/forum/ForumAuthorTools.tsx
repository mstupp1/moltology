import React from 'react'
import { LocalTime } from '@/components/ui/LocalTime'
import { Pencil, Undo2 } from 'lucide-react'
import { FORUM_WITHDRAWN_BODY, isForumEntryRevised, relativeTime } from '@/lib/forum-utils'

export function ForumWithdrawnBody({
  className,
  testId = 'forum-withdrawn-body',
}: {
  className?: string
  testId?: string
}) {
  return (
    <p className={className} data-testid={testId}>
      {FORUM_WITHDRAWN_BODY}
    </p>
  )
}

export function ForumRevisedMark({
  createdAt,
  updatedAt,
  deletedAt,
}: {
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
}) {
  if (!isForumEntryRevised({ createdAt, updatedAt, deletedAt }) || !updatedAt) return null
  return (
    <span className="text-2xs text-ink-muted" data-testid="forum-revised-mark">
      Edited <LocalTime value={updatedAt} format={relativeTime} />
    </span>
  )
}

export function ForumAuthorTools({
  confirmingWithdraw,
  busy,
  onRevise,
  onStartWithdraw,
  onCancelWithdraw,
  onConfirmWithdraw,
}: {
  confirmingWithdraw: boolean
  busy?: boolean
  onRevise: () => void
  onStartWithdraw: () => void
  onCancelWithdraw: () => void
  onConfirmWithdraw: () => void
}) {
  if (confirmingWithdraw) {
    return (
      <div
        className="flex flex-wrap items-center justify-end gap-2 text-2xs"
        data-testid="forum-withdraw-confirm"
      >
        <span className="text-ink-muted">
          Withdraw this post? Its text will be hidden. Replies stay.
        </span>
        <button
          type="button"
          onClick={onCancelWithdraw}
          disabled={busy}
          className="px-2 py-1 font-semibold rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          Keep it
        </button>
        <button
          type="button"
          onClick={onConfirmWithdraw}
          disabled={busy}
          className="px-2 py-1 font-semibold rounded-control text-crimson-text hover:bg-crimson-soft transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          data-testid="forum-withdraw-confirm-btn"
        >
          {busy ? 'Withdrawing...' : 'Withdraw'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2" data-testid="forum-author-tools">
      <button
        type="button"
        onClick={onRevise}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2 min-h-8 text-2xs font-semibold rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        data-testid="forum-revise"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
      <button
        type="button"
        onClick={onStartWithdraw}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2 min-h-8 text-2xs font-semibold rounded-control text-ink-muted hover:text-crimson-text hover:bg-crimson-soft transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        data-testid="forum-withdraw"
      >
        <Undo2 className="w-3 h-3" />
        Withdraw
      </button>
    </div>
  )
}
