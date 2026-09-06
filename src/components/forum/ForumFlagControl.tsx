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
}

export function ForumFlagControl({
  topicId,
  postId,
  authorId,
  withdrawn,
  deletedAt,
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#ffb703] hover:bg-[#ffb703]/10 rounded transition-colors"
        data-testid="forum-flag"
      >
        <Flag className="w-3.5 h-3.5" />
        <span>{FORUM_REPORT_COPY.flagAction}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          data-testid="forum-flag-dialog"
        >
          <div className="w-full max-w-md bg-[#0b0f0f] border border-[#00ffff]/50 shadow-[0_0_30px_rgba(0,255,255,0.18)] chamfer-corner overflow-hidden font-sans">
            <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
              <h2 className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
                {FORUM_REPORT_COPY.dialogTitle}
              </h2>
              <button
                type="button"
                onClick={reset}
                className="text-[#839493] hover:text-[#ff5540] p-1 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <p className="text-xs text-[#839493] leading-relaxed">{FORUM_REPORT_COPY.dialogLead}</p>

              {error && (
                <p className="text-xs text-[#ff5540]" data-testid="forum-flag-error">
                  {error}
                </p>
              )}

              <fieldset className="space-y-2" data-testid="forum-flag-reasons">
                <legend className="sr-only">Reason</legend>
                {FORUM_REPORT_REASON_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-2.5 p-2.5 border chamfer-corner cursor-pointer transition-colors ${
                      reason === option.id
                        ? 'border-[#00ffff]/60 bg-[#00ffff]/8'
                        : 'border-[#3a4a49] hover:border-[#00ffff]/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="forum-flag-reason"
                      value={option.id}
                      checked={reason === option.id}
                      onChange={() => setReason(option.id)}
                      className="mt-0.5 accent-[#00ffff]"
                    />
                    <span className="space-y-0.5">
                      <span className="block text-xs font-bold text-[#dfe3e3]">{option.label}</span>
                      <span className="block text-[11px] text-[#839493] leading-relaxed">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#839493]">
                  {FORUM_REPORT_COPY.noteLabel}
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={FORUM_REPORT_NOTE_MAX}
                  rows={3}
                  placeholder={FORUM_REPORT_COPY.notePlaceholder}
                  className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] p-2.5 text-xs text-[#dfe3e3] outline-none resize-y chamfer-corner"
                  data-testid="forum-flag-note"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#839493] hover:text-[#dfe3e3] transition-colors"
                >
                  {FORUM_REPORT_COPY.cancel}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00e6e6] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider chamfer-corner transition-all"
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
