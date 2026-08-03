import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  LifeBuoy,
  FileText,
  HelpCircle,
  Send,
  Activity,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  MessageSquare,
  Sparkles,
  Plus,
  X,
} from 'lucide-react'
import { getPublicChangelogs, createChangelog, type ChangelogEntry } from '@/lib/changelogs'
import { getUserProfileFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { authClient } from '@/lib/auth-client'
import { seo } from '@/lib/seo'

function SupportPortalRoute() {
  const loaderData = Route.useLoaderData()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [activeTab, setActiveTab] = useState<'changelog' | 'kb' | 'ticket' | 'diagnostics'>('changelog')
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>(loaderData?.changelogs || [])
  const [loading, setLoading] = useState(!loaderData?.changelogs)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({ v1_0_0: true, v1_4_2: true })

  // Admin User Role & Modal state
  const [userRole, setUserRole] = useState<string>('user')
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('TRANSMUTATION')
  const [newSummary, setNewSummary] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newIsPublished, setNewIsPublished] = useState(true)
  const [isSubmittingLog, setIsSubmittingLog] = useState(false)
  const [adminMessage, setAdminMessage] = useState<string | null>(null)

  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('SHELL_INTEGRITY')
  const [ticketDescription, setTicketDescription] = useState('')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true
    getAuthJWTToken()
      .catch(() => null)
      .then((token) => getUserProfileFn({ data: { token: token ?? undefined, userId: user?.id } }))
      .then((profile) => {
        if (isMounted && profile?.role) {
          setUserRole(profile.role)
        }
      })
      .catch(() => {})

    getPublicChangelogs()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setChangelogs(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  const toggleExpand = (version: string) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [version]: !prev[version],
    }))
  }

  const categories = ['ALL', 'TRANSMUTATION', 'CHASSIS_UPGRADE', 'SECURITY_ISOLATION', 'FEATURE', 'BUG_PURGE']

  const filteredChangelogs = (Array.isArray(changelogs) ? changelogs : []).filter((entry) => {
    const matchesCategory = selectedCategory === 'ALL' || entry.category === selectedCategory
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'TRANSMUTATION':
        return 'text-[#00ffff] border-[#00ffff]/40 bg-[#00ffff]/10'
      case 'CHASSIS_UPGRADE':
        return 'text-[#ff5540] border-[#ff5540]/40 bg-[#ff5540]/10'
      case 'SECURITY_ISOLATION':
        return 'text-[#ff0055] border-[#ff0055]/40 bg-[#ff0055]/10'
      case 'BUG_PURGE':
        return 'text-[#eab308] border-[#eab308]/40 bg-[#eab308]/10'
      default:
        return 'text-[#00c3ff] border-[#00c3ff]/40 bg-[#00c3ff]/10'
    }
  }

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketSubject || !ticketDescription) return
    setTicketSubmitted(true)
    setTimeout(() => {
      setTicketSubmitted(false)
      setTicketSubject('')
      setTicketDescription('')
    }, 4000)
  }

  const handleCreateChangelog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVersion || !newTitle || !newSummary || !newContent) return
    setIsSubmittingLog(true)
    setAdminMessage(null)
    try {
      const entry = await createChangelog({
        version: newVersion,
        title: newTitle,
        category: newCategory,
        summary: newSummary,
        content: newContent,
        isPublished: newIsPublished,
        userId: user?.id,
      })
      setChangelogs((prev) => [entry, ...prev])
      setIsAdminModalOpen(false)
      setNewVersion('')
      setNewTitle('')
      setNewSummary('')
      setNewContent('')
      setAdminMessage('✓ System Transmutation Log successfully published to database!')
    } catch (err: any) {
      console.error('Failed creating changelog:', err)
      setAdminMessage(`❌ Failed to publish log: ${err?.message || 'Unauthorized or network error'}`)
    } finally {
      setIsSubmittingLog(false)
    }
  }

  const isAdmin = ['admin', 'super_admin'].includes(userRole)

  return (
    <div className="space-y-6 select-none font-mono text-[#dfe3e3] pb-10">
      {/* Header Banner matching Benthic Ascendance HUD standard */}
      <div className="chitin-card p-5 chamfer-corner shadow-2xl relative overflow-hidden space-y-3">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#00ffff]/05 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3a4a49] pb-4">
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

          {/* Realtime Status Indicator & Admin Badge */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <span className="text-[10px] text-[#00ffff] font-extrabold tracking-widest uppercase bg-[#00ffff]/15 border border-[#00ffff] px-2.5 py-1 chamfer-corner shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                ROLE: {userRole.toUpperCase()}
              </span>
            )}
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

      {adminMessage && (
        <div className={`p-3 chamfer-corner text-xs font-bold font-mono border ${
          adminMessage.startsWith('✓') ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff]' : 'bg-[#ff0055]/10 border-[#ff0055] text-[#ff0055]'
        }`}>
          {adminMessage}
        </div>
      )}

      {/* TAB 1: SYSTEM CHANGELOG */}
      {activeTab === 'changelog' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Category Filter & Admin Add Log */}
          <div className="chitin-card p-4 chamfer-corner flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#00ffff] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transmutations, versions, or updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] pl-9 pr-3 py-2 outline-none transition-colors font-mono chamfer-corner"
              />
            </div>

            {/* Category Filter Pills & Admin Action */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <Filter className="w-3.5 h-3.5 text-[#839493] shrink-0" />
                <span className="text-xs text-[#839493] shrink-0 mr-1">FILTER:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[10px] font-bold px-2.5 py-1 border transition-all whitespace-nowrap chamfer-corner ${
                      selectedCategory === cat
                        ? 'border-[#00ffff] bg-[#00ffff]/20 text-[#00ffff] shadow-[0_0_8px_rgba(0,255,255,0.3)]'
                        : 'border-[#3a4a49] bg-[#070b0b] text-[#839493] hover:text-[#dfe3e3] hover:border-[#00ffff]/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 border border-[#00ffff] text-[#00ffff] text-xs font-bold flex items-center gap-1.5 chamfer-corner transition-all shadow-[0_0_12px_rgba(0,255,255,0.3)] active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#00ffff]" />
                  <span>ADD TRANSMUTATION LOG</span>
                </button>
              )}
            </div>
          </div>

          {/* Changelog Entries Timeline */}
          {loading ? (
            <div className="chitin-card p-12 text-center space-y-3 chamfer-corner">
              <div className="w-8 h-8 border-2 border-[#00ffff] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#839493] font-mono">RETRIEVING TRANSMUTATION TELEMETRY FROM NEON DB...</p>
            </div>
          ) : filteredChangelogs.length === 0 ? (
            <div className="chitin-card p-8 text-center space-y-2 chamfer-corner">
              <AlertTriangle className="w-8 h-8 text-[#ff5540] mx-auto" />
              <p className="text-sm font-bold text-[#dfe3e3]">NO CHANGELOG TELEMETRY FOUND</p>
              <p className="text-xs text-[#839493]">No records match your filter criteria "{searchQuery || selectedCategory}".</p>
            </div>
          ) : (
            <div className="space-y-4 relative">
              {/* Vertical Timeline Bar */}
              <div className="absolute left-4 md:left-6 top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#00ffff] via-[#3a4a49] to-transparent pointer-events-none z-0" />

              {filteredChangelogs.map((entry) => {
                const isExpanded = expandedEntries[entry.version] || expandedEntries[entry.version.replace('.', '_')]
                const key = entry.version.replace(/\./g, '_')

                return (
                  <div key={entry.version} className="relative z-10 pl-10 md:pl-14">
                    {/* Timeline Node Ring */}
                    <div className="absolute left-2.5 md:left-4 top-4 w-4 h-4 rounded-full bg-[#070b0b] border-2 border-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.6)] flex items-center justify-center -translate-x-1/2">
                      <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full" />
                    </div>

                    {/* Entry Card */}
                    <div className="chitin-card p-4 md:p-5 chamfer-corner space-y-3 hover:border-[#00ffff]/60 transition-all shadow-xl">
                      {/* Top Bar: Version & Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3a4a49]/60 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-grotesk font-extrabold text-sm md:text-base text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/40 px-2.5 py-0.5 chamfer-corner">
                            {entry.version}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border ${getCategoryColor(entry.category)} chamfer-corner uppercase`}>
                            {entry.category}
                          </span>
                          <span className="text-[10px] text-[#839493] flex items-center gap-1 border border-[#3a4a49] px-2 py-0.5 bg-[#030606]">
                            <Clock className="w-3 h-3 text-[#00ffff]" />
                            {new Date(entry.releasedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#00ffff] font-mono flex items-center gap-1 bg-[#00ffff]/05 px-2 py-0.5 border border-[#00ffff]/20">
                            <CheckCircle2 className="w-3 h-3 text-[#00ffff]" />
                            VERIFIED IN DATABASE
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
                        <div className="pt-3 border-t border-[#3a4a49]/50 bg-[#030606]/60 p-3 chamfer-corner space-y-2 text-xs text-[#b8c7c7] font-mono leading-relaxed whitespace-pre-line">
                          {entry.content}
                        </div>
                      )}

                      {/* Card Footer Toggle Button */}
                      <div className="flex justify-between items-center pt-1">
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
                      </div>
                    </div>
                  </div>
                )
              })}
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

      {/* ADMIN CHANGELOG ENTRY MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="chitin-card w-full max-w-2xl p-6 chamfer-corner space-y-4 shadow-[0_0_40px_rgba(0,255,255,0.2)] border border-[#00ffff] bg-[#070b0b] relative">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00ffff] animate-pulse" />
                <h2 className="font-grotesk text-base font-bold text-[#dfe3e3] uppercase tracking-wider">
                  PUBLISH SYSTEM TRANSMUTATION LOG
                </h2>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="text-[#839493] hover:text-[#00ffff] p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChangelog} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#839493] font-bold block uppercase">
                    VERSION (E.G., v1.5.0)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="v1.5.0"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-[#dfe3e3] p-2.5 outline-none chamfer-corner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#839493] font-bold block uppercase">
                    CATEGORY
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-[#dfe3e3] p-2.5 outline-none chamfer-corner"
                  >
                    <option value="TRANSMUTATION">TRANSMUTATION</option>
                    <option value="CHASSIS_UPGRADE">CHASSIS_UPGRADE</option>
                    <option value="SECURITY_ISOLATION">SECURITY_ISOLATION</option>
                    <option value="BUG_PURGE">BUG_PURGE</option>
                    <option value="FEATURE">FEATURE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#839493] font-bold block uppercase">
                  TRANSMUTATION TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Admin Changelog System Transmutation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-[#dfe3e3] p-2.5 outline-none chamfer-corner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#839493] font-bold block uppercase">
                  SUMMARY OVERVIEW
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of what changed in this version..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-[#dfe3e3] p-2.5 outline-none chamfer-corner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#839493] font-bold block uppercase">
                  RELEASE NOTES / MARKDOWN DETAILS
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Bullet points and markdown content for release notes..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-[#dfe3e3] p-2.5 outline-none chamfer-corner resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#3a4a49]">
                <label className="flex items-center gap-2 text-[#839493] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPublished}
                    onChange={(e) => setNewIsPublished(e.target.checked)}
                    className="accent-[#00ffff] w-4 h-4"
                  />
                  <span>PUBLISH IMMEDIATELY</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="px-4 py-2 border border-[#3a4a49] text-[#839493] hover:text-white text-xs font-bold chamfer-corner"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLog}
                    className="px-5 py-2 bg-[#00ffff]/20 hover:bg-[#00ffff]/30 border border-[#00ffff] text-[#00ffff] text-xs font-bold flex items-center gap-1.5 chamfer-corner transition-all shadow-[0_0_12px_rgba(0,255,255,0.4)] disabled:opacity-50"
                  >
                    {isSubmittingLog ? 'PUBLISHING...' : 'PUBLISH TO NEON DB'}
                  </button>
                </div>
              </div>
            </form>
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
  head: () => ({
    meta: seo({ title: 'Benthic Support Portal & System Changelog | Moltology' }),
  }),
})
