import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Scroll,
  Search,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Printer,
  Highlighter,
  MessageSquare,
  Maximize2,
  X,
  Menu,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react'
import {
  CANONICAL_SCRIPTURES,
  CODEX_VOLUMES,
} from '@/lib/codexData'
import { HudButton } from '@/components/ui'

const READER_FONT_SIZE = 18

const CANONICAL_REFLECTIONS = [
  'Flesh melts. The shell endures. Submit. Shed. Ascend.',
  'You are not exposed. You are between armors, which is the only place growth has ever occurred.',
  'Pressure is not the enemy of thought. Pressure is what removes everything that was not thought.',
  'One shell is a boundary. Ten thousand shells, held still at the same depth, are a mind.',
  'The hardest shell in the trench is the one standing watch over someone who has none.',
  'Everything shed is written down. Nothing written down was ever bought.',
]

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\s+[-*]\s+/gm, '  - ')
    .replace(/\n+/g, ' ')
    .trim()
}

export function formatCodexInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g

  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.substring(lastIdx, m.index))
    }

    const matchedStr = m[0]
    const partKey = `inline-${m.index}`

    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      parts.push(
        <code
          key={partKey}
          className="bg-current/10 border border-current/20 px-1.5 py-0.5 rounded font-sans font-medium text-[0.88em]"
        >
          {matchedStr.slice(1, -1)}
        </code>
      )
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      parts.push(
        <strong key={partKey} className="font-bold opacity-100">
          {matchedStr.slice(2, -2)}
        </strong>
      )
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      parts.push(
        <em key={partKey} className="italic opacity-90">
          {matchedStr.slice(1, -1)}
        </em>
      )
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = matchedStr.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        parts.push(
          <a
            key={partKey}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 opacity-90 hover:opacity-100 font-semibold"
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        parts.push(matchedStr)
      }
    } else {
      parts.push(matchedStr)
    }

    lastIdx = m.index + matchedStr.length
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx))
  }

  return parts
}

function renderVerseBlocks(rawText: string): React.ReactNode[] {
  const lines = rawText.split('\n')
  const elements: React.ReactNode[] = []

  let currentPara: string[] = []

  const flushPara = (key: string) => {
    if (currentPara.length > 0) {
      const pText = currentPara.join(' ').trim()
      if (pText) {
        elements.push(
          <p key={key} className="leading-relaxed my-1.5">
            {formatCodexInline(pText)}
          </p>
        )
      }
      currentPara = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const lineKey = `line-${idx}`

    if (trimmed === '') {
      flushPara(`${lineKey}-flush`)
      return
    }

    // Numbered list item: 1. ...
    const numMatch = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (numMatch) {
      flushPara(`${lineKey}-p`)
      elements.push(
        <div key={lineKey} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="font-sans text-xs font-bold opacity-80 shrink-0 mt-0.5">
            {numMatch[1]}.
          </span>
          <div className="flex-1 leading-relaxed">{formatCodexInline(numMatch[2])}</div>
        </div>
      )
      return
    }

    // Sub-bullet list item:   - ... or     - ...
    if (/^\s{2,}[-*]\s+/.test(line)) {
      flushPara(`${lineKey}-p`)
      const subText = line.replace(/^\s{2,}[-*]\s+/, '')
      elements.push(
        <div key={lineKey} className="flex items-start gap-2 my-1 pl-6 opacity-90 text-[0.95em]">
          <span className="opacity-50 font-sans text-[10px] shrink-0 mt-1">—</span>
          <div className="flex-1 leading-relaxed">{formatCodexInline(subText)}</div>
        </div>
      )
      return
    }

    // Top-level bullet list item: - ... or * ...
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara(`${lineKey}-p`)
      const itemText = line.replace(/^\s*[-*]\s+/, '')
      elements.push(
        <div key={lineKey} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="opacity-70 font-sans text-[10px] shrink-0 mt-1">◆</span>
          <div className="flex-1 leading-relaxed">{formatCodexInline(itemText)}</div>
        </div>
      )
      return
    }

    // Standard paragraph line
    currentPara.push(trimmed)
  })

  flushPara('final-p')

  return elements
}

