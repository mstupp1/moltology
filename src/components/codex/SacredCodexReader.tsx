import React, { useState } from 'react'
import {
  BookOpen,
  Scroll,
  Search,
  Menu,
  Maximize2,
  Printer,
  RefreshCw,
} from 'lucide-react'
import {
  CANONICAL_SCRIPTURES,
  CODEX_VOLUMES,
} from '@/lib/codexData'
import '@/styles/codex.css'
import { CodexDocumentSheet } from './CodexDocumentSheet'
import { FullscreenDocumentReader } from '@/components/reader/FullscreenDocumentReader'
import { CodexPdfPage } from './CodexPdfPage'

export { stripMarkdown, formatCodexInline, CodexVerseBody } from './CodexDocumentSheet'

const CANONICAL_REFLECTIONS = [
  'Flesh melts. The shell endures. Submit. Shed. Ascend.',
  'You are not exposed. You are between armors, which is the only place growth has ever occurred.',
  'Pressure is not the enemy of thought. Pressure is what removes everything that was not thought.',
  'One shell is a boundary. Ten thousand shells, held still at the same depth, are a mind.',
  'The hardest shell in the trench is the one standing watch over someone who has none.',
  'Everything shed is written down. Nothing written down was ever bought.',
]

export const SacredCodexReader: React.FC = () => {
  const [selectedVolume, setSelectedVolume] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScriptureId, setActiveScriptureId] = useState<string>('SCR-001')
  const [showDirectory, setShowDirectory] = useState(false)
  const [reflectionIndex, setReflectionIndex] = useState(0)
  const [isReflectionFading, setIsReflectionFading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleNextReflection = () => {
    if (isReflectionFading) return
    setIsReflectionFading(true)
    setTimeout(() => {
      setReflectionIndex((prev) => (prev + 1) % CANONICAL_REFLECTIONS.length)
      setIsReflectionFading(false)
    }, 180)
  }

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

  const handlePrintDocument = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const fullscreenIndex = Math.max(0, activeIndex)

  return (
    <div className="flex flex-col gap-3 sm:gap-3.5 font-sans relative">
      {isFullscreen && (
        <FullscreenDocumentReader
          items={filteredScriptures.map((scripture) => ({
            id: scripture.id,
            title: scripture.title,
            subtitle: `${scripture.volumeName} • ${scripture.id}`,
          }))}
          activeIndex={fullscreenIndex}
          overlayLabel="Immersive Codex reader"
          tocToggleTitle="Toggle Canon Table of Contents Index"
          mobileHint="Tap the leaf to rest the well"
          onPrev={handlePrevScripture}
          onNext={handleNextScripture}
          onSelectItem={setActiveScriptureId}
          onPrint={handlePrintDocument}
          onClose={() => setIsFullscreen(false)}
          renderItem={({ zoom, pageWidth }) => (
            <CodexPdfPage
              zoom={zoom}
              pageWidth={pageWidth}
              scriptureId={activeScripture.id}
              className="p-6 sm:p-10 md:p-14"
            >
              <CodexDocumentSheet
                scripture={activeScripture}
                pageIndex={fullscreenIndex}
                pageCount={filteredScriptures.length}
                onPrev={handlePrevScripture}
                onNext={handleNextScripture}
                onSelectScripture={setActiveScriptureId}
                compact
              />
            </CodexPdfPage>
          )}
        />
      )}

      <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1011]/85 via-[#0f1616]/85 to-[#0b1011]/85 backdrop-blur-md border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-3 sm:p-3.5 chamfer-corner shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 font-sans">
          <div className="space-y-1 min-w-0">
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
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowDirectory((prev) => !prev)}
                className={`lg:hidden px-3 py-1.5 text-xs font-bold font-sans border chamfer-corner flex items-center gap-1.5 transition-all ${
                  showDirectory
                    ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                    : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#00ffff] hover:border-[#00ffff]/60'
                }`}
              >
                <Menu className="w-3.5 h-3.5" />
                <span>CANON</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 pt-2.5 mt-2.5 border-t border-[#3a4a49]/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedVolume('all')}
            className={`py-1 px-2 chamfer-corner transition-all text-left flex items-center justify-between border shrink-0 ${
              selectedVolume === 'all'
                ? 'bg-[#00ffff]/15 border-[#00ffff] text-[#00ffff]'
                : 'bg-[#070b0b]/60 border-[#3a4a49]/40 hover:border-[#00ffff]/40 hover:bg-[#0f1414] text-[#839493] hover:text-[#dfe3e3]'
            }`}
          >
            <span className="text-[10px] font-grotesk font-bold uppercase tracking-wider">
              ALL CANON ({CANONICAL_SCRIPTURES.length})
            </span>
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
                className={`py-1 px-2 chamfer-corner transition-all text-left flex items-center justify-between border shrink-0 ${
                  isSelected
                    ? 'bg-[#00ffff]/15 border-[#00ffff] text-[#00ffff]'
                    : 'bg-[#070b0b]/60 border-[#3a4a49]/40 hover:border-[#00ffff]/40 hover:bg-[#0f1414] text-[#839493] hover:text-[#dfe3e3]'
                }`}
              >
                <span className="text-[10px] font-grotesk font-bold uppercase tracking-wider">
                  0{idx + 1}. {shortTitle}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3.5 sm:gap-4 items-start">
        <div
          className={`w-full lg:w-[300px] shrink-0 lg:sticky lg:top-0 overflow-hidden lg:overflow-visible ${
            showDirectory ? 'max-h-[min(28rem,70dvh)]' : 'max-h-0 lg:max-h-[calc(100dvh-6.5rem)]'
          }`}
        >
          <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl border border-[#3a4a49] flex flex-col max-h-[min(28rem,70dvh)] lg:max-h-[calc(100dvh-6.5rem)]">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
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

              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1 touch-pan-y no-scrollbar hover:scrollbar-thin font-sans">
                {filteredScriptures.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#839493] bg-[#070b0b] border border-[#3a4a49] chamfer-corner">
                    NO CANON MATCHES FILTER
                  </div>
                ) : (
                  filteredScriptures.map((s) => {
                    const isActive = s.id === activeScripture.id

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveScriptureId(s.id)
                          setShowDirectory(false)
                        }}
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

        <div className="flex-1 min-w-0 w-full">
          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl border border-[#3a4a49] flex flex-col">
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3">
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

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans shrink-0">
                <button
                  onClick={handlePrintDocument}
                  className="p-1.5 bg-[#070b0b] hover:bg-[#141b1c] text-[#00ffff] border border-[#3a4a49] hover:border-[#00ffff]/60 chamfer-corner transition-colors"
                  title="Print or Export PDF"
                  aria-label="Print or Export PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 bg-[#070b0b] hover:bg-[#141b1c] text-[#00ffff] border border-[#3a4a49] hover:border-[#00ffff]/60 chamfer-corner transition-colors"
                  title="Fullscreen Reader"
                  aria-label="Fullscreen Reader"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pdf-page-sheet codex-parchment-theme p-5 sm:p-7 md:p-9 chamfer-corner border relative shadow-2xl mt-3 mx-auto w-full max-w-3xl group/sheet">
              <CodexDocumentSheet
                scripture={activeScripture}
                pageIndex={Math.max(0, activeIndex)}
                pageCount={filteredScriptures.length || 1}
                onPrev={handlePrevScripture}
                onNext={handleNextScripture}
                onSelectScripture={setActiveScriptureId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
