import React, { useState, useMemo } from 'react'
import { LocalTime } from '@/components/ui/LocalTime'
import { useNavigate, Link, useLoaderData } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  Share2,
  Terminal,
  ArrowRight,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'
import type { ChangelogEntry } from '@/lib/changelogs-data'

export function ChangelogDetailPage() {
  const entry = useLoaderData({ from: '/changelog/$slug' }) as ChangelogEntry | null
  const navigate = useNavigate()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [copied, setCopied] = useState(false)

  const relatedEntries = useMemo(() => {
    if (!entry) return []
    return INITIAL_CHANGELOGS
      .filter((c) => c.slug !== entry.slug)
      .slice(0, 3)
  }, [entry])

  if (!entry) {
    return (
      <div className="min-h-screen bg-abyss text-ink font-sans flex flex-col justify-between items-center py-20 px-4">
        <PublicHeader
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setIsAuthModalOpen(true)
          }}
        />
        <div className="text-center rounded-card hud-sheen shadow-sheen-inset border border-line-subtle p-8 sm:p-12 rounded-control max-w-lg w-full my-auto">
          <Terminal className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink">
            Update not found
          </h2>
          <p className="text-xs text-ink-muted mt-2 mb-6 font-sans">
            This update is unavailable. Browse the change log for other updates.
          </p>
          <Link
            to="/changelog"
            className="px-6 py-2.5 bg-surface-2 border border-line text-cyan-glow font-grotesk font-bold text-xs rounded-control inline-flex items-center justify-center gap-2 hover:bg-surface-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to change log</span>
          </Link>
        </div>
        <MoltNationFooter />
      </div>
    )
  }

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      const shareData = {
        title: entry.title,
        text: entry.summary || 'An update from Moltology',
        url: window.location.href,
      }
      if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData)
          return
        } catch (err) {
          if ((err as any)?.name === 'AbortError') return
        }
      }
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch (e) {
        console.warn('Clipboard write failed:', e)
      }
    }
  }

  return (
    <div className="min-h-screen bg-abyss text-ink font-sans relative flex flex-col justify-between">
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />

      {/* Main Public HUD Header */}
      <PublicHeader
        onOpenAuth={(mode) => {
          setAuthMode(mode)
          setIsAuthModalOpen(true)
        }}
      />

      {/* Main Article Content */}
      <article className="flex-1 w-full relative z-10">
        {/* Header Hero Section */}
        <header className="w-full relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8 border-b border-line-subtle bg-surface-1 overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative z-10">
            <Link
              to="/changelog"
              className="inline-flex items-center gap-2 py-1 text-xs font-sans font-bold text-cyan-glow hover:text-cyan-glow transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to change log</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-sans">
              {entry.version && (
                <span className="font-grotesk font-extrabold text-xs text-cyan-glow bg-surface-2 border border-line px-3 py-1 rounded-control ">
                  {entry.version}
                </span>
              )}
              <span className={`text-[11px] font-bold px-2.5 py-1 border text-cyan-glow bg-cyan-soft border-line-subtle rounded-control`}>
                {entry.category}
              </span>
              <span className="flex items-center gap-1.5 text-ink-muted text-xs">
                <Calendar className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
                {entry.releasedAt ? <LocalTime value={entry.releasedAt} /> : 'AUG 2026'}
              </span>
            </div>

            <h1 className="font-grotesk font-black text-2xl sm:text-4xl md:text-5xl text-ink tracking-tight leading-tight break-words">
              {entry.title}
            </h1>

            <p className="font-sans text-sm sm:text-base text-ink-body leading-relaxed max-w-3xl">
              {entry.summary}
            </p>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-line-subtle">
              <div className="flex items-center gap-2 text-xs text-cyan-glow font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-glow" />
                <span>Published update</span>
              </div>

              <button
                onClick={handleShare}
                className="px-3.5 py-1.5 bg-surface-2 hover:bg-surface-3 border border-line-subtle text-xs font-sans text-ink-body hover:text-cyan-glow rounded-control flex items-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow shrink-0"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-glow" />
                <span>{copied ? 'Link copied' : 'Share update'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Release Notes Body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="rounded-card hud-sheen shadow-sheen-inset p-6 sm:p-8 border border-line-subtle bg-surface-1 ">
            <NewsArticleBody content={entry.content} className="[&>:first-child]:mt-0" />
          </div>

          {/* Related / Recent Transmutations */}
          {relatedEntries.length > 0 && (
            <div className="mt-12 pt-8 border-t border-line-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-grotesk font-bold text-sm text-ink tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-glow" />
                  <span>More updates</span>
                </h3>
                <Link
                  to="/changelog"
                  className="text-xs font-sans text-cyan-glow hover:text-cyan-glow transition-colors flex items-center gap-1"
                >
                  <span>All updates</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedEntries.map((rel) => (
                  <Link
                    key={rel.slug}
                    to="/changelog/$slug"
                    params={{ slug: rel.slug }}
                    className="rounded-card hud-sheen shadow-sheen-inset p-4 border border-line-subtle hover:border-line-strong bg-surface-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow transition-all flex flex-col justify-between group space-y-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-sans">
                        <span className="text-cyan-glow font-bold">{rel.version}</span>
                        <span className="text-ink-muted">{rel.category}</span>
                      </div>
                      <h4 className="font-grotesk font-bold text-xs sm:text-sm text-ink group-hover:text-cyan-glow transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-ink-muted font-sans line-clamp-2">
                        {rel.summary}
                      </p>
                    </div>
                    <div className="text-[11px] text-cyan-glow group-hover:text-cyan-glow flex items-center gap-1 font-bold pt-1">
                      <span>Read update</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Footer */}
      <MoltNationFooter />
    </div>
  )
}
