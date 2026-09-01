import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Award,
  BookMarked,
  Clock,
  FlaskConical,
  Landmark,
  Maximize2,
  Menu,
  Microscope,
  Printer,
  Search,
  ShieldCheck,
} from 'lucide-react'
import type { JournalPaper } from '@/lib/journal-data'
import { INITIAL_JOURNAL_EDITORIAL_BOARD, JOURNAL_META } from '@/lib/journal-data'
import { PAPER_PALETTES } from '@/lib/paper-palette'
import { HudButton } from '@/components/ui'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useReaderPreferences } from '@/components/reader/useReaderPreferences'
import { FullscreenDocumentReader } from '@/components/reader/FullscreenDocumentReader'
import { ReaderPdfPage } from '@/components/reader/ReaderPdfPage'
import { JournalPaperSheet } from './JournalPaperSheet'
import { JournalPaperReader } from './JournalPaperReader'
import { JournalFeedTag } from './ScientificTable'
import '@/styles/editorial-fonts.css'
import { cn } from '@/lib/utils'

interface JournalReaderWorkspaceProps {
  papers: JournalPaper[]
  activeSlug?: string
  onNavigate?: (slug: string) => void
  showEditorial?: boolean
}

/**
 * The Benthic Compendium reading workspace. Mirrors the Sacred Codex reader:
 * an archive directory beside a themed reading pane, with an immersive
 * fullscreen overlay. Only the content differs — codex scriptures vs. journal
 * papers — and paper selection stays URL-driven through onNavigate.
 */