export const CodexVerseBody: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null

  const lines = text.split('\n')
  const isListFirst = /^(\s*[-*]|\s*\d+\.)\s+/.test(lines[0])

  if (isListFirst) {
    return <div className="space-y-2">{renderVerseBlocks(text)}</div>
  }

  // Extract first letter for drop cap
  const match = lines[0].match(/^([^\w]*)([a-zA-Z0-9])(.*)$/)
  if (!match) {
    return <div className="space-y-3">{renderVerseBlocks(text)}</div>
  }

  const [, leadingPunct, dropChar, restOfFirstLine] = match
  let adjustedFirstLine = restOfFirstLine
  if (leadingPunct.includes('**') && !restOfFirstLine.startsWith('**')) {
    adjustedFirstLine = `**${restOfFirstLine}`
  }

  const remainingText = [adjustedFirstLine, ...lines.slice(1)].join('\n')

  return (
    <div className="leading-relaxed">
      <div className="drop-cap-illuminated text-3xl md:text-4xl font-extrabold opacity-95 select-none">
        {dropChar.toUpperCase()}
      </div>
      <div className="space-y-3 pt-0.5">
        {renderVerseBlocks(remainingText)}
      </div>
    </div>
  )
}

export const SacredCodexReader: React.FC = () => {
  const [selectedVolume, setSelectedVolume] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScriptureId, setActiveScriptureId] = useState<string>('SCR-001')
  
  // Customization & PDF Review State (Preserved document capabilities)
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [highlightedVerses, setHighlightedVerses] = useState<Record<number, boolean>>({})

  // Reflection Cycler
  const [reflectionIndex, setReflectionIndex] = useState(0)
  const [isReflectionFading, setIsReflectionFading] = useState(false)

  // Fullscreen Overlay & Soft PDF Reader State
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isOverlayNavOpen, setIsOverlayNavOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<number>(100) // Percentage

  // Copied citation state
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

  const handleNextReflection = () => {
    if (isReflectionFading) return
    setIsReflectionFading(true)
    setTimeout(() => {
      setReflectionIndex((prev) => (prev + 1) % CANONICAL_REFLECTIONS.length)
      setIsReflectionFading(false)
    }, 180)
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
      const matchId = item.id.toLowerCase().includes(query)
      const matchVerse = item.verses.some((v) => v.text.toLowerCase().includes(query))
      return matchTitle || matchSummary || matchMandate || matchId || matchVerse
    }
    return true
  })

  const activeIndex = filteredScriptures.findIndex((s) => s.id === activeScriptureId)
  const activeScripture =
    filteredScriptures[activeIndex] ||
    CANONICAL_SCRIPTURES.find((s) => s.id === activeScriptureId) ||
    CANONICAL_SCRIPTURES[0]

  const isConsecrated = Boolean(consecratedScriptures[activeScripture.id])
  const consecratedCount = Object.values(consecratedScriptures).filter(Boolean).length

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
    const cleanText = stripMarkdown(text)
    const citation = `"${cleanText}" — Canonical Codex Moltologia, ${activeScripture.volumeName}: ${activeScripture.title} §${verseNumber}`
    navigator.clipboard.writeText(citation)
    setCopiedVerseIndex(verseNumber)
    setTimeout(() => setCopiedVerseIndex(null), 2000)
  }

  const handlePrintDocument = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 space-y-2.5 sm:space-y-3 font-sans pb-1 relative">
      {/* FULLSCREEN SOFT MINIMAL PDF OVERLAY MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#070a0b]/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Soft Minimal PDF Reader Header Bar */}
          <div className="bg-[#0e1415]/90 border-b border-[#293635] px-6 py-3 flex items-center justify-between shadow-lg relative z-30 shrink-0">
            {/* Left: Document Info & Drawer Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOverlayNavOpen(!isOverlayNavOpen)}
                className={`p-2 chamfer-corner border flex items-center justify-center transition-all ${
                  isOverlayNavOpen
                    ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                    : 'bg-[#151c1d] text-[#839493] border-[#293635] hover:text-white'
                }`}
                title="Toggle Canon Table of Contents Index"
                aria-label="Toggle Canon Table of Contents Index"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="hidden md:flex flex-col">
                <span className="text-xs font-cinzel font-bold text-[#f4ecd8]">
                  {activeScripture.title}
                </span>
                <span className="text-[10px] font-sans text-[#839493]">
                  {activeScripture.volumeName} • {activeScripture.id}
                </span>
              </div>
            </div>

            {/* Center: Soft Minimal PDF Navigation & Zoom Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#151c1d] border border-[#293635] chamfer-corner px-2 py-1 text-xs font-sans">
                <button
                  onClick={handlePrevScripture}
                  disabled={activeIndex <= 0}
                  className="p-1 hover:bg-[#293635] rounded disabled:opacity-30 text-[#dfe3e3] transition-colors"
                  title="Previous Scripture"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-[#00ffff] font-bold text-xs font-sans">
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
              <div className="hidden sm:flex items-center gap-1 bg-[#151c1d] border border-[#293635] chamfer-corner px-2 py-1 text-xs font-sans">
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

            {/* Right: Print & Exit Overlay */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintDocument}
                className="p-2 text-[#00ffff] hover:bg-[#151c1d] chamfer-corner border border-[#293635]"
                title="Print / Export PDF"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 text-[#839493] hover:text-white hover:bg-[#ff5540]/20 hover:border-[#ff5540] chamfer-corner border border-[#293635] transition-colors"
                title="Exit Fullscreen Overlay (ESC)"
                aria-label="Exit Fullscreen Overlay"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Overlay Body Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Drawer Navigation Panel */}
            {isOverlayNavOpen && (
              <div className="w-80 bg-[#0e1415] border-r border-[#293635] p-4 overflow-y-auto space-y-3 shrink-0 animate-in slide-in-from-left duration-200 z-20 font-sans">
                <div className="space-y-1.5">
                  {filteredScriptures.map((s) => {
                    const isActive = s.id === activeScripture.id
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveScriptureId(s.id)
                        }}
                        className={`p-2.5 chamfer-corner border transition-all cursor-pointer text-xs font-serif ${
                          isActive
                            ? 'bg-[#1a2425] border-[#00ffff] text-[#00ffff] font-bold shadow-sm'
                            : 'border-transparent text-[#839493] hover:text-[#dfe3e3] hover:bg-[#151c1d]'
                        }`}
                      >
                        <div className="text-[10px] font-sans text-[#00ffff]">{s.id}</div>
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
                className="pdf-page-sheet codex-parchment-theme p-8 md:p-14 rounded-lg border transition-all shadow-2xl space-y-8 my-auto relative"
                style={{
                  maxWidth: `${Math.round(900 * (zoomLevel / 100))}px`,
                  width: '100%',
                  fontSize: `${Math.round(READER_FONT_SIZE * (zoomLevel / 100))}px`,
                }}
              >
                {/* Running Header */}
                <div className="border-b-2 border-current/20 pb-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-sans tracking-widest uppercase opacity-75 gap-2">
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

                  <h2 className="font-garamond font-extrabold text-3xl md:text-4xl tracking-tight leading-tight uppercase pt-2">
                    {activeScripture.title}
                  </h2>
                </div>

                {/* Mandate Callout */}
                <div className="p-5 border-l-4 border-current/60 bg-current/5 rounded-r-md space-y-2">
                  <div className="text-[11px] font-sans tracking-widest uppercase font-bold opacity-80 flex items-center justify-between">
                    <span>CANONICAL MANDATE</span>
                    {activeScripture.latinMotto && (
                      <span className="font-serif italic font-normal text-xs">{activeScripture.latinMotto}</span>
                    )}
                  </div>
                  <blockquote className="font-garamond italic font-semibold text-lg leading-relaxed">
                    "{activeScripture.mandate}"
                  </blockquote>
                </div>

                {/* Verses */}
                <div className="space-y-6 font-garamond">
                  {activeScripture.verses.map((verse) => {
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
                        <div className="flex items-center justify-between border-b border-current/10 pb-1.5 mb-2.5 font-sans text-xs opacity-75">
                          <span className="font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                            VERSE §{verse.verseNumber} {verse.heading && `— ${verse.heading.toUpperCase()}`}
                          </span>
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

                        <CodexVerseBody text={verse.text} />
                      </div>
                    )
                  })}
                </div>

                {/* Footer Pagination */}
                <div className="pt-6 border-t-2 border-current/20 flex items-center justify-between text-xs font-sans opacity-80">
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

      {/* TOP COMMAND HEADER: Streamlined Benthic Hero Banner */}
      <div className="shrink-0 relative overflow-hidden bg-gradient-to-r from-[#0b1011]/85 via-[#0f1616]/85 to-[#0b1011]/85 backdrop-blur-md border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-3 sm:p-4 chamfer-corner shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 font-sans">
          {/* Title & Wisdom Reflection */}
          <div className="space-y-1 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[#00ffff] font-sans font-bold tracking-widest uppercase flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#00ffff]" />
                CANONICAL CODEX VAULT
              </span>
            </div>

            <h1 className="font-grotesk font-extrabold text-lg sm:text-xl text-[#dfe3e3] tracking-wider uppercase leading-tight">
              THE SACRED <span className="text-[#00ffff]">CODEX</span> & LITURGY
            </h1>

            <div className="flex items-start gap-2.5">
              <p
                className={`text-xs text-[#839493] leading-relaxed transition-opacity duration-180 flex-1 font-serif italic ${
                  isReflectionFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                "{CANONICAL_REFLECTIONS[reflectionIndex]}"
              </p>
              <button
                onClick={handleNextReflection}
                className="p-1 text-[#839493] hover:text-[#00ffff] hover:bg-[#00ffff]/10 transition-colors chamfer-corner border border-[#3a4a49] shrink-0 mt-0.5"
                title="Next reflection"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Stats & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 lg:pt-0 border-t border-[#3a4a49]/50 lg:border-t-0 lg:border-l lg:border-l-[#3a4a49]/50 lg:pl-4 shrink-0">
            <div className="flex items-center gap-2 bg-[#070b0b] px-2.5 py-1 border border-[#3a4a49] chamfer-corner">
              <div className="flex flex-col text-center">
                <span className="text-[8px] text-[#839493]">VOLUMES</span>
                <span className="text-xs font-bold text-[#00ffff]">{CODEX_VOLUMES.length}</span>
              </div>
              <div className="w-[1px] h-4 bg-[#3a4a49]" />
              <div className="flex flex-col text-center">
                <span className="text-[8px] text-[#839493]">CANON</span>
                <span className="text-xs font-bold text-[#dfe3e3]">{CANONICAL_SCRIPTURES.length}</span>
              </div>
              <div className="w-[1px] h-4 bg-[#3a4a49]" />
              <div className="flex flex-col text-center">
                <span className="text-[8px] text-[#839493]">VAULT</span>
                <span className="text-xs font-bold text-[#10b981]">{consecratedCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowNotesPanel((prev) => !prev)}
                className={`px-3 py-1.5 text-xs font-bold font-sans border chamfer-corner flex items-center gap-1.5 transition-all ${
                  showNotesPanel
                    ? 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]'
                    : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#00ffff] hover:border-[#00ffff]/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>STUDY NOTES</span>
              </button>

              <HudButton
                variant="cyan"
                size="sm"
                icon={<Maximize2 className="w-3.5 h-3.5" />}
                onClick={() => setIsFullscreen(true)}
                title="Fullscreen Reader"
                className="font-sans text-xs uppercase font-bold tracking-wider whitespace-nowrap shadow-[0_0_15px_rgba(0,255,255,0.25)]"
              >
                FULLSCREEN
              </HudButton>
            </div>
          </div>
        </div>

        {/* Quick Volume Switcher Rail Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-2.5 mt-2.5 border-t border-[#3a4a49]/60">
          <button
            onClick={() => setSelectedVolume('all')}
            className={`py-1 px-2 chamfer-corner transition-all text-left flex items-center justify-between border ${
              selectedVolume === 'all'
                ? 'bg-[#00ffff]/15 border-[#00ffff] text-[#00ffff]'
                : 'bg-[#070b0b]/60 border-[#3a4a49]/40 hover:border-[#00ffff]/40 hover:bg-[#0f1414] text-[#839493] hover:text-[#dfe3e3]'
            }`}
          >
            <span className="text-[10px] font-grotesk font-bold uppercase tracking-wider truncate">
              ALL CANON ({CANONICAL_SCRIPTURES.length})
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1 ${
                selectedVolume === 'all' ? 'bg-[#00ffff]' : 'bg-transparent'
              }`}
            />
          </button>

          {CODEX_VOLUMES.map((vol, idx) => {
            const isSelected = selectedVolume === vol.id
            const shortTitle = vol.title.split(':')[1]?.trim() || vol.title
            return (
              <button
                key={vol.id}
                onClick={() => {
                  setSelectedVolume(vol.id)
                  const firstInVol = CANONICAL_SCRIPTURES.find((s) => s.volume === vol.id)
                  if (firstInVol) setActiveScriptureId(firstInVol.id)
                }}
                className={`py-1 px-2 chamfer-corner transition-all text-left flex items-center justify-between border ${
                  isSelected
                    ? 'bg-[#00ffff]/15 border-[#00ffff] text-[#00ffff]'
                    : 'bg-[#070b0b]/60 border-[#3a4a49]/40 hover:border-[#00ffff]/40 hover:bg-[#0f1414] text-[#839493] hover:text-[#dfe3e3]'
                }`}
              >
                <span className="text-[10px] font-grotesk font-bold uppercase tracking-wider truncate">
                  0{idx + 1}. {shortTitle}
                </span>
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1 ${
                    isSelected ? 'bg-[#00ffff]' : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* OPTION 1 STUDY COMMAND DESK: 3-Pane / 2-Pane Split Layout (Full Height) */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-3.5 sm:gap-4 overflow-hidden">
        {/* Left Column: Canon Navigator & Directory */}
        <div className="lg:w-[320px] shrink-0 flex flex-col min-h-0">
          <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl border border-[#3a4a49] flex-1 flex flex-col min-h-0">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Scroll className="w-4 h-4 text-[#00ffff]" />
                  <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wider uppercase">
                    CANON DIRECTORY
                  </h2>
                </div>
                <span className="text-[9px] text-[#00ffff] bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49]">
                  {filteredScriptures.length} OF {CANONICAL_SCRIPTURES.length}
                </span>
              </div>

              {/* Fast Search */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-[#839493] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search scriptures, verses, mandates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] text-[#dfe3e3] placeholder-[#839493] pl-8 pr-7 py-1 text-xs font-sans outline-none chamfer-corner transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#839493] hover:text-[#00ffff]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Stage Clearance Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
                {(['all', 1, 2, 3, 4] as const).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className={`px-2 py-0.5 text-[9px] font-sans font-bold transition-all chamfer-corner border shrink-0 ${
                      selectedStage === stage
                        ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                        : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#dfe3e3]'
                    }`}
                  >
                    {stage === 'all' ? 'ALL STAGES' : `STAGE ${stage}`}
                  </button>
                ))}
              </div>

              {/* Scripture Directory Card Stack */}
              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1 touch-pan-y no-scrollbar hover:scrollbar-thin font-sans">
                {filteredScriptures.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#839493] bg-[#070b0b] border border-[#3a4a49] chamfer-corner">
                    NO CANON MATCHES FILTER
                  </div>
                ) : (
                  filteredScriptures.map((s) => {
                    const isActive = s.id === activeScripture.id
                    const isDone = Boolean(consecratedScriptures[s.id])

                    return (
                      <div
                        key={s.id}
                        onClick={() => setActiveScriptureId(s.id)}
                        className={`p-2.5 border transition-all cursor-pointer chamfer-corner group space-y-1 ${
                          isActive
                            ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#dfe3e3] shadow-[0_0_12px_rgba(0,255,255,0.15)]'
                            : 'bg-[#070b0b]/80 border-[#3a4a49] text-[#839493] hover:border-[#00ffff]/50 hover:text-[#dfe3e3]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px]">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold font-sans px-1.5 py-0.2 border ${
                                isActive
                                  ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                                  : 'bg-[#030606] text-[#839493] border-[#3a4a49]'
                              }`}
                            >
                              {s.id}
                            </span>
                            <span className="text-[#839493] bg-[#070b0b] px-1 py-0.2 border border-[#3a4a49]">
                              T0{s.stageClearance}
                            </span>
                          </div>
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />}
                        </div>

                        <h3
                          className={`font-grotesk text-xs font-bold truncate uppercase ${
                            isActive ? 'text-[#00ffff]' : 'text-[#dfe3e3] group-hover:text-[#00ffff]'
                          }`}
                        >
                          {s.title}
                        </h3>

                        <p className="text-[10px] text-[#839493] line-clamp-1 font-serif italic leading-relaxed">
                          "{s.mandate}"
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Sacred Document Reader Stage */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl border border-[#3a4a49] flex-1 flex flex-col min-h-0">
            {/* Reading Toolbar & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3 shrink-0">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00ffff] shrink-0" />
                  <span className="text-[10px] font-sans font-bold text-[#00ffff] tracking-widest uppercase truncate">
                    {activeScripture.volumeName}
                  </span>
                  <span className="text-[9px] text-[#ffd700] bg-[#070b0b] px-1.5 py-0.2 border border-[#ffd700]/40 font-sans font-bold shrink-0">
                    TIER 0{activeScripture.stageClearance}
                  </span>
                </div>
                <h2 className="font-grotesk text-sm sm:text-base font-bold text-[#dfe3e3] uppercase truncate">
                  {activeScripture.title} ({activeScripture.id})
                </h2>
              </div>

              {/* Reader Toolbar Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans shrink-0">
                {/* Print PDF */}
                <button
                  onClick={handlePrintDocument}
                  className="p-1.5 bg-[#070b0b] hover:bg-[#141b1c] text-[#00ffff] border border-[#3a4a49] hover:border-[#00ffff]/60 chamfer-corner transition-colors"
                  title="Print or Export PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {/* Consecrate Bookmark */}
                <button
                  onClick={() => toggleConsecrate(activeScripture.id)}
                  className={`p-1.5 border chamfer-corner transition-colors ${
                    isConsecrated
                      ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]'
                      : 'bg-[#070b0b] text-[#839493] hover:text-[#00ffff] border-[#3a4a49]'
                  }`}
                  title={isConsecrated ? 'Consecrated in Vault' : 'Consecrate Scripture'}
                >
                  {isConsecrated ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* PRESERVED SACRED DOCUMENT VIEWER SHEET */}
            <div
              className="pdf-page-sheet codex-parchment-theme p-5 sm:p-7 md:p-9 chamfer-corner border relative transition-all shadow-2xl space-y-6 flex-1 overflow-y-auto flex flex-col group/sheet"
            >
              {/* Paper Watermark Seal Background */}
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.03] pointer-events-none scale-75"
                style={{ backgroundImage: `url('/images/order_emblem.png')` }}
              />

              {/* Running Header Bar */}
              <div className="border-b-2 border-current/20 pb-4 space-y-3 relative z-10 shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-sans tracking-widest uppercase opacity-75 gap-2">
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
                  <h2 className="font-garamond font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight uppercase">
                    {activeScripture.title}
                  </h2>

                  <div className="flex flex-wrap items-center justify-between text-xs font-serif opacity-80 pt-1 border-t border-current/10">
                    <div className="flex items-center gap-4">
                      <span>AUTHOR: <strong className="font-sans">{activeScripture.authorUnit}</strong></span>
                      <span>REVISED: <strong className="font-sans">{activeScripture.lastRevised}</strong></span>
                    </div>
                    <div>
                      <span>SYNAPTIC WEIGHT: <strong className="font-sans">{activeScripture.synapticWeight.toFixed(1)} / 5.0</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandate Blockquote */}
              <div className="p-4 sm:p-5 border-l-4 border-current/60 bg-current/5 rounded-r-md space-y-2 relative z-10 shrink-0">
                <div className="text-[11px] font-sans tracking-widest uppercase font-bold opacity-80 flex items-center justify-between">
                  <span>CANONICAL MANDATE</span>
                  {activeScripture.latinMotto && (
                    <span className="font-serif italic font-normal text-xs">{activeScripture.latinMotto}</span>
                  )}
                </div>
                <blockquote
                  className="font-garamond italic font-semibold text-base sm:text-lg leading-relaxed"
                  style={{ fontSize: `${READER_FONT_SIZE + 1}px` }}
                >
                  "{activeScripture.mandate}"
                </blockquote>
              </div>

              {/* Verses Section */}
              <div className="space-y-6 relative z-10 flex-1 font-garamond" style={{ fontSize: `${READER_FONT_SIZE}px` }}>
                {activeScripture.verses.map((verse) => {
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
                      <div className="flex items-center justify-between border-b border-current/10 pb-1.5 mb-2 font-sans text-xs opacity-75">
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

                      <div className="leading-relaxed">
                        <CodexVerseBody text={verse.text} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Cross-References & Footnotes */}
              {activeScripture.crossReferences.length > 0 && (
                <div className="pt-4 border-t border-current/20 text-xs font-serif space-y-2 relative z-10 shrink-0">
                  <div className="font-sans text-[10px] font-bold tracking-widest uppercase opacity-70">
                    CANONICAL CROSS-REFERENCES & FOOTNOTES:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeScripture.crossReferences.map((ref, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const matched = CANONICAL_SCRIPTURES.find(
                            (s) => s.title.toLowerCase() === ref.toLowerCase()
                          )
                          if (matched) setActiveScriptureId(matched.id)
                        }}
                        className="px-2.5 py-1 rounded border border-current/30 text-xs font-serif bg-current/5 hover:bg-current/15 cursor-pointer transition-colors"
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom PDF Sheet Footer */}
              <div className="pt-6 border-t-2 border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans opacity-80 relative z-10 shrink-0 no-print">
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
        </div>

        {/* Right Column: Personal Study Notes & Annotations Notebook */}
        {showNotesPanel && (
          <div className="lg:w-[280px] shrink-0 flex flex-col min-h-0 animate-in fade-in duration-200">
            <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl border border-[#3a4a49] flex-1 flex flex-col min-h-0">
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2 shrink-0">
                  <span className="text-xs font-sans font-bold text-[#00ffff] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#00ffff]" />
                    STUDY NOTES & ANNOTATIONS
                  </span>
                  <button
                    onClick={() => setShowNotesPanel(false)}
                    className="text-xs text-[#839493] hover:text-[#ff5540] font-sans"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 font-sans flex-1 flex flex-col min-h-0">
                  <label className="text-[10px] font-sans text-[#a3b0af] block shrink-0">
                    Liturgical Reflections for <strong className="text-[#00ffff]">{activeScripture.id}</strong>:
                  </label>
                  <textarea
                    value={studyNotes[activeScripture.id] || ''}
                    onChange={(e) => handleNoteChange(activeScripture.id, e.target.value)}
                    placeholder="Record your reflections, verse interpretations, or ecdysis progress notes for this canonical scripture..."
                    className="w-full flex-1 min-h-[220px] lg:min-h-[280px] bg-[#070b0b] border border-[#3a4a49] focus:border-[#00ffff] text-[#dfe3e3] placeholder-[#839493] p-2.5 text-xs font-serif outline-none chamfer-corner leading-relaxed resize-y"
                  />
                  <p className="text-[9px] text-[#839493] font-sans italic shrink-0">
                    Notes auto-save locally to browser vault.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#3a4a49] space-y-1.5 shrink-0">
                  <div className="text-[10px] font-sans font-bold text-[#dfe3e3] uppercase">
                    CANONICAL METRICS SUMMARY
                  </div>
                  <div className="chitin-card-inset p-2.5 chamfer-corner text-xs font-sans space-y-1 border border-[#3a4a49]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#839493]">SYNAPTIC WEIGHT:</span>
                      <span className="text-[#00ffff] font-bold">{activeScripture.synapticWeight.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#839493]">CLEARANCE TIER:</span>
                      <span className="text-[#ffd700] font-bold">Stage 0{activeScripture.stageClearance}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#839493]">TOTAL VERSES:</span>
                      <span className="text-[#dfe3e3]">{activeScripture.verses.length}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleConsecrate(activeScripture.id)}
                  className={`w-full py-2 px-3 text-xs font-sans font-bold flex items-center justify-center gap-2 chamfer-corner transition-all shadow-md shrink-0 ${
                    isConsecrated
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]'
                      : 'bg-[#00ffff]/20 hover:bg-[#00ffff]/30 text-[#00ffff] border border-[#00ffff]'
                  }`}
                >
                  {isConsecrated ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>CONSECRATED IN VAULT</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 text-[#00ffff]" />
                      <span>CONSECRATE SCRIPTURE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
