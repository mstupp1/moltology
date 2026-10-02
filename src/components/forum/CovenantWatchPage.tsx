import React, { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { History, RotateCcw, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import {
  listForumReportsFn,
  reviewForumReportFn,
  removeForumReportTargetFn,
  restoreForumReportTargetFn,
  reopenForumReportFn,
  type ForumReportWatchEntry,
} from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { FORUM_REPORT_COPY } from '@/lib/forum-reports'
import { relativeTime } from '@/lib/forum-utils'
import { forumPostAnchorId } from '@/lib/forum-mentions'

export interface CovenantWatchPageProps {
  onChanged?: () => void
}

export function CovenantWatchPage({ onChanged }: CovenantWatchPageProps = {}) {
  const session = useAuthSession()
  const persist = useHudPersist()
  const toast = useOptionalToast()

  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open')
  const [reports, setReports] = useState<ForumReportWatchEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const loadReports = useCallback(async (tab: 'open' | 'resolved') => {
    if (!session.userId || session.isPending) return
    try {
      const token = await getAuthJWTToken()
      const rows = await listForumReportsFn({
        data: {
          userId: session.userId,
          token: token ?? undefined,
          status: tab === 'resolved' ? 'reviewed' : 'open',
        },
      })
      setReports(rows)
      setError(null)
    } catch (err: unknown) {
      setReports([])
      setError(err instanceof Error ? err.message : FORUM_REPORT_COPY.watchSealed)
    }
  }, [session.userId, session.isPending])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!session.userId || session.isPending) return
      try {
        const token = await getAuthJWTToken()
        const rows = await listForumReportsFn({
          data: {
            userId: session.userId,
            token: token ?? undefined,
            status: activeTab === 'resolved' ? 'reviewed' : 'open',
          },
        })
        if (!cancelled) {
          setReports(rows)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setReports([])
          setError(err instanceof Error ? err.message : FORUM_REPORT_COPY.watchSealed)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session.userId, session.isPending, activeTab])

  const handleMarkReviewed = async (reportId: string) => {
    if (!session.userId || actioningId) return
    setActioningId(reportId)
    persist.begin('forum-report-review')
    try {
      const token = await getAuthJWTToken()
      await reviewForumReportFn({
        data: {
          reportId,
          userId: session.userId,
          token: token ?? undefined,
        },
      })
      setReports((current) => (current ?? []).filter((row) => row.id !== reportId))
      toast?.toast.success(FORUM_REPORT_COPY.toastReviewed)
      onChanged?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : FORUM_REPORT_COPY.toastReviewError
      toast?.toast.error(message)
    } finally {
      persist.end('forum-report-review')
      setActioningId(null)
    }
  }

  const handleRemoveTarget = async (reportId: string) => {
    if (!session.userId || actioningId) return
    setActioningId(reportId)
    setConfirmRemoveId(null)
    persist.begin('forum-report-remove')
    try {
      const token = await getAuthJWTToken()
      await removeForumReportTargetFn({
        data: {
          reportId,
          userId: session.userId,
          token: token ?? undefined,
        },
      })
      if (activeTab === 'open') {
        setReports((current) => (current ?? []).filter((row) => row.id !== reportId))
      } else {
        setReports((current) =>
          (current ?? []).map((row) => (row.id === reportId ? { ...row, targetWithdrawn: true } : row)),
        )
      }
      toast?.toast.success(FORUM_REPORT_COPY.toastRemoved)
      onChanged?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : FORUM_REPORT_COPY.toastRemoveError
      toast?.toast.error(message)
    } finally {
      persist.end('forum-report-remove')
      setActioningId(null)
    }
  }

  const handleRestoreTarget = async (reportId: string) => {
    if (!session.userId || actioningId) return
    setActioningId(reportId)
    persist.begin('forum-report-restore')
    try {
      const token = await getAuthJWTToken()
      await restoreForumReportTargetFn({
        data: {
          reportId,
          restoreContent: true,
          userId: session.userId,
          token: token ?? undefined,
        },
      })
      setReports((current) =>
        (current ?? []).map((row) => (row.id === reportId ? { ...row, targetWithdrawn: false } : row)),
      )
      toast?.toast.success(FORUM_REPORT_COPY.toastRestored)
      onChanged?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : FORUM_REPORT_COPY.toastRestoreError
      toast?.toast.error(message)
    } finally {
      persist.end('forum-report-restore')
      setActioningId(null)
    }
  }

  const handleReopenReport = async (reportId: string) => {
    if (!session.userId || actioningId) return
    setActioningId(reportId)
    persist.begin('forum-report-reopen')
    try {
      const token = await getAuthJWTToken()
      await reopenForumReportFn({
        data: {
          reportId,
          userId: session.userId,
          token: token ?? undefined,
        },
      })
      setReports((current) => (current ?? []).filter((row) => row.id !== reportId))
      toast?.toast.success(FORUM_REPORT_COPY.toastReopened)
      onChanged?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : FORUM_REPORT_COPY.toastReopenError
      toast?.toast.error(message)
    } finally {
      persist.end('forum-report-reopen')
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative" data-testid="covenant-watch">
      <HudTitlePanel
        accent="cyan"
        eyebrow="Soft-Shell Covenant"
        title="Covenant Watch"
        description="Community flags from the benthic forum. Review quietly. Removing a post soft-deletes it from the board while preserving data in the ledger."
      />

      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3a4a49]/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00ffff]" />
            <h2 className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3]">
              Flag Review Ledger
            </h2>
          </div>

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Flag filter">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'open'}
              onClick={() => {
                setActiveTab('open')
                setReports(null)
                setConfirmRemoveId(null)
              }}
              data-testid="covenant-watch-tab-open"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider chamfer-corner transition-colors ${
                activeTab === 'open'
                  ? 'border border-[#00c3ff] bg-[#00c3ff]/15 text-[#dfe3e3]'
                  : 'border border-[#3a4a49] bg-[#122028] text-[#839493] hover:border-[#00c3ff]/50 hover:text-[#dfe3e3]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#ff5540]" />
              <span>{FORUM_REPORT_COPY.watchTabOpen}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resolved'}
              onClick={() => {
                setActiveTab('resolved')
                setReports(null)
                setConfirmRemoveId(null)
              }}
              data-testid="covenant-watch-tab-resolved"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider chamfer-corner transition-colors ${
                activeTab === 'resolved'
                  ? 'border border-[#00c3ff] bg-[#00c3ff]/15 text-[#dfe3e3]'
                  : 'border border-[#3a4a49] bg-[#122028] text-[#839493] hover:border-[#00c3ff]/50 hover:text-[#dfe3e3]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#00ffff]" />
              <span>{FORUM_REPORT_COPY.watchTabResolved}</span>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#ff5540]" data-testid="covenant-watch-error">
            {error}
          </p>
        )}

        {error ? null : reports === null ? (
          <p className="text-xs text-[#839493]">Gathering the ledger.</p>
        ) : reports.length === 0 ? (
          <p className="text-xs text-[#839493]" data-testid="covenant-watch-empty">
            {activeTab === 'open' ? FORUM_REPORT_COPY.watchEmpty : FORUM_REPORT_COPY.watchEmptyResolved}
          </p>
        ) : (
          <ul className="space-y-3" data-testid="covenant-watch-list">
            {reports.map((row) => {
              const isReplying = row.targetKind === 'reply'
              const removeLabel = isReplying ? FORUM_REPORT_COPY.watchRemovePost : FORUM_REPORT_COPY.watchRemoveTopic

              return (
                <li
                  key={row.id}
                  className="chitin-card-inset p-3.5 border border-[#3a4a49] chamfer-corner space-y-2.5"
                  data-testid="covenant-watch-row"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#dfe3e3]">{row.reasonLabel}</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#839493] bg-[#122028] px-1.5 py-0.5 border border-[#3a4a49] rounded">
                        {isReplying ? 'Reply' : 'Topic'}
                      </span>
                      {row.targetWithdrawn ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ff5540]/15 text-[#ff5540] border border-[#ff5540]/40">
                          Removed from forum
                        </span>
                      ) : activeTab === 'resolved' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                          Dismissed (Kept)
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-[#839493]">
                      {activeTab === 'resolved'
                        ? `Resolved ${relativeTime(row.updatedAt || row.createdAt)}`
                        : relativeTime(row.createdAt)}
                    </span>
                  </div>

                  {row.topicTitle ? (
                    <p className="text-xs text-[#839493]">
                      Thread:{' '}
                      <span className="text-[#dfe3e3] font-semibold">{row.topicTitle}</span>
                    </p>
                  ) : null}

                  {row.targetContent ? (
                    <div className="bg-[#0b161c] border-l-2 border-[#00c3ff]/50 p-2.5 my-1.5 text-xs text-[#cad5d5] line-clamp-4 select-text font-sans rounded-r">
                      <span className="text-[10px] text-[#839493] block uppercase font-mono tracking-wider mb-1">
                        Flagged transmission snippet
                      </span>
                      {row.targetContent}
                    </div>
                  ) : null}

                  <div className="text-[11px] text-[#839493] space-y-0.5">
                    <p>Flagged by {row.reporterName}</p>
                    {row.note && (
                      <p className="text-xs text-[#dfe3e3] leading-relaxed italic bg-[#122028]/60 p-2 border border-[#3a4a49]/40 rounded">
                        {row.note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#3a4a49]/40">
                    <div className="flex flex-wrap items-center gap-3">
                      {row.categorySlug && row.topicSlug && (
                        <Link
                          to="/forum/$categorySlug/$topicSlug"
                          params={{ categorySlug: row.categorySlug, topicSlug: row.topicSlug }}
                          hash={row.postId ? forumPostAnchorId(row.postId) : undefined}
                          className="text-[11px] font-bold text-[#00ffff] hover:underline"
                        >
                          Open transmission
                        </Link>
                      )}

                      {activeTab === 'open' ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkReviewed(row.id)}
                          disabled={actioningId === row.id}
                          className="text-[11px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#00ffff] disabled:opacity-50 transition-colors"
                          data-testid="covenant-watch-mark-reviewed"
                        >
                          {actioningId === row.id
                            ? FORUM_REPORT_COPY.watchMarking
                            : FORUM_REPORT_COPY.watchMarkReviewed}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleReopenReport(row.id)}
                          disabled={actioningId === row.id}
                          className="text-[11px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#00ffff] disabled:opacity-50 transition-colors"
                          data-testid="covenant-watch-reopen"
                        >
                          {actioningId === row.id
                            ? FORUM_REPORT_COPY.watchReopening
                            : FORUM_REPORT_COPY.watchReopen}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!row.targetWithdrawn ? (
                        confirmRemoveId === row.id ? (
                          <div className="inline-flex items-center gap-2 bg-[#ff5540]/10 border border-[#ff5540]/30 px-2 py-1 rounded">
                            <span className="text-[11px] text-[#ff5540] font-bold">Remove from forum?</span>
                            <button
                              type="button"
                              onClick={() => void handleRemoveTarget(row.id)}
                              disabled={actioningId === row.id}
                              className="text-[11px] font-bold uppercase tracking-wider text-[#ff5540] hover:text-white bg-[#ff5540]/25 hover:bg-[#ff5540] px-2 py-0.5 rounded transition-colors"
                              data-testid="covenant-watch-confirm-remove"
                            >
                              {actioningId === row.id ? FORUM_REPORT_COPY.watchRemoving : 'Yes, remove'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(null)}
                              className="text-[11px] font-bold uppercase tracking-wider text-[#839493] hover:text-[#dfe3e3] px-1 py-0.5"
                              data-testid="covenant-watch-cancel-remove"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(row.id)}
                            disabled={Boolean(actioningId)}
                            className="text-[11px] font-bold uppercase tracking-wider text-[#ff5540] hover:text-[#ff8070] disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                            data-testid="covenant-watch-remove-target"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{removeLabel}</span>
                          </button>
                        )
                      ) : activeTab === 'resolved' ? (
                        <button
                          type="button"
                          onClick={() => void handleRestoreTarget(row.id)}
                          disabled={actioningId === row.id}
                          className="text-[11px] font-bold uppercase tracking-wider text-[#00c3ff] hover:text-[#00ffff] disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                          data-testid="covenant-watch-restore-target"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>
                            {actioningId === row.id
                              ? FORUM_REPORT_COPY.watchRestoring
                              : FORUM_REPORT_COPY.watchRestore}
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
