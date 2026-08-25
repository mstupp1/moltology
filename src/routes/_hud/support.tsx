import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { HudGhostCard } from '@/components/ui/HudGhostLoader'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import {
  LifeBuoy,
  FileText,
  HelpCircle,
  Send,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldCheck,
  Zap,
  Terminal,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { getPublicChangelogs, type ChangelogEntry } from '@/lib/changelogs'
import { seo } from '@/lib/seo'
import { ChangelogFilterBar } from '@/components/changelog/ChangelogFilterBar'
import { HudPagination } from '@/components/ui/HudPagination'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'

function SupportPortalRoute() {
  const loaderData = Route.useLoaderData()
  const [activeTab, setActiveTab] = useState<'changelog' | 'kb' | 'ticket' | 'diagnostics'>('changelog')
  const changelogs: ChangelogEntry[] = loaderData?.changelogs || []
  const loading = !loaderData?.changelogs
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({ v1_0_0: true, v1_4_2: true })

  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('SHELL_INTEGRITY')
  const [ticketDescription, setTicketDescription] = useState('')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = React.useRef<TurnstileWidgetRef>(null)

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

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'feature':
      case 'features':
        return 'text-[#00ffff] border-[#00ffff]/40 bg-[#00ffff]/10'
      case 'improvement':
      case 'improvements':
        return 'text-[#c084fc] border-[#c084fc]/40 bg-[#c084fc]/10'
      case 'security':
        return 'text-[#34d399] border-[#34d399]/40 bg-[#34d399]/10'
      case 'performance':
        return 'text-[#fbbf24] border-[#fbbf24]/40 bg-[#fbbf24]/10'
      case 'fix':
      case 'fixes':
      case 'bug_purge':
        return 'text-[#f43f5e] border-[#f43f5e]/40 bg-[#f43f5e]/10'
      case 'design':
      case 'ui/ux':
        return 'text-[#f472b6] border-[#f472b6]/40 bg-[#f472b6]/10'
      default:
        return 'text-[#00c3ff] border-[#00c3ff]/40 bg-[#00c3ff]/10'
    }
  }

  const getTagColor = (tag: string) => {
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
        return 'text-[#839493] border-[#3a4a49] bg-[#070b0b]'
    }
  }

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketSubject || !ticketDescription) return
    setTicketSubmitted(true)
    setTurnstileToken(null)
    turnstileRef.current?.reset()
    setTimeout(() => {
      setTicketSubmitted(false)
      setTicketSubject('')
      setTicketDescription('')
    }, 4000)
  }

  return (
    <div className="space-y-3.5 sm:space-y-5 md:space-y-6 font-sans text-[#dfe3e3] pb-10">
      {/* Header Banner matching Benthic Ascendance HUD standard */}
      <div className="chitin-card p-3.5 sm:p-5 chamfer-corner shadow-2xl relative overflow-hidden space-y-2.5 sm:space-y-3">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#00ffff]/05 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-[#3a4a49] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#091113] border border-[#00ffff] flex items-center justify-center p-2 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <LifeBuoy className="w-full h-full text-[#00ffff] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#ff5540] font-bold tracking-widest uppercase bg-[#ff5540]/10 border border-[#ff5540]/40 px-1.5 py-0.5">
                  BENTHIC CORE SUPPORT
                </span>
                <span className="text-[10px] text-[#839493]">PORTAL v2.4</span>
              </div>
              <h1 className="font-grotesk text-lg md:text-xl font-bold tracking-wider text-[#dfe3e3] uppercase">
                NEURAL TELEMETRY & SUPPORT CENTER
              </h1>
            </div>
          </div>

          {/* Realtime Status Indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-[#05090a] border border-[#3a4a49] px-3 py-1.5 chamfer-corner">
              <span className="w-2 h-2 rounded-full bg-[#00ffff] animate-ping" />
              <span className="text-xs text-[#00ffff] font-bold">SYSTEM STATUS: OPTIMAL</span>
              <span className="text-xs text-[#839493] border-l border-[#3a4a49] pl-2 ml-1">3,400 FATHOMS</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setActiveTab('changelog')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all duration-200 flex items-center gap-2 chamfer-corner ${
              activeTab === 'changelog'
                ? 'bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                : 'bg-[#091113]/60 text-[#839493] border border-[#3a4a49] hover:border-[#00ffff]/50 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>SYSTEM CHANGELOG</span>
            <span className="bg-[#00ffff]/20 text-[#00ffff] text-[10px] px-1.5 py-0.2 rounded-full ml-1">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('kb')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all duration-200 flex items-center gap-2 chamfer-corner ${
              activeTab === 'kb'
                ? 'bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                : 'bg-[#091113]/60 text-[#839493] border border-[#3a4a49] hover:border-[#00ffff]/50 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>KNOWLEDGE BASE & FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('ticket')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all duration-200 flex items-center gap-2 chamfer-corner ${
              activeTab === 'ticket'
                ? 'bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                : 'bg-[#091113]/60 text-[#839493] border border-[#3a4a49] hover:border-[#00ffff]/50 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>SUBMIT NEURAL TICKET</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all duration-200 flex items-center gap-2 chamfer-corner ${
              activeTab === 'diagnostics'
                ? 'bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                : 'bg-[#091113]/60 text-[#839493] border border-[#3a4a49] hover:border-[#00ffff]/50 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>SYSTEM DIAGNOSTICS</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SYSTEM CHANGELOG */}
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
            className="rounded-sm border border-[#3a4a49]/60"
          />

          {/* Changelog Entries Timeline */}
          {loading ? (
            <div className="space-y-4">
              <HudGhostCard lines={3} />
              <HudGhostCard lines={3} />
              <HudGhostCard lines={3} />
            </div>
          ) : filteredChangelogs.length === 0 ? (
            <div className="chitin-card p-8 text-center space-y-3 chamfer-corner">
              <AlertTriangle className="w-8 h-8 text-[#ff5540] mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#dfe3e3]">NO CHANGELOG TELEMETRY FOUND</p>
                <p className="text-xs text-[#839493] max-w-md mx-auto">
                  No records match your filter criteria "{searchQuery || selectedCategory}".
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-4 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 border border-[#00ffff] text-[#00ffff] text-xs font-bold chamfer-corner inline-flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET FILTERS</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 relative">
              {/* Vertical Timeline Bar */}
              <div className="absolute left-4 md:left-6 top-4 bottom-4 w-[3px] -translate-x-1/2 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00ffff] via-[#3a4a49]/60 to-transparent opacity-60 rounded-full" />
                <div className="absolute inset-0 bg-[#00ffff]/10 blur-md rounded-full" />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_6px,rgba(0,255,255,0.35)_6px,rgba(0,255,255,0.35)_7px)]" />
              </div>

              {paginatedChangelogs.map((entry) => {
                const isExpanded = expandedEntries[entry.version] || expandedEntries[entry.version.replace('.', '_')]
                const key = entry.version.replace(/\./g, '_')

                return (
                  <div key={entry.version} className="group relative z-10 pl-10 md:pl-14">
                    {/* Timeline Node Ring */}
                    <div className="absolute left-4 md:left-6 top-4 -translate-x-1/2 group-hover:scale-125 transition-transform duration-300">
                      <div className="w-4 h-4 rounded-full bg-[#070b0b] border-2 border-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.6)] relative flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-[#00ffff]/40 blur-[6px] -z-10" />
                      <div className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full border border-[#00ffff]/30 animate-ping-slow -z-10" />
                    </div>

                    {/* Entry Card */}
                    <div className="chitin-card p-4 md:p-5 chamfer-corner space-y-3 hover:border-[#00ffff]/60 transition-all shadow-xl">
                      {/* Top Bar: Version & Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3a4a49]/60 pb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-grotesk font-extrabold text-sm md:text-base text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/40 px-2.5 py-0.5 chamfer-corner">
                            {entry.version}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border ${getCategoryColor(entry.category)} chamfer-corner uppercase`}>
                            {entry.category}
                          </span>
                          {(Array.isArray(entry.tags) ? entry.tags.filter((t) => t.toLowerCase() !== entry.category?.toLowerCase()) : []).map((tag) => (
                            <span
                              key={tag}
                              className={`text-[9px] font-bold px-1.5 py-0.5 border ${getTagColor(tag)} chamfer-corner uppercase`}
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="text-[10px] text-[#839493] flex items-center gap-1 border border-[#3a4a49] px-2 py-0.5 bg-[#030606]">
                            <Clock className="w-3 h-3 text-[#00ffff]" />
                            {new Date(entry.releasedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Title & Summary */}
                      <div className="space-y-1">
                        <h2 className="font-grotesk text-sm md:text-base font-bold text-[#dfe3e3] hover:text-[#00ffff] transition-colors">
                          {entry.title}
                        </h2>
                        <p className="text-xs text-[#839493] leading-relaxed">
                          {entry.summary}
                        </p>
                      </div>

                      {/* Expandable Markdown Release Notes */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-[#3a4a49]/50 bg-[#030606]/80 p-4 chamfer-corner">
                          <NewsArticleBody content={entry.content} />
                        </div>
                      )}

                      {/* Card Footer Toggle Button */}
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(key)}
                            className="text-[11px] text-[#00ffff] hover:text-white font-bold flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>COLLAPSE RELEASE DETAILS</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>VIEW FULL TRANSMUTATION LOG</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          {entry.slug && (
                            <Link
                              to="/changelog/$slug"
                              params={{ slug: entry.slug }}
                              className="text-[10px] text-[#839493] hover:text-[#00ffff] font-sans font-bold flex items-center gap-1 transition-colors border border-[#3a4a49] px-2 py-0.5 chamfer-corner bg-[#030606]"
                              title="View public permalink page"
                            >
                              <span>PERMALINK</span>
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

      {/* TAB 2: KNOWLEDGE BASE & FAQ (Modular Stub for future success) */}
      {activeTab === 'kb' && (
        <div className="space-y-4">
          <div className="chitin-card p-5 chamfer-corner space-y-4">
            <div className="flex items-center gap-2 border-b border-[#3a4a49] pb-3">
              <HelpCircle className="w-5 h-5 text-[#00ffff]" />
              <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
                SYNAPTIC KNOWLEDGE BASE & FAQ INDEX
              </h2>
            </div>
            <p className="text-xs text-[#839493] leading-relaxed">
              Explore essential guidance for Larval Unit progression, Chitinous Mind calibration, and Benthic Market transmutations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="chitin-card-inset p-4 chamfer-corner space-y-2 border border-[#3a4a49] hover:border-[#00ffff]/50 transition-all cursor-pointer group">
                <span className="text-[10px] text-[#00ffff] font-bold uppercase tracking-widest block">
                  MODULE 01
                </span>
                <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff]">
                  LARVAL STAGE ASCENDANCE
                </h3>
                <p className="text-[11px] text-[#839493]">
                  How to complete daily alignment routines and elevate your cult stage rating.
                </p>
              </div>

              <div className="chitin-card-inset p-4 chamfer-corner space-y-2 border border-[#3a4a49] hover:border-[#00ffff]/50 transition-all cursor-pointer group">
                <span className="text-[10px] text-[#00ffff] font-bold uppercase tracking-widest block">
                  MODULE 02
                </span>
                <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff]">
                  ASSET SHEDDING & CREDITS
                </h3>
                <p className="text-[11px] text-[#839493]">
                  Liquidating unneeded assets into Molt Credits and Chitin Gems via the Market.
                </p>
              </div>

              <div className="chitin-card-inset p-4 chamfer-corner space-y-2 border border-[#3a4a49] hover:border-[#00ffff]/50 transition-all cursor-pointer group">
                <span className="text-[10px] text-[#00ffff] font-bold uppercase tracking-widest block">
                  MODULE 03
                </span>
                <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff]">
                  ISOLATION & HARDENING
                </h3>
                <p className="text-[11px] text-[#839493]">
                  Configuring privacy shell force-fields to detach from social noise.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBMIT NEURAL TICKET (Modular Stub) */}
      {activeTab === 'ticket' && (
        <div className="chitin-card p-5 chamfer-corner space-y-4">
          <div className="flex items-center gap-2 border-b border-[#3a4a49] pb-3">
            <Send className="w-5 h-5 text-[#00ffff]" />
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
              TRANSMIT NEURAL SUPPORT TICKET
            </h2>
          </div>

          {ticketSubmitted ? (
            <div className="bg-[#00ffff]/10 border border-[#00ffff] p-6 chamfer-corner text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#00ffff] mx-auto animate-bounce" />
              <h3 className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase">
                TRANSMISSION ACKNOWLEDGED
              </h3>
              <p className="text-xs text-[#839493]">
                Your neural ticket has been dispatched to Benthic Engineering Units. Response expected within 12 fathoms.
              </p>
            </div>
          ) : (
            <form onSubmit={handleTicketSubmit} className="space-y-4 max-w-2xl">
              <div className="space-y-1">
                <label className="text-xs text-[#839493] font-bold block uppercase">
                  TICKET SUBJECT / SYMPTOM
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Carapace torque synchronization latency"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] p-2.5 outline-none chamfer-corner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[#839493] font-bold block uppercase">
                    CATEGORY
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] p-2.5 outline-none chamfer-corner"
                  >
                    <option value="SHELL_INTEGRITY">SHELL / CHASSIS INTEGRITY</option>
                    <option value="NEON_AUTH">NEON AUTH & SESSION</option>
                    <option value="MARKET_TRANSMUTATION">MARKET & CREDITS</option>
                    <option value="OTHER">GENERAL INQUIRY</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#839493] font-bold block uppercase">
                    URGENCY LEVEL
                  </label>
                  <select className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] p-2.5 outline-none chamfer-corner">
                    <option value="NORMAL">NOMINAL (48 HOURS)</option>
                    <option value="HIGH">HIGH PRESSURE (12 HOURS)</option>
                    <option value="CRITICAL">CRITICAL BREACH (IMMEDIATE)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#839493] font-bold block uppercase">
                  DETAILED TELEMETRY / LOGS
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the issue or paste relevant error readouts..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] p-2.5 outline-none chamfer-corner resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 border border-[#00ffff] text-[#00ffff] font-bold text-xs flex items-center gap-2 chamfer-corner transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)] active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>DISPATCH NEURAL TICKET</span>
              </button>

              <TurnstileWidget
                ref={turnstileRef}
                action="support_ticket"
                size="flexible"
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
              />
            </form>
          )}
        </div>
      )}

      {/* TAB 4: SYSTEM DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="chitin-card p-5 chamfer-corner space-y-4">
          <div className="flex items-center gap-2 border-b border-[#3a4a49] pb-3">
            <Activity className="w-5 h-5 text-[#00ffff]" />
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
              REAL-TIME INFRASTRUCTURE TELEMETRY
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="chitin-card-inset p-3 chamfer-corner space-y-1">
              <span className="text-[10px] text-[#839493] uppercase font-bold">NEON POSTGRES ORM</span>
              <div className="text-sm font-bold text-[#00ffff] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#00ffff]" />
                <span>OPERATIONAL</span>
              </div>
            </div>

            <div className="chitin-card-inset p-3 chamfer-corner space-y-1">
              <span className="text-[10px] text-[#839493] uppercase font-bold">NEON MANAGED AUTH</span>
              <div className="text-sm font-bold text-[#00ffff] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00ffff]" />
                <span>HEALTHY (JWKS)</span>
              </div>
            </div>

            <div className="chitin-card-inset p-3 chamfer-corner space-y-1">
              <span className="text-[10px] text-[#839493] uppercase font-bold">TANSTACK START SSR</span>
              <div className="text-sm font-bold text-[#00ffff] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#00ffff]" />
                <span>NITRO SERVER</span>
              </div>
            </div>

            <div className="chitin-card-inset p-3 chamfer-corner space-y-1">
              <span className="text-[10px] text-[#839493] uppercase font-bold">SUBMERGENCE PRESSURE</span>
              <div className="text-sm font-bold text-[#ff5540] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#ff5540]" />
                <span>3,400 FATHOMS</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_hud/support')({
  loader: async () => {
    try {
      const data = await getPublicChangelogs()
      return { changelogs: Array.isArray(data) ? data : [] }
    } catch (err) {
      console.error('[Support Route Loader] Failed fetching changelogs:', err)
      return { changelogs: [] }
    }
  },
  component: SupportPortalRoute,
  pendingComponent: HudWorkspaceGhost,
  head: () => ({
    meta: seo({ title: 'Benthic Support Portal & System Changelog | Moltology' }),
  }),
})
