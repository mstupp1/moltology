import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import React, { useState } from 'react'
import { HudTabs } from '@/components/ui/HudTabs'
import { HudButton } from '@/components/ui/HudButton'
import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { DashboardPanel, DASHBOARD_FOCUS } from '@/components/hud/dashboard/DashboardPanel'
import { formatReleaseDay } from '@/components/hud/dashboard/DashboardChangelogPanel'
import { Link } from '@tanstack/react-router'
import { HudGhostCard } from '@/components/ui/HudGhostLoader'
import {
  GitCommit,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { type ChangelogEntry } from '@/lib/changelogs'
import { ChangelogFilterBar } from '@/components/changelog/ChangelogFilterBar'
import { HudPagination } from '@/components/ui/HudPagination'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import SupportTicketForm from '@/components/hud/SupportTicketForm'
import { SUPPORT_PAGE_COPY } from '@/lib/support-tickets'

export default function SupportPortalView({ loaderData }: { loaderData: any }) {
  // loaderData passed as prop
  const [activeTab, setActiveTab] = useState<'changelog' | 'kb' | 'ticket'>('ticket')
  const changelogs: ChangelogEntry[] = loaderData?.changelogs || []
  const loading = !loaderData?.changelogs
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({})

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
      <HorizontalScroll className="overflow-x-auto p-1">
        <HudTabs
          label="Support sections"
          className="w-max min-w-full flex-nowrap [&_button]:shrink-0"
          idPrefix="support-tab"
          value={activeTab}
          onValueChange={setActiveTab}
          items={[
            { value: 'changelog', label: SUPPORT_PAGE_COPY.tabChangelog },
            { value: 'kb', label: SUPPORT_PAGE_COPY.tabFaq },
            { value: 'ticket', label: SUPPORT_PAGE_COPY.tabContact },
          ]}
        />
      </HorizontalScroll>
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

            {/* Release rows match the dashboard. */}
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
              <DashboardPanel icon={<GitCommit />} title="What’s new">
                <ol className="divide-y divide-line-subtle -my-1">
                  {paginatedChangelogs.map((entry) => {
                    const key = entry.version.replace(/\./g, '_')
                    const isExpanded = Boolean(expandedEntries[key])
                    return (
                      <li key={entry.version} className="py-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(key)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? SUPPORT_PAGE_COPY.changelogCollapse : SUPPORT_PAGE_COPY.changelogExpand}: ${entry.title}`}
                          className={`group grid w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] gap-3 py-2.5 rounded-control hover:bg-surface-2 text-left transition-colors ${DASHBOARD_FOCUS}`}
                        >
                          <time dateTime={formatReleaseDay(entry.releasedAt) ? new Date(entry.releasedAt).toISOString() : undefined} className="text-[11px] font-bold text-ink-muted tabular-nums pt-0.5">
                            {formatReleaseDay(entry.releasedAt)}
                          </time>
                          <span className="min-w-0 flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors leading-snug line-clamp-2 sm:line-clamp-1">{entry.title}</span>
                            <span className="text-xs text-ink-muted leading-relaxed line-clamp-2 sm:line-clamp-1">{entry.summary}</span>
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-glow mt-0.5" /> : <ChevronDown className="w-4 h-4 text-ink-muted mt-0.5" />}
                        </button>
                        {isExpanded && (
                          <div className="space-y-3 border-t border-line-subtle py-4 sm:ml-[4rem]">
                            <div className="flex flex-wrap gap-2 text-[11px] text-ink-muted">
                              <span>{entry.version}</span>
                              <span>{entry.category}</span>
                              {entry.slug && <Link to="/changelog/$slug" params={{ slug: entry.slug }} className={`inline-flex items-center gap-1 text-cyan-glow rounded-control ${DASHBOARD_FOCUS}`}>
                                {SUPPORT_PAGE_COPY.changelogPermalink}<ExternalLink className="w-3 h-3" />
                              </Link>}
                            </div>
                            <NewsArticleBody content={entry.content} />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ol>
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
              </DashboardPanel>
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
      </div>
    </div>
  )
}