export function JournalReaderWorkspace({
  papers,
  activeSlug,
  onNavigate,
  showEditorial = false,
}: JournalReaderWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDirectory, setShowDirectory] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const preferences = useReaderPreferences('moltology_journal_reader_prefs')
  const paneRef = useRef<HTMLDivElement>(null)
  const prevSlugRef = useRef<string | null>(null)

  const activePaper = papers.find((p) => p.slug === activeSlug) ?? papers[0]

  const filteredPapers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return papers
    return papers.filter((p) =>
      [
        p.title,
        p.subtitle,
        p.paperNumber,
        p.category,
        p.classification,
        p.abstract,
        p.keywords.join(' '),
        p.authors.map((a) => a.name).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [papers, searchQuery])

  const activeNavIndex = filteredPapers.findIndex((p) => p.slug === activePaper?.slug)
  const navIndex = Math.max(0, activeNavIndex)

  const handleSelectPaper = (slug: string) => {
    setShowDirectory(false)
    onNavigate?.(slug)
  }

  const handlePrevPaper = () => {
    if (activeNavIndex > 0) handleSelectPaper(filteredPapers[activeNavIndex - 1].slug)
  }

  const handleNextPaper = () => {
    if (activeNavIndex >= 0 && activeNavIndex < filteredPapers.length - 1) {
      handleSelectPaper(filteredPapers[activeNavIndex + 1].slug)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  useEffect(() => {
    const slug = activePaper?.slug ?? null
    if (prevSlugRef.current === null) {
      prevSlugRef.current = slug
      return
    }
    if (slug && prevSlugRef.current !== slug) {
      prevSlugRef.current = slug
      if (typeof paneRef.current?.scrollIntoView === 'function') {
        paneRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
  }, [activePaper])

  if (!activePaper) return null

  const palette = PAPER_PALETTES[preferences.theme]
  const totalReadMinutes = papers.reduce((sum, p) => sum + p.readTimeMinutes, 0)

  return (
    <div className="flex flex-col gap-3 sm:gap-3.5 font-sans relative">
      {isFullscreen && (
        <FullscreenDocumentReader
          items={filteredPapers.map((p) => ({
            id: p.slug,
            title: p.title,
            subtitle: `${p.paperNumber} · ${p.category}`,
          }))}
          activeIndex={navIndex}
          overlayLabel="Immersive paper reader"
          tocToggleTitle="Toggle Paper Archive Index"
          mobileHint="Tap the sheet to rest the chrome"
          onPrev={handlePrevPaper}
          onNext={handleNextPaper}
          onSelectItem={handleSelectPaper}
          onPrint={handlePrint}
          onClose={() => setIsFullscreen(false)}
          renderItem={({ zoom, pageWidth }) => (
            <ReaderPdfPage
              zoom={zoom}
              pageWidth={pageWidth}
              pageId={activePaper.slug}
              className={cn(preferences.theme === 'night' && 'codex-dark-theme')}
              style={{ backgroundColor: palette.sheet, color: palette.ink }}
            >
              <JournalPaperSheet
                paper={activePaper}
                theme={preferences.theme}
                fontSize={preferences.fontSize}
                compact
              />
            </ReaderPdfPage>
          )}
        />
      )}

      <HudTitlePanel
        accent="teal"
        eyebrow={
          <>
            <FlaskConical className="w-3.5 h-3.5" />
            PEER-CERTIFIED TRANSMISSIONS
          </>
        }
        title={
          <>
            THE BENTHIC <span className="text-[#00c3ff]">COMPENDIUM</span>
          </>
        }
        description={JOURNAL_META.subtitle}
        actions={
          <>
            <div className="hidden sm:flex items-center gap-2 bg-[#070b0b] px-2.5 py-1 border border-[#3a4a49] chamfer-corner">
              <div className="flex flex-col text-center">
                <span className="text-[8px] text-[#839493]">PAPERS</span>
                <span className="text-xs font-bold text-[#00c3ff]">{papers.length}</span>
              </div>
              <div className="w-[1px] h-4 bg-[#3a4a49]" />
              <div className="flex flex-col text-center">
                <span className="text-[8px] text-[#839493]">MIN READ</span>
                <span className="text-xs font-bold text-[#dfe3e3]">{totalReadMinutes}</span>
              </div>
            </div>

            <button
              onClick={() => setShowDirectory((prev) => !prev)}
              className={cn(
                'lg:hidden px-3 py-1.5 text-xs font-bold font-sans border chamfer-corner flex items-center gap-1.5 transition-all',
                showDirectory
                  ? 'bg-[#00c3ff]/20 text-[#00c3ff] border-[#00c3ff]'
                  : 'bg-[#070b0b] text-[#839493] border-[#3a4a49] hover:text-[#00c3ff] hover:border-[#00c3ff]/60'
              )}
            >
              <Menu className="w-3.5 h-3.5" />
              <span>ARCHIVE</span>
            </button>

            <HudButton
              variant="cyan"
              size="sm"
              icon={<Maximize2 className="w-3.5 h-3.5" />}
              onClick={() => setIsFullscreen(true)}
              title="Fullscreen Paper Reader"
              className="font-sans text-xs uppercase font-bold tracking-wider whitespace-nowrap"
            >
              FULLSCREEN
            </HudButton>
          </>
        }
      >
        <div className="pt-1.5 space-y-1.5">
          <div className="text-[10px] text-[#839493] tracking-widest uppercase font-sans">
            {JOURNAL_META.issn} · {JOURNAL_META.volume} / {JOURNAL_META.issue} ·{' '}
            {JOURNAL_META.editionDate} · {papers.length} PAPER{papers.length === 1 ? '' : 'S'}{' '}
            ARCHIVED
          </div>
          <div className="h-[3px] w-44 bg-[#00c3ff]/80" />
          <div className="h-px w-28 bg-[#ff5540]/70" />
        </div>
      </HudTitlePanel>

      <div className="flex flex-col lg:flex-row gap-3.5 sm:gap-4 items-start">
        <div
          className={cn(
            'w-full lg:w-[300px] shrink-0 lg:sticky lg:top-0 overflow-hidden lg:overflow-visible',
            showDirectory ? 'max-h-[min(28rem,70dvh)]' : 'max-h-0 lg:max-h-[calc(100dvh-6.5rem)]'
          )}
        >
          <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl border border-[#3a4a49] flex flex-col max-h-[min(28rem,70dvh)] lg:max-h-[calc(100dvh-6.5rem)]">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-[#00c3ff]" />
                  <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wider uppercase">
                    PAPER ARCHIVE
                  </h2>
                </div>
                <span className="text-[9px] text-[#00c3ff] bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49]">
                  {filteredPapers.length} OF {papers.length}
                </span>
              </div>

              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-[#839493] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search papers, authors, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#070b0b] border border-[#3a4a49] focus:border-[#00c3ff] text-[#dfe3e3] placeholder-[#839493] pl-8 pr-7 py-1 text-xs font-sans outline-none chamfer-corner transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#839493] hover:text-[#00c3ff]"
                    aria-label="Clear archive search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1 touch-pan-y no-scrollbar hover:scrollbar-thin font-sans">
                {filteredPapers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#839493] bg-[#070b0b] border border-[#3a4a49] chamfer-corner">
                    No transmissions match that search. The archive holds its silence.
                  </div>
                ) : (
                  filteredPapers.map((p) => {
                    const isActive = p.slug === activePaper.slug

                    return (
                      <div
                        key={p.slug}
                        data-testid={`archive-card-${p.slug}`}
                        onClick={() => handleSelectPaper(p.slug)}
                        className={cn(
                          'p-2.5 border transition-all cursor-pointer chamfer-corner group space-y-1',
                          isActive
                            ? 'bg-[#00c3ff]/10 border-[#00c3ff] text-[#dfe3e3] shadow-[0_0_12px_rgba(0,195,255,0.15)]'
                            : 'bg-[#070b0b]/80 border-[#3a4a49] text-[#839493] hover:border-[#00c3ff]/50 hover:text-[#dfe3e3]'
                        )}
                      >
                        <div className="flex items-center justify-between text-[9px] gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={cn(
                                'font-bold font-sans px-1.5 py-0.2 border shrink-0',
                                isActive
                                  ? 'bg-[#00c3ff]/20 text-[#00c3ff] border-[#00c3ff]'
                                  : 'bg-[#030606] text-[#839493] border-[#3a4a49]'
                              )}
                            >
                              {p.paperNumber}
                            </span>
                            <span className="text-[#839493] bg-[#070b0b] px-1 py-0.2 border border-[#3a4a49] truncate">
                              {p.category}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 shrink-0 text-[#839493]">
                            <Clock className="w-2.5 h-2.5" />
                            {p.readTimeMinutes}M
                          </span>
                        </div>

                        <h3
                          className={cn(
                            'font-grotesk text-xs font-bold uppercase leading-snug',
                            isActive ? 'text-[#00c3ff]' : 'text-[#dfe3e3] group-hover:text-[#00c3ff]'
                          )}
                        >
                          {p.title}
                        </h3>

                        <p className="text-[10px] text-[#839493] line-clamp-1 leading-relaxed">
                          {p.authors.map((a) => a.name).join(' · ')} — {p.publishedDate}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full" ref={paneRef}>
          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl border border-[#3a4a49] flex flex-col">
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#00c3ff] shrink-0" />
                  <span className="text-[10px] font-sans font-bold text-[#00c3ff] tracking-widest uppercase truncate">
                    {JOURNAL_META.name}
                  </span>
                  <span className="text-[9px] text-[#9fd9e6] bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49] font-sans font-bold shrink-0">
                    {JOURNAL_META.volume} / {JOURNAL_META.issue}
                  </span>
                  <span className="text-[9px] text-[#839493] bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49] font-sans shrink-0">
                    {activePaper.classification}
                  </span>
                </div>
                <h2 className="font-grotesk text-sm sm:text-base font-bold text-[#dfe3e3] uppercase truncate">
                  {activePaper.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans shrink-0">
                <button
                  onClick={handlePrint}
                  className="p-1.5 bg-[#070b0b] hover:bg-[#141b1c] text-[#00c3ff] border border-[#3a4a49] hover:border-[#00c3ff]/60 chamfer-corner transition-colors"
                  title="Print or Export PDF"
                  aria-label="Print or Export PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 bg-[#070b0b] hover:bg-[#141b1c] text-[#00c3ff] border border-[#3a4a49] hover:border-[#00c3ff]/60 chamfer-corner transition-colors"
                  title="Fullscreen Paper Reader"
                  aria-label="Fullscreen Paper Reader"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <JournalPaperReader
              paper={activePaper}
              preferences={preferences}
              pageIndex={Math.max(0, activeNavIndex)}
              pageCount={filteredPapers.length || 1}
              onPrev={handlePrevPaper}
              onNext={handleNextPaper}
            />
          </div>
        </div>
      </div>

      {showEditorial && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
          <section className="lg:col-span-2 chitin-card chamfer-corner shadow-2xl border border-[#3a4a49] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3a4a49]/60 bg-[#0b1212]/90">
              <span className="font-grotesk font-bold text-xs uppercase tracking-widest text-[#dfe3e3] flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-[#00c3ff]" />
                Editorial Board
              </span>
              <span className="text-[9px] font-sans text-[#5f7a7a] uppercase tracking-widest">
                Peer-Certification Panel
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#3a4a49]/40">
              {INITIAL_JOURNAL_EDITORIAL_BOARD.map((member) => (
                <div key={member.name} className="bg-[#080d0d]/90 p-4">
                  <div className="font-cinzel font-semibold text-sm text-[#e8f1f1]">{member.name}</div>
                  <div className="text-[9px] font-sans uppercase tracking-widest text-[#00c3ff] mt-1">
                    {member.role}
                  </div>
                  <div className="text-[10px] text-[#839493] mt-0.5 font-sans">{member.affiliation}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="chitin-card chamfer-corner shadow-2xl border border-[#3a4a49] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#3a4a49]/60 bg-[#0b1212]/90">
              <Award className="w-3.5 h-3.5 text-[#ff5540]" />
              <span className="font-grotesk font-bold text-xs uppercase tracking-widest text-[#dfe3e3]">
                Submission Mandate
              </span>
            </div>
            <div className="p-4 space-y-3 text-[11px] leading-relaxed text-[#839493] font-sans">
              <p>
                Empirical transmissions that ground doctrinal pillars in verifiable science are
                received continuously from the sub-oceanic observatories.
              </p>
              <p>
                Every paper is subjected to the {JOURNAL_META.name} peer-certification protocol
                before entering the canonical archive.
              </p>
              <div className="pt-2 border-t border-[#3a4a49]/50 flex flex-wrap items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#10b981]" />
                <JournalFeedTag label="SCRIPTURE" />
                <JournalFeedTag label="SACRED METRICS" />
                <JournalFeedTag label="ORACLE PERSONA" />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default JournalReaderWorkspace
