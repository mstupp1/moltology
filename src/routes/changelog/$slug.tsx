import React, { useState, useMemo } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Terminal,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import { getChangelogBySlugFn } from '@/lib/server/api'
import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'
import type { ChangelogEntry } from '@/lib/changelogs-data'
import { seo, buildJsonLd } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'

export const Route = createFileRoute('/changelog/$slug')({
  loader: async ({ params }) => {
    try {
      const res = await getChangelogBySlugFn({ data: params.slug })
      if (res) return res as ChangelogEntry
    } catch (e) {
      console.warn('Loader error fetching changelog by slug:', e)
    }
    return INITIAL_CHANGELOGS.find((c) => c.slug === params.slug) ?? null
  },
  head: ({ loaderData }) => {
    const entry = loaderData as ChangelogEntry | null
    const title = entry?.title
      ? `${entry.title} (${entry.version || 'Update'}) | Moltology Changelog`
      : 'System Transmutation | Moltology Changelog'
    const description = entry?.summary || 'Official system update telemetry and bio-silicon transmutations.'
    const url = entry?.slug ? `https://moltology.org/changelog/${entry.slug}` : 'https://moltology.org/changelog'
    const ogImage = getAssetUrl('/images/ai_learning_ascension_cover.jpg')
    const publishedTime = entry?.releasedAt ? new Date(entry.releasedAt).toISOString() : new Date().toISOString()

    return {
      meta: [
        ...seo({
          title,
          description,
          keywords: `Moltology, changelog, ${entry?.category || 'transmutation'}, system update, ecdysis`,
          ogImage,
          ogType: 'article',
          canonical: url,
          siteName: 'Moltology Changelog',
          publishedTime,
          section: entry?.category || 'System Transmutations',
          twitterCard: 'summary_large_image',
          twitterSite: '@moltology',
        }),
      ],
      links: [
        { rel: 'canonical', href: url },
      ],
    }
  },
  component: ChangelogDetailRoute,
})

