import { HudTitleBandTop, HudTitlePanel } from '@/components/hud/HudTitlePanel'
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
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  Coffee,
} from 'lucide-react'
import { type ChangelogEntry } from '@/lib/changelogs'
import { ChangelogFilterBar } from '@/components/changelog/ChangelogFilterBar'
import { HudPagination } from '@/components/ui/HudPagination'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import SupportTicketForm from '@/components/hud/SupportTicketForm'
import { SUPPORT_PAGE_COPY } from '@/lib/support-tickets'
import { TIP_JAR_COPY, TIP_JAR_URL } from '@/lib/tip-jar'

export default function SupportPortalView({ loaderData }: { loaderData: any }) {
  // loaderData passed as prop
  const [activeTab, setActiveTab] = useState<'ticket' | 'changelog'>('ticket')
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

  const latestChangelogs = React.useMemo(
    () =>
      [...(Array.isArray(changelogs) ? changelogs : [])]
        .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime())
        .slice(0, 3),
    [changelogs],
  )

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
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans text-ink">
      <div>
        <HudTitleBandTop>
          <HorizontalScroll className="-ml-2.5 overflow-x-auto pl-2.5" tabIndex={-1}>
            <HudTabs
              label="Support sections"
              className="w-max flex-nowrap"
              idPrefix="support-tab"
              value={activeTab}
              onValueChange={setActiveTab}
              items={[
                { value: 'ticket', label: SUPPORT_PAGE_COPY.tabContact },
                { value: 'changelog', label: SUPPORT_PAGE_COPY.tabChangelog },
              ]}
            />
          </HorizontalScroll>
        </HudTitleBandTop>
        <HudTitlePanel treatment="band" joined title={SUPPORT_PAGE_COPY.pageTitle} />
      </div>
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

        {/* Contact support: stacked on phones, form + side column from lg */}
        {activeTab === 'ticket' && (
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 lg:p-5">
              <SupportTicketForm />
            </section>

            <div className="space-y-3 sm:space-y-4">
              {latestChangelogs.length > 0 && (
                <DashboardPanel
                  icon={<GitCommit />}
                  title="What’s new"
                  className="hidden lg:block"
                  action={{ label: 'All updates', onClick: () => setActiveTab('changelog') }}
                >
                  <ol className="divide-y divide-line-subtle -my-1">
                    {latestChangelogs.map((entry) => (
                      <li key={entry.version} className="py-2">
                        <p className="text-sm font-bold text-ink leading-snug line-clamp-2">{entry.title}</p>
                        {formatReleaseDay(entry.releasedAt) && (
                          <time
                            dateTime={new Date(entry.releasedAt).toISOString()}
                            className="text-[11px] text-ink-muted tabular-nums"
                          >
                            {formatReleaseDay(entry.releasedAt)}
                          </time>
                        )}
                      </li>
                    ))}
                  </ol>
                </DashboardPanel>
              )}

              {/* Tip jar: quiet, beside (desktop) or below (phone) the form */}
              <section
                aria-label="Tip jar"
                className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 flex flex-col gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{TIP_JAR_COPY.supportTitle}</p>
                  <p className="text-xs text-ink-muted leading-relaxed">{TIP_JAR_COPY.supportBody}</p>
                </div>
                <a
                  href={TIP_JAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-1.5 self-start rounded-control border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-ink hover:border-line-strong hover:bg-surface-3 transition-colors ${DASHBOARD_FOCUS}`}
                >
                  <Coffee className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                  {TIP_JAR_COPY.supportCta}
                  <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                </a>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


