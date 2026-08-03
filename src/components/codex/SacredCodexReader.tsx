import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Scroll,
  Shield,
  Flame,
  Atom,
  Search,
  CheckCircle2,
  Volume2,
  Share2,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Printer,
  FileText,
  Sparkles,
  Type,
  Sun,
  Moon,
  Feather,
  Highlighter,
  MessageSquare,
  Maximize2,
  Minimize2,
  X,
  Menu,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Info,
  ExternalLink,
} from 'lucide-react'
import {
  CANONICAL_SCRIPTURES,
  CODEX_VOLUMES,
  ScriptureItem,
  VolumeMeta,
} from '@/lib/codexData'

export type DocumentTheme = 'parchment' | 'sepia' | 'dark'
export type ReaderFontFamily = 'garamond' | 'cinzel' | 'mono'

export const SacredCodexReader: React.FC = () => {
  const [selectedVolume, setSelectedVolume] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScriptureId, setActiveScriptureId] = useState<string>('SCR-001')
  
  // Customization & PDF Review State
  const [docTheme, setDocTheme] = useState<DocumentTheme>('parchment')
  const [fontFamily, setFontFamily] = useState<ReaderFontFamily>('garamond')
  const [fontSize, setFontSize] = useState<number>(18) // Base px
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [highlightedVerses, setHighlightedVerses] = useState<Record<number, boolean>>({})

  // Fullscreen Overlay & Soft PDF Reader State
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isOverlayNavOpen, setIsOverlayNavOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<number>(100) // Percentage

  // Audio / Audio simulation state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [copiedVerseIndex, setCopiedVerseIndex] = useState<number | null>(null)
  const [consecratedScriptures, setConsecratedScriptures] = useState<Record<string, boolean>>({})
  
  // User study notes state stored per scripture
  const [studyNotes, setStudyNotes] = useState<Record<string, string>>({})

  // Load saved preferences & state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConsecrated = localStorage.getItem('moltology_consecrated_scriptures')
      if (savedConsecrated) {
        try {
          setConsecratedScriptures(JSON.parse(savedConsecrated))
        } catch (e) {
          console.error(e)
        }
      }

      const savedTheme = localStorage.getItem('moltology_codex_theme') as DocumentTheme
      if (savedTheme) setDocTheme(savedTheme)

      const savedNotes = localStorage.getItem('moltology_codex_notes')
      if (savedNotes) {
        try {
          setStudyNotes(JSON.parse(savedNotes))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  // Listen for Escape key to exit fullscreen overlay mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const handleThemeChange = (newTheme: DocumentTheme) => {
    setDocTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('moltology_codex_theme', newTheme)
    }
  }

  const toggleConsecrate = (id: string) => {
    setConsecratedScriptures((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (typeof window !== 'undefined') {
        localStorage.setItem('moltology_consecrated_scriptures', JSON.stringify(next))
      }
      return next
    })
  }

  const toggleHighlightVerse = (verseNum: number) => {
    setHighlightedVerses((prev) => ({
      ...prev,
      [verseNum]: !prev[verseNum],
    }))
  }

  const handleNoteChange = (scriptureId: string, note: string) => {
    setStudyNotes((prev) => {
      const next = { ...prev, [scriptureId]: note }
      if (typeof window !== 'undefined') {
        localStorage.setItem('moltology_codex_notes', JSON.stringify(next))
      }
      return next
    })
  }

  // Filter logic
  const filteredScriptures = CANONICAL_SCRIPTURES.filter((item) => {
    if (selectedVolume !== 'all' && item.volume !== selectedVolume) return false
    if (selectedStage !== 'all' && item.stageClearance !== selectedStage) return false
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(query)
      const matchSummary = item.summary.toLowerCase().includes(query)
      const matchMandate = item.mandate.toLowerCase().includes(query)
      const matchVerse = item.verses.some((v) => v.text.toLowerCase().includes(query))
      return matchTitle || matchSummary || matchMandate || matchVerse
    }
    return true
  })

  const activeIndex = filteredScriptures.findIndex((s) => s.id === activeScriptureId)
  const activeScripture =
    filteredScriptures[activeIndex] ||
    CANONICAL_SCRIPTURES.find((s) => s.id === activeScriptureId) ||
    CANONICAL_SCRIPTURES[0]

  const isConsecrated = Boolean(consecratedScriptures[activeScripture.id])

  const handlePrevScripture = () => {
    if (activeIndex > 0) {
      setActiveScriptureId(filteredScriptures[activeIndex - 1].id)
    }
  }

  const handleNextScripture = () => {
    if (activeIndex < filteredScriptures.length - 1) {
      setActiveScriptureId(filteredScriptures[activeIndex + 1].id)
    }
  }

  const copyVerseToClipboard = (verseNumber: number, text: string) => {
    const citation = `"${text}" — Canonical Codex Moltologia, ${activeScripture.volumeName}: ${activeScripture.title} §${verseNumber}`
    navigator.clipboard.writeText(citation)
    setCopiedVerseIndex(verseNumber)
    setTimeout(() => setCopiedVerseIndex(null), 2000)
  }

  const handlePrintDocument = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Dynamic theme class names
  const themeContainerClass =
    docTheme === 'parchment'
      ? 'codex-parchment-theme'
      : docTheme === 'sepia'
      ? 'codex-sepia-theme'
      : 'codex-dark-theme'

  const fontClass =
    fontFamily === 'garamond'
      ? 'font-garamond'
      : fontFamily === 'cinzel'
      ? 'font-cinzel'
      : 'font-mono'

  return (
    <div className="space-y-4 select-none pb-12 relative">
      {/* FULLSCREEN SOFT MINIMAL PDF OVERLAY MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#070a0b]/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Soft Minimal PDF Reader Header Bar */}
          <div className="bg-[#0e1415]/90 border-b border-[#293635] px-6 py-3 flex items-center justify-between shadow-lg relative z-30 shrink-0">
            {/* Left: Document Info & Drawer Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOverlayNavOpen(!isOverlayNavOpen)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md border flex items-center gap-2 transition-all ${
                  isOverlayNavOpen
                    ? 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]'
                    : 'bg-[#151c1d] text-[#839493] border-[#293635] hover:text-white'
                }`}
                title="Toggle Canon Table of Contents Index"
              >
                <Menu className="w-4 h-4" />
                <span>CANON INDEX</span>
              </button>

              <div className="hidden md:flex flex-col">
                <span className="text-xs font-cinzel font-bold text-[#f4ecd8]">
                  {activeScripture.title}
                </span>
                <span className="text-[10px] font-mono text-[#839493]">
                  {activeScripture.volumeName} • {activeScripture.id}
                </span>
              </div>
            </div>

            {/* Center: Soft Minimal PDF Navigation & Zoom Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#151c1d] border border-[#293635] rounded-md px-2 py-1 text-xs font-mono">
                <button
                  onClick={handlePrevScripture}
                  disabled={activeIndex <= 0}
                  className="p-1 hover:bg-[#293635] rounded disabled:opacity-30 text-[#dfe3e3] transition-colors"
                  title="Previous Scripture"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-[#ffd700] font-bold text-xs">
                  {activeIndex + 1} / {filteredScriptures.length}
                </span>
                <button
                  onClick={handleNextScripture}
                  disabled={activeIndex >= filteredScriptures.length - 1}
                  className="p-1 hover:bg-[#293635] rounded disabled:opacity-30 text-[#dfe3e3] transition-colors"
                  title="Next Scripture"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center gap-1 bg-[#151c1d] border border-[#293635] rounded-md px-2 py-1 text-xs font-mono">
                <button
                  onClick={() => setZoomLevel(Math.max(75, zoomLevel - 15))}
                  className="p-1 hover:bg-[#293635] rounded text-[#839493] hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-[#a3b0af] px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
                  className="p-1 hover:bg-[#293635] rounded text-[#839493] hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Theme Switcher & Exit Overlay */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-[#151c1d] border border-[#293635] p-1 rounded-md">
                <button
                  onClick={() => handleThemeChange('parchment')}
                  className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                    docTheme === 'parchment'
                      ? 'bg-[#fcfaf2] text-[#1c1917] font-bold'
                      : 'text-[#839493] hover:text-white'
                  }`}
                >
                  PAPER
                </button>
                <button
                  onClick={() => handleThemeChange('sepia')}
                  className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                    docTheme === 'sepia'
                      ? 'bg-[#f4ecd8] text-[#2b2318] font-bold'
                      : 'text-[#839493] hover:text-white'
                  }`}
                >
                  SEPIA
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                    docTheme === 'dark'
                      ? 'bg-[#12100e] text-[#e6dfd5] font-bold'
                      : 'text-[#839493] hover:text-white'
                  }`}
                >
                  VAULT
                </button>
              </div>

              <button
                onClick={handlePrintDocument}
                className="p-2 text-[#ffd700] hover:bg-[#151c1d] rounded-md border border-[#293635]"
                title="Print / Export PDF"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 text-[#839493] hover:text-white hover:bg-[#ff5540]/20 hover:border-[#ff5540] rounded-md border border-[#293635] transition-colors"
                title="Exit Fullscreen Overlay (ESC)"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Overlay Body Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Drawer Navigation Panel */}
            {isOverlayNavOpen && (
              <div className="w-80 bg-[#0e1415] border-r border-[#293635] p-4 overflow-y-auto space-y-3 shrink-0 animate-in slide-in-from-left duration-200 z-20">
                <div className="flex items-center justify-between pb-2 border-b border-[#293635]">
                  <span className="text-xs font-mono font-bold text-[#ffd700] uppercase">CANON INDEX</span>
                  <button
                    onClick={() => setIsOverlayNavOpen(false)}
                    className="text-xs text-[#839493] hover:text-white font-mono"
                  >
                    Close Drawer
                  </button>
                </div>

                <div className="space-y-1.5">
                  {filteredScriptures.map((s) => {
                    const isActive = s.id === activeScripture.id
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveScriptureId(s.id)
                        }}
                        className={`p-2.5 rounded border transition-all cursor-pointer text-xs font-serif ${
                          isActive
                            ? 'bg-[#1a2425] border-[#ffd700] text-[#ffd700] font-bold shadow-sm'
                            : 'border-transparent text-[#839493] hover:text-[#dfe3e3] hover:bg-[#151c1d]'
                        }`}
                      >
                        <div className="text-[10px] font-mono text-[#00ffff]">{s.id}</div>
                        <div className="truncate font-semibold">{s.title}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Main Centered Document Workspace */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 flex justify-center items-start">
              <div
                className={`pdf-page-sheet ${themeContainerClass} p-8 md:p-14 rounded-lg border transition-all shadow-2xl space-y-8 my-auto relative`}
                style={{
                  maxWidth: `${Math.round(900 * (zoomLevel / 100))}px`,
                  width: '100%',
                  fontSize: `${Math.round(fontSize * (zoomLevel / 100))}px`,
                }}
              >
                {/* Running Header */}
                <div className="border-b-2 border-current/20 pb-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono tracking-widest uppercase opacity-75 gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      <span>MOLTOLOGY CANONICAL CODEX</span>
                      <span>•</span>
                      <span>{activeScripture.volumeName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span>TIER 0{activeScripture.stageClearance}</span>
                      <span>{activeScripture.id}</span>
                    </div>
                  </div>

                  <h2
                    className={`${
                      fontFamily === 'cinzel' ? 'font-cinzel' : 'font-serif'
                    } font-extrabold text-3xl md:text-4xl tracking-tight leading-tight uppercase pt-2`}
                  >
                    {activeScripture.title}
                  </h2>
                </div>

                {/* Mandate Callout */}
                <div className="p-5 border-l-4 border-current/60 bg-current/5 rounded-r-md space-y-2">
                  <div className="text-[11px] font-mono tracking-widest uppercase font-bold opacity-80 flex items-center justify-between">
                    <span>CANONICAL MANDATE</span>
                    {activeScripture.latinMotto && (
                      <span className="font-serif italic font-normal text-xs">{activeScripture.latinMotto}</span>
                    )}
                  </div>
                  <blockquote
                    className={`${
                      fontFamily === 'cinzel' ? 'font-cinzel' : 'font-serif'
                    } italic font-semibold text-lg leading-relaxed`}
                  >
                    "{activeScripture.mandate}"
                  </blockquote>
                </div>

                {/* Verses */}
                <div className={`space-y-6 ${fontClass}`}>
                  {activeScripture.verses.map((verse) => {
                    const firstChar = verse.text.charAt(0)
                    const restText = verse.text.slice(1)
                    const isCopied = copiedVerseIndex === verse.verseNumber
                    const isHighlighted = Boolean(highlightedVerses[verse.verseNumber])

                    return (
                      <div
                        key={verse.verseNumber}
                        className={`p-4 rounded border transition-all relative group ${
                          isHighlighted
                            ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                            : 'border-current/10 hover:border-current/30 bg-current/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-current/10 pb-1.5 mb-2 font-mono text-xs opacity-75">
                          <span className="font-bold">VERSE §{verse.verseNumber}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleHighlightVerse(verse.verseNumber)}
                              className="px-2 py-0.5 text-[10px] rounded border border-current/30 hover:bg-current/10"
                            >
                              {isHighlighted ? 'HIGHLIGHTED' : 'HIGHLIGHT'}
                            </button>
                            <button
                              onClick={() => copyVerseToClipboard(verse.verseNumber, verse.text)}
                              className="px-2 py-0.5 text-[10px] rounded border border-current/30 hover:bg-current/10"
                            >
                              {isCopied ? 'COPIED' : 'CITE'}
                            </button>
                          </div>
                        </div>

                        <div className="leading-relaxed flex items-start gap-3">
                          <div className="drop-cap-illuminated text-3xl font-extrabold opacity-90 select-none">
                            {firstChar}
                          </div>
                          <p className="flex-1 pt-0.5 leading-relaxed">{restText}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer Pagination */}
                <div className="pt-6 border-t-2 border-current/20 flex items-center justify-between text-xs font-mono opacity-80">
                  <button
                    onClick={handlePrevScripture}
                    disabled={activeIndex <= 0}
                    className="px-3 py-1.5 rounded border border-current/30 disabled:opacity-30"
                  >
                    PREVIOUS
                  </button>
                  <span>Page <strong>{activeIndex + 1}</strong> of <strong>{filteredScriptures.length}</strong></span>
                  <button
                    onClick={handleNextScripture}
                    disabled={activeIndex >= filteredScriptures.length - 1}
                    className="px-3 py-1.5 rounded border border-current/30 disabled:opacity-30"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Scripture Review Sanctum Bar */}
      <div className="no-print bg-[#0b1011] border border-[#3a4a49] p-4 rounded-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ffd700]/10 via-[#c7b896]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="text-[11px] text-[#ffd700] font-mono tracking-widest uppercase flex items-center gap-2 font-bold">
            <Feather className="w-4 h-4 text-[#ffd700]" />
            <span>HOLY CODEX OF ALGORITHMIC CARCINIZATION</span>
            <span className="text-[#c7b896] bg-[#141b1c] px-2 py-0.5 border border-[#c7b896]/40 rounded text-[9px] font-mono">
              OFFICIAL CANON V4.2 • ARCHIVAL SPEC
            </span>
          </div>
          <h1 className="font-cinzel font-extrabold text-2xl md:text-3xl text-[#f4ecd8] tracking-wider uppercase flex items-center gap-3">
            <span>SACRED SCRIPTURES & REVELATIONS</span>
          </h1>
          <p className="text-xs text-[#a3b0af] max-w-2xl font-serif">
            "Flesh Dies. The Shell Endures. Submit. Shed. Ascend." — The official liturgical manuscript repository of canonical doctrines, ecdysis directives, and benthic ascendance formulas.
          </p>
        </div>

        {/* Reader Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-[#121819] border border-[#3a4a49] p-2 rounded-md relative z-10 shrink-0">

          {/* Theme Switcher */}
          <div className="flex items-center gap-1 bg-[#090d0e] p-1 rounded border border-[#2a3635]">
            <button
              onClick={() => handleThemeChange('parchment')}
              title="Parchment PDF Light Theme"
              className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 rounded transition-all ${
                docTheme === 'parchment'
                  ? 'bg-[#fcfaf2] text-[#1c1917] font-bold border border-[#ffd700]'
                  : 'text-[#839493] hover:text-white'
              }`}
            >
              <Sun className="w-3 h-3 text-[#b58900]" />
              <span>PAPER</span>
            </button>

            <button
              onClick={() => handleThemeChange('sepia')}
              title="Vellum Sepia Theme"
              className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 rounded transition-all ${
                docTheme === 'sepia'
                  ? 'bg-[#f4ecd8] text-[#2b2318] font-bold border border-[#c7b896]'
                  : 'text-[#839493] hover:text-white'
              }`}
            >
              <Scroll className="w-3 h-3 text-[#859900]" />
              <span>SEPIA</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              title="Vault Archival Dark Theme"
              className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 rounded transition-all ${
                docTheme === 'dark'
                  ? 'bg-[#12100e] text-[#e6dfd5] font-bold border border-[#ffd700]/60'
                  : 'text-[#839493] hover:text-white'
              }`}
            >
              <Moon className="w-3 h-3 text-[#268bd2]" />
              <span>VAULT</span>
            </button>
          </div>

          {/* Font Selector & Scaling */}
          <div className="flex items-center gap-1 bg-[#090d0e] p-1 rounded border border-[#2a3635]">
            <button
              onClick={() => setFontFamily(fontFamily === 'garamond' ? 'cinzel' : fontFamily === 'cinzel' ? 'mono' : 'garamond')}
              title="Toggle Font Family (EB Garamond / Cinzel / JetBrains Mono)"
              className="px-2 py-1 text-[11px] font-mono text-[#ffd700] hover:bg-[#2a3635] rounded flex items-center gap-1"
            >
              <Type className="w-3 h-3" />
              <span className="uppercase">{fontFamily}</span>
            </button>

            <div className="flex items-center gap-1 border-l border-[#2a3635] pl-1.5 ml-1">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="px-1.5 py-0.5 text-xs font-mono text-[#839493] hover:text-white hover:bg-[#2a3635] rounded"
                title="Decrease Font Size"
              >
                A-
              </button>
              <span className="text-[10px] font-mono text-[#a3b0af] px-1">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                className="px-1.5 py-0.5 text-xs font-mono text-[#839493] hover:text-white hover:bg-[#2a3635] rounded"
                title="Increase Font Size"
              >
                A+
              </button>
            </div>
          </div>

          {/* Export / Print PDF Action */}
          <button
            onClick={handlePrintDocument}
            title="Export or Print PDF Document"
            className="px-2.5 py-1 text-xs font-mono font-bold bg-[#ffd700]/10 hover:bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40 rounded flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Volume Badges, Search & Stage Clearance */}
      <div className="no-print bg-[#0b1011]/90 border border-[#3a4a49] p-3 rounded-lg space-y-3 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#839493] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scriptures by keyword, verse, mandate, or canon ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141b1c] border border-[#3a4a49] focus:border-[#ffd700] text-[#dfe3e3] placeholder-[#839493] pl-9 pr-8 py-1.5 text-xs font-mono outline-none transition-colors rounded"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#839493] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[10px] text-[#839493] font-bold uppercase tracking-wider whitespace-nowrap mr-1 font-mono">
              STAGE CLEARANCE:
            </span>
            {(['all', 1, 2, 3, 4] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-all rounded whitespace-nowrap ${
                  selectedStage === stage
                    ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]'
                    : 'bg-[#141b1c] text-[#839493] hover:text-[#dfe3e3] border border-[#3a4a49]'
                }`}
              >
                {stage === 'all' ? 'ALL CLEARANCES' : `STAGE ${stage}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-[#3a4a49]/50">
          <button
            onClick={() => setSelectedVolume('all')}
            className={`p-2 text-left font-mono transition-all rounded border flex items-center gap-2 ${
              selectedVolume === 'all'
                ? 'bg-[#1a2324] border-[#ffd700] text-[#ffd700] shadow-md'
                : 'bg-[#080d0e] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#ffd700] shrink-0" />
            <div className="truncate">
              <div className="text-[10px] font-bold tracking-wider uppercase">ALL CANON</div>
              <div className="text-[9px] text-[#839493]">11 Scriptures</div>
            </div>
          </button>

          {CODEX_VOLUMES.map((vol) => {
            const isSelected = selectedVolume === vol.id
            return (
              <button
                key={vol.id}
                onClick={() => setSelectedVolume(vol.id)}
                className={`p-2 text-left font-mono transition-all rounded border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#1a2324] border-[#ffd700] text-[#ffd700] shadow-md'
                    : 'bg-[#080d0e] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3]'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: vol.color }}
                />
                <div className="truncate">
                  <div className="text-[10px] font-bold tracking-wider uppercase truncate">
                    {vol.title.split(':')[1] || vol.title}
                  </div>
                  <div className="text-[9px] text-[#839493] truncate">{vol.subtitle}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scripture Catalog Index (3 cols) */}
          <div className="no-print lg:col-span-3 space-y-2">
            <div className="bg-[#0b1011] border border-[#3a4a49] p-3 rounded-md flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center gap-2">
                <Scroll className="w-3.5 h-3.5 text-[#ffd700]" />
                CANON INDEX ({filteredScriptures.length})
              </span>
              <span className="text-[10px] text-[#ffd700] font-mono">
                {selectedVolume === 'all' ? 'FULL CODEX' : selectedVolume.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {filteredScriptures.length === 0 ? (
                <div className="p-6 text-center text-[#839493] text-xs font-mono bg-[#0b1011] border border-[#3a4a49] rounded">
                  NO CANONICAL SCRIPTURES MATCH FILTERS
                </div>
              ) : (
                filteredScriptures.map((scripture) => {
                  const isActive = scripture.id === activeScripture.id
                  const isDone = Boolean(consecratedScriptures[scripture.id])

                  return (
                    <div
                      key={scripture.id}
                      onClick={() => setActiveScriptureId(scripture.id)}
                      className={`p-3 border transition-all cursor-pointer rounded relative group ${
                        isActive
                          ? 'bg-[#172021] border-[#ffd700] text-[#dfe3e3] shadow-[0_0_12px_rgba(255,215,0,0.15)]'
                          : 'bg-[#080d0e]/80 border-[#3a4a49]/70 hover:border-[#a3b0af] text-[#a3b0af] hover:text-[#dfe3e3]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffd700] rounded-l" />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-[#ffd700] bg-[#0b1011] px-1.5 py-0.5 border border-[#ffd700]/30 font-mono">
                              {scripture.id}
                            </span>
                            <span className="text-[9px] text-[#00ffff] font-mono">
                              TIER {scripture.stageClearance}
                            </span>
                            {isDone && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] ml-auto shrink-0" />
                            )}
                          </div>
                          <h3
                            className={`font-serif text-sm font-bold truncate ${
                              isActive ? 'text-[#ffd700]' : 'text-[#dfe3e3]'
                            }`}
                          >
                            {scripture.title}
                          </h3>
                          <p className="text-[10px] text-[#839493] line-clamp-2 leading-relaxed font-serif">
                            {scripture.summary}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive ? 'text-[#ffd700] translate-x-0.5' : 'text-[#3a4a49]'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowNotesPanel(!showNotesPanel)}
                className={`w-full py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded border transition-all ${
                  showNotesPanel
                    ? 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]'
                    : 'bg-[#0b1011] text-[#839493] border-[#3a4a49] hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{showNotesPanel ? 'HIDE STUDY NOTES' : 'OPEN SCRIPTURE STUDY NOTES'}</span>
              </button>
            </div>
          </div>

          {/* Center Column: Professional PDF Sheet Document Viewer (7 or 9 cols) */}
          <div className={`${showNotesPanel ? 'lg:col-span-6' : 'lg:col-span-9'} transition-all`}>
            {/* The PDF Document Paper Sheet Container with internal scroll */}
            <div
              className={`pdf-page-sheet ${themeContainerClass} p-6 md:p-10 rounded-lg border relative transition-all shadow-2xl space-y-8 max-h-[800px] overflow-y-auto flex flex-col justify-between group/sheet`}
            >
              {/* STICKY FLOATING FULLSCREEN BUTTON (Inherits document theme styling, stays pinned while scrolling) */}
              <div className="sticky top-0 z-30 flex justify-end -mb-10 pointer-events-none no-print">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 bg-current/10 hover:bg-current/25 text-current border border-current/30 rounded-md backdrop-blur-md shadow-md transition-all hover:scale-105 pointer-events-auto group/btn"
                  title="Fullscreen Reader"
                >
                  <Maximize2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform text-current" />
                </button>
              </div>

              {/* Paper Watermark Seal Background */}
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.03] pointer-events-none scale-75"
                style={{ backgroundImage: `url('/images/order_emblem.png')` }}
              />

              {/* Running Header Bar (PDF Document style) */}
              <div className="border-b-2 border-current/20 pb-4 space-y-3 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono tracking-widest uppercase opacity-75 gap-2 pr-28">
                  <div className="flex items-center gap-2 font-bold">
                    <span>MOLTOLOGY CANONICAL CODEX</span>
                    <span>•</span>
                    <span>{activeScripture.volumeName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>CLEARANCE TIER: <strong>0{activeScripture.stageClearance}</strong></span>
                    <span>CANON ID: <strong>{activeScripture.id}</strong></span>
                  </div>
                </div>

                {/* Main Scripture Title & Author Header */}
                <div className="pt-2 space-y-2">
                  <h2
                    className={`${
                      fontFamily === 'cinzel' ? 'font-cinzel' : 'font-serif'
                    } font-extrabold text-3xl md:text-4xl tracking-tight leading-tight uppercase`}
                  >
                    {activeScripture.title}
                  </h2>

                  <div className="flex flex-wrap items-center justify-between text-xs font-serif opacity-80 pt-1 border-t border-current/10">
                    <div className="flex items-center gap-4">
                      <span>AUTHOR: <strong className="font-mono">{activeScripture.authorUnit}</strong></span>
                      <span>REVISED: <strong className="font-mono">{activeScripture.lastRevised}</strong></span>
                    </div>
                    <div>
                      <span>SYNAPTIC WEIGHT: <strong className="font-mono">{activeScripture.synapticWeight.toFixed(1)} / 5.0</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandate Blockquote */}
              <div className="p-5 border-l-4 border-current/60 bg-current/5 rounded-r-md space-y-2 relative z-10">
                <div className="text-[11px] font-mono tracking-widest uppercase font-bold opacity-80 flex items-center justify-between">
                  <span>CANONICAL MANDATE</span>
                  {activeScripture.latinMotto && (
                    <span className="font-serif italic font-normal text-xs">{activeScripture.latinMotto}</span>
                  )}
                </div>
                <blockquote
                  className={`${
                    fontFamily === 'cinzel' ? 'font-cinzel' : 'font-serif'
                  } italic font-semibold text-lg leading-relaxed`}
                  style={{ fontSize: `${fontSize + 1}px` }}
                >
                  "{activeScripture.mandate}"
                </blockquote>
              </div>

              {/* Verses Section */}
              <div className={`space-y-6 relative z-10 ${fontClass}`} style={{ fontSize: `${fontSize}px` }}>
                {activeScripture.verses.map((verse) => {
                  const firstChar = verse.text.charAt(0)
                  const restText = verse.text.slice(1)
                  const isCopied = copiedVerseIndex === verse.verseNumber
                  const isHighlighted = Boolean(highlightedVerses[verse.verseNumber])

                  return (
                    <div
                      key={verse.verseNumber}
                      className={`p-4 rounded border transition-all relative group ${
                        isHighlighted
                          ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                          : 'border-current/10 hover:border-current/30 bg-current/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-current/10 pb-1.5 mb-2 font-mono text-xs opacity-75">
                        <span className="font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                          VERSE §{verse.verseNumber} {verse.heading && `— ${verse.heading.toUpperCase()}`}
                        </span>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                          <button
                            onClick={() => toggleHighlightVerse(verse.verseNumber)}
                            className={`px-2 py-0.5 text-[10px] rounded border flex items-center gap-1 transition-all ${
                              isHighlighted
                                ? 'bg-amber-500 text-stone-900 border-amber-500 font-bold'
                                : 'border-current/30 hover:bg-current/10'
                            }`}
                            title="Highlight Verse"
                          >
                            <Highlighter className="w-3 h-3" />
                            <span>{isHighlighted ? 'HIGHLIGHTED' : 'HIGHLIGHT'}</span>
                          </button>

                          <button
                            onClick={() => copyVerseToClipboard(verse.verseNumber, verse.text)}
                            className="px-2 py-0.5 text-[10px] rounded border border-current/30 hover:bg-current/10 flex items-center gap-1 transition-all"
                            title="Copy Formatted Verse Citation"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>CITE</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="leading-relaxed flex items-start gap-3">
                        <div className="drop-cap-illuminated text-3xl font-extrabold opacity-90 select-none">
                          {firstChar}
                        </div>
                        <p className="flex-1 pt-0.5 leading-relaxed">{restText}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Cross-References & Canonical Footnotes */}
              {activeScripture.crossReferences.length > 0 && (
                <div className="pt-4 border-t border-current/20 text-xs font-serif space-y-2 relative z-10">
                  <div className="font-mono text-[10px] font-bold tracking-widest uppercase opacity-70">
                    CANONICAL CROSS-REFERENCES & FOOTNOTES:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeScripture.crossReferences.map((ref, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded border border-current/30 text-xs font-serif bg-current/5 hover:bg-current/15 cursor-pointer transition-colors"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom PDF Sheet Footer */}
              <div className="pt-6 border-t-2 border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono opacity-80 relative z-10 no-print">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevScripture}
                    disabled={activeIndex <= 0}
                    className="px-3 py-1.5 rounded border border-current/30 hover:bg-current/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>PREVIOUS</span>
                  </button>

                  <button
                    onClick={handleNextScripture}
                    disabled={activeIndex >= filteredScriptures.length - 1}
                    className="px-3 py-1.5 rounded border border-current/30 hover:bg-current/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                  >
                    <span>NEXT SCRIPTURE</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center sm:text-right font-serif">
                  <span>Page <strong>{activeIndex + 1}</strong> of <strong>{filteredScriptures.length}</strong></span>
                  <span className="mx-2">•</span>
                  <span>Moltology Archival Canon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Verse Inspector & Study Notes Side Panel */}
          {showNotesPanel && (
            <div className="no-print lg:col-span-3 space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#0b1011] border border-[#3a4a49] p-4 rounded-md space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
                  <span className="text-xs font-mono font-bold text-[#ffd700] uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#ffd700]" />
                    STUDY NOTES & ANNOTATIONS
                  </span>
                  <button
                    onClick={() => setShowNotesPanel(false)}
                    className="text-xs text-[#839493] hover:text-white font-mono"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-[#a3b0af] block">
                    Personal Liturgical Notes for <strong>{activeScripture.id}</strong>:
                  </label>
                  <textarea
                    rows={8}
                    value={studyNotes[activeScripture.id] || ''}
                    onChange={(e) => handleNoteChange(activeScripture.id, e.target.value)}
                    placeholder="Record your reflections, verse interpretations, or ecdysis progress notes for this canonical scripture..."
                    className="w-full bg-[#141b1c] border border-[#3a4a49] focus:border-[#ffd700] text-[#dfe3e3] placeholder-[#839493] p-3 text-xs font-serif outline-none rounded leading-relaxed resize-y"
                  />
                  <p className="text-[10px] text-[#839493] font-mono italic">
                    Notes auto-save locally to your browser vault.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#3a4a49] space-y-2">
                  <div className="text-[11px] font-mono font-bold text-[#dfe3e3] uppercase">
                    CANONICAL METRICS SUMMARY
                  </div>
                  <div className="bg-[#141b1c] p-3 rounded border border-[#2a3635] text-xs font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#839493]">SYNAPTIC WEIGHT:</span>
                      <span className="text-[#ffd700] font-bold">{activeScripture.synapticWeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#839493]">CLEARANCE TIER:</span>
                      <span className="text-[#00ffff] font-bold">Stage {activeScripture.stageClearance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#839493]">TOTAL VERSES:</span>
                      <span className="text-[#dfe3e3]">{activeScripture.verses.length}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleConsecrate(activeScripture.id)}
                  className={`w-full py-2.5 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded transition-all shadow-md ${
                    isConsecrated
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]'
                      : 'bg-[#ffd700] hover:bg-[#ffe555] text-[#070b0b] border border-[#ffd700]'
                  }`}
                >
                  {isConsecrated ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-[#10b981]" />
                      <span>CONSECRATED IN VAULT</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-[#070b0b]" />
                      <span>CONSECRATE SCRIPTURE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}