function ChangelogDetailRoute() {
  const entry = Route.useLoaderData() as ChangelogEntry | null
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
      <div className="min-h-screen bg-[#05080a] text-gray-200 font-sans flex flex-col justify-between items-center py-20 px-4">
        <PublicHeader
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setIsAuthModalOpen(true)
          }}
        />
        <div className="text-center chitin-card border border-red-900/60 p-8 sm:p-12 chamfer-corner max-w-lg w-full my-auto">
          <Terminal className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-gray-100 uppercase">
            TRANSMUTATION LOG NOT FOUND
          </h2>
          <p className="text-xs text-gray-400 mt-2 mb-6 font-sans">
            The requested changelog slug does not exist or has been archived.
          </p>
          <Link
            to="/changelog"
            className="px-6 py-2.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase chamfer-corner inline-flex items-center justify-center gap-2 hover:bg-cyan-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO SYSTEM CHANGELOG</span>
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
        text: entry.summary || 'System update from Moltology Changelog',
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

  const formattedDate = entry.releasedAt
    ? new Date(entry.releasedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'AUG 2026'

  const getCategoryBadgeClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'feature':
      case 'features':
        return 'text-cyan-300 border-cyan-500/50 bg-cyan-950/60'
      case 'improvement':
      case 'improvements':
        return 'text-purple-300 border-purple-500/50 bg-purple-950/60'
      case 'security':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/60'
      case 'performance':
        return 'text-amber-300 border-amber-500/50 bg-amber-950/60'
      case 'fix':
      case 'fixes':
      case 'bug_purge':
        return 'text-rose-400 border-rose-500/50 bg-rose-950/60'
      case 'design':
      case 'ui/ux':
        return 'text-pink-300 border-pink-500/50 bg-pink-950/60'
      default:
        return 'text-cyan-400 border-cyan-600/40 bg-cyan-950/40'
    }
  }

  const getTagBadgeClass = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'performance':
        return 'text-amber-300/90 border-amber-500/30 bg-amber-950/40'
      case 'ui/ux':
      case 'design':
        return 'text-pink-300/90 border-pink-500/30 bg-pink-950/40'
      case 'security':
      case 'auth':
      case 'protection':
        return 'text-emerald-300/90 border-emerald-500/30 bg-emerald-950/40'
      case 'ai':
        return 'text-indigo-300/90 border-indigo-500/30 bg-indigo-950/40'
      case 'media':
      case 'video':
      case 'audio':
        return 'text-sky-300/90 border-sky-500/30 bg-sky-950/40'
      case 'navigation':
      case 'tools':
        return 'text-cyan-300/90 border-cyan-500/30 bg-cyan-950/40'
      default:
        return 'text-gray-300 border-cyan-900/40 bg-[#0a1013]'
    }
  }

  const extraTags = Array.isArray(entry.tags)
    ? entry.tags.filter((t) => t.toLowerCase() !== entry.category?.toLowerCase())
    : []

  return (
    <div className="min-h-screen bg-[#05080a] text-gray-200 font-sans relative flex flex-col justify-between">
      {/* Background Overlays */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.08)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-20" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-25" />

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
        <header className="w-full relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8 border-b border-cyan-900/40 bg-[#030608]/90 overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative z-10">
            <Link
              to="/changelog"
              className="inline-flex items-center gap-2 py-1 text-xs font-sans font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO SYSTEM CHANGELOG</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-sans">
              {entry.version && (
                <span className="font-grotesk font-extrabold text-xs text-cyan-300 bg-cyan-950/90 border border-cyan-500/60 px-3 py-1 chamfer-corner shadow-hud-cyan">
                  {entry.version}
                </span>
              )}
              <span className={`text-[11px] font-bold px-2.5 py-1 border ${getCategoryBadgeClass(entry.category)} chamfer-corner uppercase`}>
                {entry.category}
              </span>
              {extraTags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[10px] font-bold px-2 py-0.5 border ${getTagBadgeClass(tag)} chamfer-corner uppercase`}
                >
                  {tag}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {formattedDate}
              </span>
            </div>

            <h1 className="font-grotesk font-black text-2xl sm:text-4xl md:text-5xl text-gray-100 uppercase tracking-tight leading-tight break-words">
              {entry.title}
            </h1>

            <p className="font-sans text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
              {entry.summary}
            </p>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-cyan-900/40">
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>VERIFIED SYSTEM TRANSMUTATION</span>
              </div>

              <button
                onClick={handleShare}
                className="px-3.5 py-1.5 bg-[#090f11] hover:bg-cyan-950 border border-cyan-900/60 text-xs font-sans text-gray-300 hover:text-cyan-300 chamfer-corner flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{copied ? 'LINK COPIED!' : 'SHARE'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Release Notes Body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="chitin-card p-6 sm:p-8 border border-cyan-900/50 chamfer-corner bg-[#080d0f]/90 shadow-2xl">
            <NewsArticleBody content={entry.content} />
          </div>

          {/* Related / Recent Transmutations */}
          {relatedEntries.length > 0 && (
            <div className="mt-12 pt-8 border-t border-cyan-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-grotesk font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>OTHER RECENT TRANSMUTATIONS</span>
                </h3>
                <Link
                  to="/changelog"
                  className="text-xs font-sans text-cyan-400 hover:text-cyan-300 transition-colors uppercase flex items-center gap-1"
                >
                  <span>ALL CHANGELOGS</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedEntries.map((rel) => (
                  <Link
                    key={rel.slug}
                    to="/changelog/$slug"
                    params={{ slug: rel.slug }}
                    className="chitin-card p-4 border border-cyan-900/60 hover:border-cyan-500/70 chamfer-corner bg-[#070b0d] transition-all flex flex-col justify-between group space-y-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-sans">
                        <span className="text-cyan-400 font-bold uppercase">{rel.version}</span>
                        <span className="text-gray-500">{rel.category}</span>
                      </div>
                      <h4 className="font-grotesk font-bold text-xs sm:text-sm text-gray-200 group-hover:text-cyan-300 transition-colors line-clamp-2 uppercase">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-sans line-clamp-2">
                        {rel.summary}
                      </p>
                    </div>
                    <div className="text-[10px] text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 font-bold pt-1">
                      <span>VIEW LOG</span>
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
