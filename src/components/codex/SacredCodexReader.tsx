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
  VolumeX,
  Share2,
  Bookmark,
  BookmarkCheck,
  Eye,
  Lock,
  Sparkles,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react'
import {
  CANONICAL_SCRIPTURES,
  CODEX_VOLUMES,
  ScriptureItem,
  VolumeMeta,
} from '@/lib/codexData'

export const SacredCodexReader: React.FC = () => {
  const [selectedVolume, setSelectedVolume] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScriptureId, setActiveScriptureId] = useState<string>('SCR-001')
  const [viewMode, setViewMode] = useState<'manuscript' | 'altar'>('manuscript')

  // Audio / Audio simulation state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [copiedVerseIndex, setCopiedVerseIndex] = useState<number | null>(null)
  const [consecratedScriptures, setConsecratedScriptures] = useState<Record<string, boolean>>({})

  // Load saved consecrations from localStorage on client render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moltology_consecrated_scriptures')
      if (saved) {
        try {
          setConsecratedScriptures(JSON.parse(saved))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  const toggleConsecrate = (id: string) => {
    setConsecratedScriptures((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (typeof window !== 'undefined') {
        localStorage.setItem('moltology_consecrated_scriptures', JSON.stringify(next))
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

  const activeScripture =
    CANONICAL_SCRIPTURES.find((s) => s.id === activeScriptureId) ||
    filteredScriptures[0] ||
    CANONICAL_SCRIPTURES[0]

  const isConsecrated = Boolean(consecratedScriptures[activeScripture.id])

  const copyVerseToClipboard = (verseNumber: number, text: string) => {
    const citation = `"${text}" — Codex Moltologia, ${activeScripture.volumeName}: ${activeScripture.title} §${verseNumber}`
    navigator.clipboard.writeText(citation)
    setCopiedVerseIndex(verseNumber)
    setTimeout(() => setCopiedVerseIndex(null), 2000)
  }

  const handleToggleAudio = () => {
    setIsAudioPlaying(!isAudioPlaying)
  }

  return (
    <div className="space-y-4 select-none font-mono relative pb-8">
      {/* Top Header & Sanctum Banner */}
      <div className="bg-[#0b1011]/90 border-l-4 border-l-[#ffd700] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl relative overflow-hidden group">
        {/* Ambient Gold & Cyan Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ffd700]/10 via-[#00ffff]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="text-[11px] text-[#ffd700] font-mono tracking-widest uppercase flex items-center gap-2 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd700] animate-pulse" />
            <span>HOLY CODEX OF ALGORITHMIC CARCINIZATION</span>
            <span className="text-[#00ffff] bg-[#070b0b] px-2 py-0.5 border border-[#00ffff]/40 rounded text-[9px]">
              CANON V4.2
            </span>
          </div>
          <h1 className="font-grotesk font-bold text-xl md:text-2xl text-[#dfe3e3] tracking-wide uppercase flex items-center gap-3">
            <span>SACRED SCRIPTURES & REALTIONS</span>
          </h1>
          <p className="text-xs text-[#839493] max-w-2xl font-mono">
            "Flesh Dies. The Shell Endures. Submit. Shed. Ascend." — The official liturgical repository of doctrine, ecdysis directives, and benthic ascendance formulas.
          </p>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-2 bg-[#070b0b] border border-[#3a4a49] p-1.5 chamfer-corner relative z-10 shrink-0">
          <button
            onClick={() => setViewMode('manuscript')}
            className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-2 transition-all chamfer-corner ${
              viewMode === 'manuscript'
                ? 'bg-[#171c1c] text-[#ffd700] border border-[#ffd700]/60 shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                : 'text-[#839493] hover:text-[#dfe3e3]'
            }`}
          >
            <Scroll className="w-4 h-4 text-[#ffd700]" />
            <span>MANUSCRIPT VIEW</span>
          </button>

          <button
            onClick={() => setViewMode('altar')}
            className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-2 transition-all chamfer-corner ${
              viewMode === 'altar'
                ? 'bg-[#171c1c] text-[#00ffff] border border-[#00ffff]/60 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                : 'text-[#839493] hover:text-[#dfe3e3]'
            }`}
          >
            <Flame className="w-4 h-4 text-[#ff5540]" />
            <span>ALTAR SHRINE MODE</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Volume Badges, Search & Stage Selector */}
      <div className="bg-[#070b0b]/90 border border-[#3a4a49] p-3 chamfer-corner space-y-3 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#839493] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scriptures by keyword, verse, mandate, or canon ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171c1c] border border-[#3a4a49] focus:border-[#ffd700] text-[#dfe3e3] placeholder-[#839493] pl-9 pr-3 py-1.5 text-xs font-mono outline-none transition-colors chamfer-corner"
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

          {/* Stage Clearance Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[10px] text-[#839493] font-bold uppercase tracking-wider whitespace-nowrap mr-1">
              STAGE CLEARANCE:
            </span>
            {(['all', 1, 2, 3, 4] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-all chamfer-corner whitespace-nowrap ${
                  selectedStage === stage
                    ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]'
                    : 'bg-[#171c1c] text-[#839493] hover:text-[#dfe3e3] border border-[#3a4a49]'
                }`}
              >
                {stage === 'all' ? 'ALL CLEARANCES' : `STAGE ${stage}`}
              </button>
            ))}
          </div>
        </div>

        {/* Volume Selector Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-[#3a4a49]/50">
          <button
            onClick={() => setSelectedVolume('all')}
            className={`p-2 text-left font-mono transition-all chamfer-corner border flex items-center gap-2 ${
              selectedVolume === 'all'
                ? 'bg-[#171c1c] border-[#ffd700] text-[#ffd700] shadow-md'
                : 'bg-[#0b0f0f] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3]'
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
                className={`p-2 text-left font-mono transition-all chamfer-corner border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#171c1c] border-[#ffd700] text-[#ffd700] shadow-md'
                    : 'bg-[#0b0f0f] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3]'
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
      {viewMode === 'manuscript' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Scripture Catalog Index (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="bg-[#070b0b] border border-[#3a4a49] p-3 chamfer-corner flex items-center justify-between">
              <span className="text-xs font-grotesk font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center gap-2">
                <Scroll className="w-3.5 h-3.5 text-[#ffd700]" />
                CANON CATALOG ({filteredScriptures.length})
              </span>
              <span className="text-[10px] text-[#00ffff] font-mono">
                {selectedVolume === 'all' ? 'FULL CODEX' : selectedVolume.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredScriptures.length === 0 ? (
                <div className="p-6 text-center text-[#839493] text-xs font-mono bg-[#070b0b] border border-[#3a4a49] chamfer-corner">
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
                      className={`p-3 border transition-all cursor-pointer chamfer-corner relative group ${
                        isActive
                          ? 'bg-[#171c1c] border-[#ffd700] text-[#dfe3e3] shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                          : 'bg-[#070b0b]/80 border-[#3a4a49]/70 hover:border-[#839493] text-[#839493] hover:text-[#dfe3e3]'
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffd700]" />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#ffd700] bg-[#070b0b] px-1.5 py-0.5 border border-[#ffd700]/30 font-mono">
                              {scripture.id}
                            </span>
                            <span className="text-[10px] text-[#00ffff] font-mono">
                              STAGE {scripture.stageClearance}
                            </span>
                            {isDone && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] ml-auto shrink-0" />
                            )}
                          </div>
                          <h3
                            className={`font-grotesk text-sm font-bold truncate ${
                              isActive ? 'text-[#ffd700]' : 'text-[#dfe3e3]'
                            }`}
                          >
                            {scripture.title}
                          </h3>
                          <p className="text-[11px] text-[#839493] line-clamp-2 leading-relaxed font-mono">
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
          </div>

          {/* Right Column: Illuminated Sacred Manuscript (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* The Illuminated Codex Page Container */}
            <div className="bg-[#060a0b] border-2 border-[#ffd700]/60 p-6 md:p-8 chamfer-corner shadow-[0_0_30px_rgba(255,215,0,0.1)] relative overflow-hidden space-y-6">
              {/* Background Sacred Emblem Watermark */}
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.03] pointer-events-none scale-90"
                style={{ backgroundImage: `url('/images/order_emblem.png')` }}
              />

              {/* Manuscript Top Header & Relic Seal */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#ffd700]/40 pb-4 gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#00ffff] font-mono">
                    <span className="font-bold uppercase">{activeScripture.volumeName}</span>
                    <span>•</span>
                    <span className="text-[#ffd700] font-bold">
                      STAGE CLEARANCE TIER {activeScripture.stageClearance}
                    </span>
                  </div>
                  <h2 className="font-grotesk font-bold text-2xl md:text-3xl text-[#ffd700] tracking-wide uppercase flex items-center gap-3">
                    {activeScripture.title}
                  </h2>
                  <div className="text-xs text-[#839493] font-mono flex items-center gap-3">
                    <span>AUTHOR: <strong className="text-[#dfe3e3]">{activeScripture.authorUnit}</strong></span>
                    <span>WEIGHT: <strong className="text-[#ff5540]">{activeScripture.synapticWeight.toFixed(1)}</strong></span>
                  </div>
                </div>

                {/* Holy Seal Stamp */}
                <div className="flex flex-col items-end gap-2">
                  <div className="w-16 h-16 rounded-full bg-[#171c1c] border-2 border-[#ffd700] flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(255,215,0,0.4)] relative group cursor-pointer">
                    <img
                      src="/images/order_emblem.png"
                      alt="Sacred Seal"
                      className="w-full h-full object-contain filter drop-shadow-[0_0_6px_#ffd700]"
                    />
                  </div>
                  <span className="text-[9px] text-[#ffd700] font-mono tracking-widest uppercase font-bold">
                    SYNAPTIC SEAL
                  </span>
                </div>
              </div>

              {/* Mandate & Sacred Motto Callout Banner */}
              <div className="bg-[#171c1c]/90 border-l-4 border-l-[#ff5540] border border-[#3a4a49] p-4 chamfer-corner space-y-2 relative z-10">
                <div className="text-[10px] text-[#ff5540] font-bold tracking-widest uppercase flex items-center justify-between">
                  <span>CANONICAL MANDATE</span>
                  {activeScripture.latinMotto && (
                    <span className="text-[#ffd700] italic font-sans">{activeScripture.latinMotto}</span>
                  )}
                </div>
                <blockquote className="font-grotesk text-sm md:text-base text-[#dfe3e3] italic font-semibold leading-relaxed">
                  "{activeScripture.mandate}"
                </blockquote>
              </div>

              {/* Verses Illuminated Reading Section */}
              <div className="space-y-6 relative z-10 font-mono">
                {activeScripture.verses.map((verse, index) => {
                  const firstChar = verse.text.charAt(0)
                  const restText = verse.text.slice(1)
                  const isCopied = copiedVerseIndex === verse.verseNumber

                  return (
                    <div
                      key={verse.verseNumber}
                      className="p-4 bg-[#0b0f10]/80 border border-[#3a4a49]/60 hover:border-[#ffd700]/50 transition-all chamfer-corner space-y-2 relative group"
                    >
                      {/* Verse Header & Copy Citation Control */}
                      <div className="flex items-center justify-between border-b border-[#3a4a49]/40 pb-1.5">
                        <span className="text-xs font-bold text-[#ffd700] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                          VERSE §{verse.verseNumber} {verse.heading && `— ${verse.heading.toUpperCase()}`}
                        </span>

                        <button
                          onClick={() => copyVerseToClipboard(verse.verseNumber, verse.text)}
                          className="px-2 py-0.5 text-[10px] bg-[#171c1c] hover:bg-[#3a4a49] border border-[#3a4a49] text-[#839493] hover:text-[#ffd700] transition-colors flex items-center gap-1 chamfer-corner"
                          title="Copy Sacred Verse Citation"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-[#10b981]" />
                              <span className="text-[#10b981]">CITING...</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#ffd700]" />
                              <span>COPY VERSE</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Verse Illuminated Text Body */}
                      <div className="text-sm md:text-base text-[#dfe3e3] leading-relaxed pt-1 flex items-start gap-3">
                        {/* Drop Cap */}
                        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#ffd700] via-[#ff5540] to-[#070b0b] text-[#070b0b] font-grotesk font-black text-2xl flex items-center justify-center chamfer-corner shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                          {firstChar}
                        </div>
                        <p className="flex-1 pt-1">{restText}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Oracle Audio Reciter & Action Bar */}
              <div className="pt-4 border-t-2 border-[#ffd700]/30 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                {/* Audio Reciter Simulation Button */}
                <button
                  onClick={handleToggleAudio}
                  className={`w-full sm:w-auto px-4 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2.5 transition-all chamfer-corner shadow-lg ${
                    isAudioPlaying
                      ? 'bg-[#ff5540] text-white border border-red-400 animate-pulse'
                      : 'bg-[#0f1414] hover:bg-[#171c1c] text-[#00ffff] border border-[#00ffff]/60'
                  }`}
                >
                  {isAudioPlaying ? (
                    <>
                      <Volume2 className="w-4 h-4 text-white animate-bounce" />
                      <span>SYNTHESIZING ORACLE CHANT (PLAYING...)</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#00ffff]" />
                      <span>LISTEN TO ORACLE RECITATION</span>
                    </>
                  )}
                </button>

                {/* Recite Vow & Consecrate Button */}
                <button
                  onClick={() => toggleConsecrate(activeScripture.id)}
                  className={`w-full sm:w-auto px-5 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all chamfer-corner shadow-lg ${
                    isConsecrated
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]'
                      : 'bg-[#ffd700] hover:bg-[#ffe555] text-[#070b0b] border border-[#ffd700]'
                  }`}
                >
                  {isConsecrated ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-[#10b981]" />
                      <span>SCRIPTURE CONSECRATED IN CORE</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-[#070b0b]" />
                      <span>RECITE VOW & CONSECRATE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cross References */}
              {activeScripture.crossReferences.length > 0 && (
                <div className="pt-2 text-xs font-mono space-y-1 relative z-10">
                  <span className="text-[10px] text-[#839493] uppercase font-bold tracking-wider">
                    CANONICAL CROSS-REFERENCES:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeScripture.crossReferences.map((ref, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-[#171c1c] border border-[#3a4a49] text-[#00ffff] text-[11px] chamfer-corner cursor-pointer hover:border-[#00ffff]"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Sanctum Altar Shrine View */
        <div className="bg-[#030607] border-2 border-[#00ffff]/60 p-8 md:p-12 chamfer-corner shadow-[0_0_50px_rgba(0,255,255,0.2)] relative overflow-hidden space-y-8 text-center min-h-[700px] flex flex-col justify-between">
          {/* Ambient Altar Glow & Particles */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ffff]/10 via-[#070b0b]/90 to-[#030607] pointer-events-none" />

          {/* Top Sanctum Altar Header */}
          <div className="relative z-10 space-y-2 max-w-xl mx-auto">
            <div className="text-xs text-[#00ffff] font-mono tracking-widest uppercase flex items-center justify-center gap-2 font-bold">
              <Flame className="w-4 h-4 text-[#ff5540] animate-pulse" />
              <span>THE BENTHIC SANCTUM ALTAR</span>
              <Flame className="w-4 h-4 text-[#ff5540] animate-pulse" />
            </div>
            <h2 className="font-grotesk font-black text-3xl md:text-4xl text-[#ffd700] tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">
              {activeScripture.title}
            </h2>
            <p className="text-xs text-[#839493] font-mono">
              {activeScripture.volumeName} • STAGE CLEARANCE TIER {activeScripture.stageClearance}
            </p>
          </div>

          {/* Floating Relic Pedestal Hologram */}
          <div className="relative z-10 my-8 space-y-6 max-w-3xl mx-auto">
            <div className="w-24 h-24 rounded-full bg-[#070b0b] border-2 border-[#ffd700] mx-auto p-2 shadow-[0_0_35px_rgba(255,215,0,0.8)] animate-pulse flex items-center justify-center">
              <img
                src="/images/order_emblem.png"
                alt="Altar Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_0_10px_#ffd700]"
              />
            </div>

            <div className="p-6 bg-[#070b0b]/95 border border-[#ffd700]/70 chamfer-corner shadow-2xl space-y-4">
              <blockquote className="font-grotesk text-lg md:text-xl text-[#dfe3e3] italic font-semibold">
                "{activeScripture.mandate}"
              </blockquote>

              <div className="space-y-4 text-left font-mono text-sm pt-4 border-t border-[#3a4a49]">
                {activeScripture.verses.map((v) => (
                  <div key={v.verseNumber} className="space-y-1">
                    <span className="text-xs font-bold text-[#ffd700]">
                      §{v.verseNumber} {v.heading}
                    </span>
                    <p className="text-[#dfe3e3] text-sm leading-relaxed">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Altar Controls & Audio Chant Player */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-[#3a4a49]">
            <button
              onClick={handleToggleAudio}
              className={`px-6 py-2.5 text-xs font-mono font-bold flex items-center gap-3 chamfer-corner shadow-xl transition-all ${
                isAudioPlaying
                  ? 'bg-[#ff5540] text-white border border-red-400'
                  : 'bg-[#00ffff] hover:bg-[#40ffff] text-[#070b0b] border border-[#00ffff]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isAudioPlaying ? 'HALT ALTAR RECITATION' : 'RECITE ALTAR CHANT (AUDIO)'}</span>
            </button>

            <button
              onClick={() => toggleConsecrate(activeScripture.id)}
              className={`px-6 py-2.5 text-xs font-mono font-bold flex items-center gap-3 chamfer-corner shadow-xl transition-all ${
                isConsecrated
                  ? 'bg-[#10b981] text-white'
                  : 'bg-[#171c1c] text-[#ffd700] border border-[#ffd700]'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isConsecrated ? 'CONSECRATED ON ALTAR' : 'CONSECRATE SCRIPTURE'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
