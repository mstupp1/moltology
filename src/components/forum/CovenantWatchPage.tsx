import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { listForumReportsFn, type ForumReportWatchEntry } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { useAuthSession } from '@/hooks/useAuthSession'
import { FORUM_REPORT_COPY } from '@/lib/forum-reports'
import { relativeTime } from '@/lib/forum-utils'
import { forumPostAnchorId } from '@/lib/forum-mentions'

export function CovenantWatchPage() {
  const session = useAuthSession()
  const [reports, setReports] = useState<ForumReportWatchEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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
  }, [session.userId, session.isPending])

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative" data-testid="covenant-watch">
      <HudTitlePanel
        accent="cyan"
        eyebrow="Soft-Shell Covenant"
        title="Covenant Watch"
        description="Open flags from the benthic community. Review quietly. Nothing is shown on the public thread."
      />

      <section className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
        <h2 className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00ffff]" />
          <span>Open flags</span>
        </h2>
        <p className="text-xs text-[#839493]">Newest first. Soft rows only. No auto-ban.</p>

        {error && (
          <p className="text-xs text-[#ff5540]" data-testid="covenant-watch-error">
            {error}
          </p>
        )}

        {error ? null : reports === null ? (
          <p className="text-xs text-[#839493]">Gathering the ledger.</p>
        ) : reports.length === 0 ? (
          <p className="text-xs text-[#839493]" data-testid="covenant-watch-empty">
            {FORUM_REPORT_COPY.watchEmpty}
          </p>
        ) : (
          <ul className="space-y-2.5" data-testid="covenant-watch-list">
            {reports.map((row) => {
              return (
                <li
                  key={row.id}
                  className="chitin-card-inset p-3 border border-[#3a4a49] chamfer-corner space-y-1.5"
                  data-testid="covenant-watch-row"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#dfe3e3]">{row.reasonLabel}</span>
                    <span className="text-[10px] text-[#839493]">{relativeTime(row.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-[#839493]">
                    {row.targetKind === 'reply' ? 'Reply' : 'Topic'}
                    {row.topicTitle ? ` · ${row.topicTitle}` : ''}
                    {row.targetWithdrawn ? ' · withdrawn' : ''}
                  </p>
                  {row.note && <p className="text-xs text-[#dfe3e3] leading-relaxed">{row.note}</p>}
                  <p className="text-[11px] text-[#839493]">Flagged by {row.reporterName}</p>
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
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
