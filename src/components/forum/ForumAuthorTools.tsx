import React from 'react'
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
    <span className="text-[10px] text-[#839493]" data-testid="forum-revised-mark">
      Revised {relativeTime(updatedAt)}
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
        className="flex flex-wrap items-center justify-end gap-2 text-[10px]"
        data-testid="forum-withdraw-confirm"
      >
        <span className="text-[#839493]">
          Withdraw this transmission? The body will be sealed. Replies stay in the thread.
        </span>
        <button
          type="button"
          onClick={onCancelWithdraw}
          disabled={busy}
          className="px-2 py-1 font-bold uppercase tracking-wider text-[#839493] hover:text-[#dfe3e3] transition-colors disabled:opacity-50"
        >
          Keep it
        </button>
        <button
          type="button"
          onClick={onConfirmWithdraw}
          disabled={busy}
          className="px-2 py-1 font-bold uppercase tracking-wider text-[#ff5540] hover:text-[#ff8877] transition-colors disabled:opacity-50"
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
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#00ffff] transition-colors disabled:opacity-50"
        data-testid="forum-revise"
      >
        <Pencil className="w-3 h-3" />
        Revise
      </button>
      <button
        type="button"
        onClick={onStartWithdraw}
        disabled={busy}
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#ff5540] transition-colors disabled:opacity-50"
        data-testid="forum-withdraw"
      >
        <Undo2 className="w-3 h-3" />
        Withdraw
      </button>
    </div>
  )
}
