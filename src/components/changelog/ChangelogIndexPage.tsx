import React, { useState, useMemo } from 'react'
import { LocalTime } from '@/components/ui/LocalTime'
import { useNavigate, Link, useLoaderData } from '@tanstack/react-router'
import { GitCommit, ArrowRight, ChevronRight } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { ChangelogFilterBar } from '@/components/changelog/ChangelogFilterBar'
import { HudPagination } from '@/components/ui/HudPagination'
import { INITIAL_CHANGELOGS } from '@/lib/changelogs-data'
import type { ChangelogEntry } from '@/lib/changelogs-data'
import { DashboardPanel, DASHBOARD_FOCUS } from '@/components/hud/dashboard/DashboardPanel'

export function ChangelogIndexPage() {
  const loaderLogs = useLoaderData({ from: '/changelog/' }) as ChangelogEntry[]
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

  return (
    <div className="min-h-screen bg-abyss text-ink font-sans flex flex-col">
      <AuthModal isOpen={isAuthModalOpen} initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)} onSuccess={() => navigate({ to: '/dashboard' })} />
      <PublicHeader onOpenAuth={openAuth} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-28 sm:pt-32 pb-12 space-y-5">
        <header className="space-y-3 pb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-glow">
            <GitCommit className="w-4 h-4" aria-hidden="true" />
            <span>What’s new</span>
          </div>
          <h1 className="font-grotesk font-bold text-3xl sm:text-4xl tracking-tight">Change log</h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-2xl">
            New features, improvements, and fixes to make your day in Moltology easier.
          </p>
        </header>
        <ChangelogFilterBar searchQuery={searchQuery} onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange}
          selectedTag={selectedTag} onTagChange={handleTagChange} categories={categoryOptions}
          tags={tagOptions} totalCount={logs.length} filteredCount={filteredLogs.length} onReset={handleResetFilters} />
        <DashboardPanel icon={<GitCommit />} title="Latest updates"
          meta={<span className="text-xs text-ink-muted tabular-nums" role="status">{filteredLogs.length} updates</span>}>
          {filteredLogs.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <h3 className="text-base font-bold">No updates found</h3>
              <p className="text-sm text-ink-muted">Try another search or clear your filters.</p>
              <button onClick={handleResetFilters} className={`min-h-10 px-3 text-sm font-bold text-cyan-glow rounded-control hover:bg-surface-2 ${DASHBOARD_FOCUS}`}>Clear filters</button>
            </div>
          ) : (
            <ol className="divide-y divide-line-subtle">
              {paginatedLogs.map((log) => (
                <li key={log.slug || log.version}>
                  <Link to="/changelog/$slug" params={{ slug: log.slug }}
                    className={`group grid grid-cols-1 sm:grid-cols-[7rem_minmax(0,1fr)_auto] gap-2 sm:gap-5 py-5 px-2 -mx-2 rounded-control hover:bg-surface-2 transition-colors ${DASHBOARD_FOCUS}`}>
                    <span className="text-xs text-ink-muted tabular-nums sm:pt-1">
                      {log.releasedAt ? <LocalTime value={log.releasedAt} /> : 'Date unavailable'}
                    </span>
                    <span className="min-w-0 space-y-2 block">
                      <span className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="rounded-chip bg-cyan-soft px-2 py-0.5 font-bold text-cyan-glow">{log.category}</span>
                        {log.version && <span className="text-ink-muted">{log.version}</span>}
                      </span>
                      <span className="block text-base sm:text-lg font-bold text-ink group-hover:text-cyan-glow leading-snug">{log.title}</span>
                      <span className="block text-sm text-ink-muted leading-relaxed">{log.summary}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-glow pt-1">Read update <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
                    </span>
                    <ChevronRight className="hidden sm:block w-4 h-4 text-ink-muted mt-1 group-hover:text-cyan-glow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <HudPagination currentPage={currentPage} totalItems={filteredLogs.length} pageSize={pageSize}
            onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 120, behavior: 'smooth' }) }} itemName="updates" />
        </DashboardPanel>
      </main>
      <MoltNationFooter />
    </div>
  )
}
