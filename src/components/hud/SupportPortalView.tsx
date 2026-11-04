import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import React, { useState } from 'react'
import { HudTabs } from '@/components/ui/HudTabs'
import { HudButton } from '@/components/ui/HudButton'
import { LocalTime } from '@/components/ui/LocalTime'
import { Link } from '@tanstack/react-router'
import { HudGhostCard } from '@/components/ui/HudGhostLoader'
import {
  HelpCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Database,
  ShieldCheck,
  Zap,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { type ChangelogEntry } from '@/lib/changelogs'
import { ChangelogFilterBar } from '@/components/changelog/ChangelogFilterBar'
import { HudPagination } from '@/components/ui/HudPagination'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import SupportTicketForm from '@/components/hud/SupportTicketForm'
import { SUPPORT_PAGE_COPY, SUPPORT_TICKET_COPY } from '@/lib/support-tickets'

export default function SupportPortalView({ loaderData }: { loaderData: any }) {
  // loaderData passed as prop
  const [activeTab, setActiveTab] = useState<'changelog' | 'kb' | 'ticket' | 'diagnostics'>('ticket')
  const changelogs: ChangelogEntry[] = loaderData?.changelogs || []
  const loading = !loaderData?.changelogs
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({ v1_0_0: true, v1_4_2: true })

  const toggleExpand = (version: string) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [version]: !prev[version],
    }))
  }

  // Compute category options with live counts
  const categoryOptions = React.useMemo(() => {
    const counts: Record<string, number> = {}
    const list = Array.isArray(changelogs) ? changelogs : []
    list.forEach((log) => {
      const cat = log.category || 'Feature'
      counts[cat] = (counts[cat] || 0) + 1
    })

    const standardOrder = ['Feature', 'Improvement', 'Security', 'Performance', 'Fix', 'Design']
    const orderedCats = standardOrder.filter((c) => counts[c] !== undefined)
    const extraCats = Object.keys(counts).filter((c) => !standardOrder.includes(c))

    return [
      { label: 'ALL', count: list.length },
      ...[...orderedCats, ...extraCats].map((cat) => ({
        label: cat,
        count: counts[cat] || 0,
      })),
    ]
  }, [changelogs])

  // Compute tag options with live counts
  const tagOptions = React.useMemo(() => {
    const counts: Record<string, number> = {}
    const list = Array.isArray(changelogs) ? changelogs : []
    list.forEach((log) => {
      if (Array.isArray(log.tags)) {
        log.tags.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1
        })
      }
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))
  }, [changelogs])

  const filteredChangelogs = (Array.isArray(changelogs) ? changelogs : []).filter((entry) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      entry.category?.toLowerCase() === selectedCategory.toLowerCase()

    const matchesTag =
      !selectedTag ||
      (Array.isArray(entry.tags) &&
        entry.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()))

    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(entry.tags) &&
        entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))

    return matchesCategory && matchesTag && matchesSearch
  })

  const paginatedChangelogs = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredChangelogs.slice(start, start + pageSize)
  }, [filteredChangelogs, currentPage, pageSize])

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

  return (
    <div className="chitin-card rounded-card p-4 sm:p-6 space-y-5 font-sans text-ink">
      <HudTitlePanel treatment="integrated" title={SUPPORT_PAGE_COPY.pageTitle} />
      <HudTabs
        label="Support sections"
        className="grid grid-cols-2 gap-x-4 gap-y-0 sm:flex sm:gap-5"
        idPrefix="support-tab"
        value={activeTab}
        onValueChange={setActiveTab}
        items={[
          { value: 'changelog', label: SUPPORT_PAGE_COPY.tabChangelog },
          { value: 'kb', label: SUPPORT_PAGE_COPY.tabFaq },
          { value: 'ticket', label: SUPPORT_TICKET_COPY.formTitle },
          { value: 'diagnostics', label: SUPPORT_PAGE_COPY.tabDiagnostics },
        ]}
      />
      <div role="tabpanel" aria-labelledby={`support-tab-${activeTab}`}>
        {/* Changelog */}
        {activeTab === 'changelog' && (
          <div className="space-y-4">
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
              totalCount={changelogs.length}
              filteredCount={filteredChangelogs.length}
              onReset={handleResetFilters}
              className="border-line-subtle"
            />

            {/* Changelog Entries Timeline */}
            {loading ? (
              <div className="space-y-4">
                <HudGhostCard lines={3} />
                <HudGhostCard lines={3} />
                <HudGhostCard lines={3} />
              </div>
            ) : filteredChangelogs.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-crimson-text mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-ink">{SUPPORT_PAGE_COPY.changelogEmpty}</p>
                  <p className="text-xs text-ink-muted max-w-md mx-auto">
                    {SUPPORT_PAGE_COPY.changelogEmptyHint(searchQuery || selectedCategory)}
                  </p>
                </div>
                <HudButton variant="secondary" onClick={handleResetFilters} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                  {SUPPORT_PAGE_COPY.changelogReset}
                </HudButton>
              </div>
            ) : (
              <div className="space-y-4 relative">
                <div aria-hidden="true" className="absolute left-2 md:left-3 top-4 bottom-4 w-px bg-line" />

                {paginatedChangelogs.map((entry) => {
                  const key = entry.version.replace(/\./g, '_')
                  const isExpanded = expandedEntries[entry.version] || expandedEntries[key]

                  return (
                    <div key={entry.version} className="group relative z-10 pl-6 md:pl-8">
                      <div aria-hidden="true" className="absolute left-2 md:left-3 top-5 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-glow border-2 border-surface-1" />

                      {/* Entry Card */}
                      <div className="rounded-card border border-line-subtle bg-surface-2 p-4 md:p-5 space-y-3">
                        {/* Top Bar: Version & Metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-grotesk font-extrabold text-sm md:text-base text-ink">
                              {entry.version}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 text-cyan-glow bg-cyan-soft rounded-chip uppercase">
                              {entry.category}
                            </span>
                            {(Array.isArray(entry.tags) ? entry.tags.filter((t) => t.toLowerCase() !== entry.category?.toLowerCase()) : []).map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] text-ink-muted"
                              >
                                {tag}
                              </span>
                            ))}
                            <span className="text-[11px] text-ink-muted flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-glow" />
                              <LocalTime value={entry.releasedAt} />
                            </span>
                          </div>
                        </div>

                        {/* Title & Summary */}
                        <div className="space-y-1">
                          <h2 className="font-grotesk text-sm md:text-base font-bold text-ink">
                            {entry.title}
                          </h2>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            {entry.summary}
                          </p>
                        </div>

                        {/* Expandable Markdown Release Notes */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-line/50 bg-surface-2 p-4 rounded-card">
                            <NewsArticleBody content={entry.content} />
                          </div>
                        )}

                        {/* Card Footer Toggle Button */}
                        <div className="flex justify-between items-center pt-1">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleExpand(key)}
                              aria-expanded={Boolean(isExpanded)}
                              className="min-h-10 rounded-control text-xs text-cyan-glow hover:text-ink font-bold flex items-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                            >
                              {isExpanded ? (
                                <>
                                  <span>{SUPPORT_PAGE_COPY.changelogCollapse}</span>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  <span>{SUPPORT_PAGE_COPY.changelogExpand}</span>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>

                            {entry.slug && (
                              <Link
                                to="/changelog/$slug"
                                params={{ slug: entry.slug }}
                                className="min-h-8 rounded-control text-[11px] text-ink-muted hover:text-cyan-glow font-bold flex items-center gap-1 transition-colors border border-line px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                                title="View public permalink page"
                              >
                                <span>{SUPPORT_PAGE_COPY.changelogPermalink}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Pagination Controls */}
                <HudPagination
                  currentPage={currentPage}
                  totalItems={filteredChangelogs.length}
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
          </div>
        )}

        {activeTab === 'kb' && (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <HelpCircle className="w-5 h-5 text-cyan-glow" />
                <h2 className="font-grotesk text-sm font-bold text-ink uppercase tracking-wider">
                  {SUPPORT_PAGE_COPY.faqTitle}
                </h2>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                {SUPPORT_PAGE_COPY.faqHint}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="space-y-2 border-t border-line-subtle pt-4">
                  <h3 className="font-grotesk text-xs font-bold text-ink">
                    {SUPPORT_PAGE_COPY.faqStartTitle}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {SUPPORT_PAGE_COPY.faqStartBody}
                  </p>
                </div>

                <div className="space-y-2 border-t border-line-subtle pt-4">
                  <h3 className="font-grotesk text-xs font-bold text-ink">
                    {SUPPORT_PAGE_COPY.faqBillingTitle}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {SUPPORT_PAGE_COPY.faqBillingBody}
                  </p>
                </div>

                <div className="space-y-2 border-t border-line-subtle pt-4">
                  <h3 className="font-grotesk text-xs font-bold text-ink">
                    {SUPPORT_PAGE_COPY.faqPrivacyTitle}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {SUPPORT_PAGE_COPY.faqPrivacyBody}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Contact support */}
        {activeTab === 'ticket' && (
          <div className="space-y-4">
            <SupportTicketForm />
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Activity className="w-5 h-5 text-cyan-glow" />
              <h2 className="font-grotesk text-sm font-bold text-ink uppercase tracking-wider">
                {SUPPORT_PAGE_COPY.diagnosticsTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-card border border-line-subtle bg-surface-2 p-4 space-y-2">
                <span className="text-[11px] text-ink-muted uppercase font-bold">{SUPPORT_PAGE_COPY.diagnosticsDatabase}</span>
                <div className="text-sm font-bold text-cyan-glow flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-glow" />
                  <span>{SUPPORT_PAGE_COPY.diagnosticsOk}</span>
                </div>
              </div>

              <div className="rounded-card border border-line-subtle bg-surface-2 p-4 space-y-2">
                <span className="text-[11px] text-ink-muted uppercase font-bold">{SUPPORT_PAGE_COPY.diagnosticsAuth}</span>
                <div className="text-sm font-bold text-cyan-glow flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-glow" />
                  <span>{SUPPORT_PAGE_COPY.diagnosticsHealthy}</span>
                </div>
              </div>

              <div className="rounded-card border border-line-subtle bg-surface-2 p-4 space-y-2">
                <span className="text-[11px] text-ink-muted uppercase font-bold">{SUPPORT_PAGE_COPY.diagnosticsApp}</span>
                <div className="text-sm font-bold text-cyan-glow flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-glow" />
                  <span>{SUPPORT_PAGE_COPY.diagnosticsOk}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


