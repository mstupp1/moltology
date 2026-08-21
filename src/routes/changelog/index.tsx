import React, { useState, useMemo } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  Clock,
  Terminal,
  Activity,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { ChangelogFilterBar } from '@/components/changelog/ChangelogFilterBar'
import { HudPagination } from '@/components/ui/HudPagination'
import { getPublicChangelogsFn } from '@/lib/server/api'
import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'
import type { ChangelogEntry } from '@/lib/changelogs-data'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'

export const Route = createFileRoute('/changelog/')({
  loader: async () => {
    try {
      const logs = await getPublicChangelogsFn()
      if (logs && logs.length > 0) return logs as ChangelogEntry[]
    } catch (e) {
      console.warn('Loader error fetching changelogs:', e)
    }
    return INITIAL_CHANGELOGS
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'System Changelog · Transmutation Telemetry | Moltology',
        description: 'Official system updates, chassis upgrades, security isolations, and bio-silicon transmutations powering Moltology.',
        keywords: 'Moltology changelog, system updates, ecdysis telemetry, chassis upgrades, bio-silicon transmutations',
        ogImage: getAssetUrl('/images/ai_learning_ascension_cover.jpg'),
        canonical: 'https://moltology.org/changelog',
        siteName: 'Moltology Changelog',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/changelog' },
    ],
  }),
  component: ChangelogIndexPage,
})

