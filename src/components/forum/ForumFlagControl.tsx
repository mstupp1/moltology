import React, { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { createForumReportFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { useForumAuth } from '@/components/forum/ForumShell'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import {
  FORUM_REPORT_COPY,
  FORUM_REPORT_NOTE_MAX,
  FORUM_REPORT_REASON_OPTIONS,
  canFlagForumTarget,
  type ForumReportReason,
} from '@/lib/forum-reports'

export interface ForumFlagControlProps {
  topicId: string
  postId?: string
  authorId?: string | null
  withdrawn?: boolean
  deletedAt?: string | null
  customTrigger?: (open: () => void) => React.ReactNode
}

export function ForumFlagControl({
  topicId,
  postId,
  authorId,
  withdrawn,
  deletedAt,
  customTrigger,
}: ForumFlagControlProps) {
  const { userId } = useForumAuth()
  const persist = useHudPersist()
  const toast = useOptionalToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ForumReportReason | ''>('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canFlagForumTarget({ viewerId: userId, authorId, withdrawn, deletedAt })) {
    return null
  }

  const reset = () => {
    setReason('')
    setNote('')
    setError(null)
    setOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      setError(FORUM_REPORT_COPY.reasonRequired)
      return
    }
    setBusy(true)
    setError(null)
    persist.begin('forum-flag')
    try {
      const token = await getAuthJWTToken()
      const receipt = await createForumReportFn({
        data: {
          topicId,
          postId,
          reason,
          note: note.trim() || null,
          userId: userId ?? undefined,
          token: token ?? undefined,
        },
      })
      toast?.toast.success(
        receipt.alreadyReported ? FORUM_REPORT_COPY.toastAlready : FORUM_REPORT_COPY.toastReceived,
      )
      reset()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : FORUM_REPORT_COPY.toastError
      setError(message)
      toast?.toast.error(message)
    } finally {
      persist.end('forum-flag')
      setBusy(false)
    }
  }

  return (
    <>
      {customTrigger ? (
        customTrigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          data-testid="forum-flag"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{FORUM_REPORT_COPY.flagAction}</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          data-testid="forum-flag-dialog"
        >
          <div className="w-full max-w-md rounded-card border border-line bg-surface-1 shadow-menu overflow-hidden font-sans">
            <div className="bg-surface-2 border-b border-line-subtle p-4 flex items-center justify-between">
              <h2 className="text-xs text-ink font-bold tracking-[0.08em] uppercase">
                {FORUM_REPORT_COPY.dialogTitle}
              </h2>
              <button
                type="button"
                onClick={reset}
                className="p-1 text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <p className="text-xs text-ink-muted leading-relaxed">{FORUM_REPORT_COPY.dialogLead}</p>

              {error && (
                <p className="text-xs text-crimson-text" data-testid="forum-flag-error">
                  {error}
                </p>
              )}

              <fieldset className="space-y-2" data-testid="forum-flag-reasons">
                <legend className="sr-only">Reason</legend>
                {FORUM_REPORT_REASON_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-2.5 p-2.5 border rounded-control cursor-pointer transition-colors ${
                      reason === option.id
                        ? 'border-cyan-glow/40 bg-cyan-soft'
                        : 'border-line hover:border-line-hover hover:bg-surface-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="forum-flag-reason"
                      value={option.id}
                      checked={reason === option.id}
                      onChange={() => setReason(option.id)}
                      className="mt-0.5 accent-cyan-glow"
                    />
                    <span className="space-y-0.5">
                      <span className="block text-xs font-bold text-ink">{option.label}</span>
                      <span className="block text-[11px] text-ink-muted leading-relaxed">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                  {FORUM_REPORT_COPY.noteLabel}
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={FORUM_REPORT_NOTE_MAX}
                  rows={3}
                  placeholder={FORUM_REPORT_COPY.notePlaceholder}
                  className="w-full bg-surface-2 border border-line focus:border-cyan-glow focus:shadow-field-focus p-2.5 text-xs text-ink outline-none resize-y rounded-control transition-[border-color,box-shadow] placeholder:text-ink-muted"
                  data-testid="forum-flag-note"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="px-3 py-1.5 rounded-control text-xs font-bold uppercase tracking-[0.08em] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  {FORUM_REPORT_COPY.cancel}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-1.5 rounded-control bg-cyan-glow hover:bg-cyan-hover disabled:opacity-50 text-abyss text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  data-testid="forum-flag-submit"
                >
                  {busy ? FORUM_REPORT_COPY.submitting : FORUM_REPORT_COPY.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