function ChangelogIndexPage() {
  const loaderLogs = Route.useLoaderData() as ChangelogEntry[]
  const navigate = useNavigate()
  const [logs] = useState<ChangelogEntry[]>(loaderLogs || INITIAL_CHANGELOGS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Compute category options with live counts
  const categoryOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    logs.forEach((log) => {
      const cat = log.category || 'Feature'
      counts[cat] = (counts[cat] || 0) + 1
    })

    const standardOrder = ['Feature', 'Improvement', 'Security', 'Performance', 'Fix', 'Design']
    const orderedCats = standardOrder.filter((c) => counts[c] !== undefined)
    const extraCats = Object.keys(counts).filter((c) => !standardOrder.includes(c))

    return [
      { label: 'ALL', count: logs.length },
      ...[...orderedCats, ...extraCats].map((cat) => ({
        label: cat,
        count: counts[cat] || 0,
      })),
    ]
  }, [logs])

  // Compute tag options with live counts sorted by frequency
  const tagOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    logs.forEach((log) => {
      if (Array.isArray(log.tags)) {
        log.tags.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1
        })
      }
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        log.category?.toLowerCase() === selectedCategory.toLowerCase()

      const matchesTag =
        !selectedTag ||
        (Array.isArray(log.tags) &&
          log.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()))

      const matchesSearch =
        searchQuery === '' ||
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(log.tags) &&
          log.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))

      return matchesCategory && matchesTag && matchesSearch
    })
  }, [logs, selectedCategory, selectedTag, searchQuery])

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLogs.slice(start, start + pageSize)
  }, [filteredLogs, currentPage, pageSize])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setCurrentPage(1)
  }

  const handleTagChange = (tag: string | null) => {
    setSelectedTag(tag)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('ALL')
    setSelectedTag(null)
    setCurrentPage(1)
  }

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

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
      <PublicHeader onOpenAuth={openAuth} />

      {/* Hero Header Section */}
      <header className="w-full relative pt-28 pb-8 sm:pt-36 sm:pb-12 px-4 sm:px-8 border-b border-cyan-900/40 bg-[#030608]/90 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-sans text-xs font-bold uppercase tracking-widest chamfer-corner">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>TRANSMUTATION TELEMETRY</span>
          </div>

          <h1 className="font-grotesk font-black text-3xl sm:text-5xl text-gray-100 uppercase tracking-tight leading-tight">
            SYSTEM CHANGELOG
          </h1>

          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
            Continuous deployment telemetry, system updates, and feature upgrades powering The Order of the Synaptic Path.
          </p>
        </div>
      </header>

      {/* Standard Responsive Search & Filter Controls Bar */}
      <ChangelogFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        selectedTag={selectedTag}
        onTagChange={handleTagChange}
        categories={categoryOptions}
        tags={tagOptions}
        totalCount={logs.length}
        filteredCount={filteredLogs.length}
        onReset={handleResetFilters}
      />

      {/* Main Content Timeline Feed */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-8 py-10 w-full relative z-10 space-y-6">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 chitin-card border border-cyan-900/40 p-8 chamfer-corner space-y-4">
            <Terminal className="w-10 h-10 text-cyan-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-grotesk text-lg font-bold text-gray-200 uppercase">
                NO MATCHING RELEASES FOUND
              </h3>
              <p className="text-xs text-gray-400 font-sans max-w-md mx-auto">
                No changelog entries matched your active search query or selected category/tag filters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase chamfer-corner inline-flex items-center gap-2 transition-all active:scale-95 shadow-hud-cyan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR SEARCH & FILTERS</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 relative">
            {/* Timeline Vertical Track */}
            <div className="absolute left-3.5 sm:left-5 top-4 bottom-4 w-[3px] -translate-x-1/2 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 via-cyan-600/50 to-transparent opacity-60 rounded-full" />
              <div className="absolute inset-0 bg-cyan-400/10 blur-md rounded-full" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_6px,rgba(0,195,255,0.35)_6px,rgba(0,195,255,0.35)_7px)]" />
            </div>

            {paginatedLogs.map((log) => {
              const formattedDate = log.releasedAt
                ? new Date(log.releasedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'AUG 2026'

              const extraTags = Array.isArray(log.tags)
                ? log.tags.filter((t) => t.toLowerCase() !== log.category?.toLowerCase())
                : []

              return (
                <article
                  key={log.slug || log.version}
                  className="relative z-10 pl-9 sm:pl-12 group"
                >
                  {/* Timeline Indicator Node */}
                  <div className="absolute left-3.5 sm:left-5 top-4 -translate-x-1/2 group-hover:scale-125 transition-transform duration-300">
                    <div className="w-4 h-4 rounded-full bg-[#05080a] border-2 border-cyan-400 shadow-hud-cyan relative flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-cyan-400/40 blur-[6px] -z-10" />
                    <div className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full border border-cyan-400/30 animate-ping-slow -z-10" />
                  </div>

                  {/* Card Container */}
                  <div className="chitin-card p-5 sm:p-6 border border-cyan-900/50 hover:border-cyan-400/80 chamfer-corner bg-[#080d0f]/90 transition-all shadow-xl space-y-3">
                    {/* Header: Badges & Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-950 pb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {log.version && (
                          <span className="font-grotesk font-extrabold text-xs text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 chamfer-corner">
                            {log.version}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 border ${getCategoryBadgeClass(log.category)} chamfer-corner uppercase`}>
                          {log.category}
                        </span>
                        {extraTags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[9px] font-bold px-1.5 py-0.5 border ${getTagBadgeClass(tag)} chamfer-corner uppercase`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-sans">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-1.5">
                      <Link
                        to="/changelog/$slug"
                        params={{ slug: log.slug }}
                        className="font-grotesk font-bold text-lg sm:text-xl text-gray-100 group-hover:text-cyan-300 transition-colors uppercase leading-snug block"
                      >
                        {log.title}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed">
                        {log.summary}
                      </p>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <Link
                        to="/changelog/$slug"
                        params={{ slug: log.slug }}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold font-sans transition-colors group/link"
                      >
                        <span>READ FULL TRANSMUTATION LOG</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>

                      <span className="text-[10px] text-gray-500 font-sans">
                        /changelog/{log.slug}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}

            {/* Pagination Controls */}
            <HudPagination
              currentPage={currentPage}
              totalItems={filteredLogs.length}
              pageSize={pageSize}
              onPageChange={(page) => {
                setCurrentPage(page)
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 120, behavior: 'smooth' })
                }
              }}
              itemName="releases"
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <MoltNationFooter />
    </div>
  )
}
