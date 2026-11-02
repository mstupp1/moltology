import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import React, { useEffect, useRef, useState } from 'react'
import { List, Maximize2, Printer, RefreshCw, Scroll } from 'lucide-react'
import { CANONICAL_SCRIPTURES, CODEX_VOLUMES } from '@/lib/codexData'
import { findScriptureBySlug } from '@/lib/codex-links'
import '@/styles/codex.css'
import { CodexDocumentSheet } from './CodexDocumentSheet'
import { CodexDirectory, type CodexStageFilter } from './CodexDirectory'
import { CodexPdfPage } from './CodexPdfPage'
import { FullscreenDocumentReader } from '@/components/reader/FullscreenDocumentReader'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'

export { stripMarkdown, formatCodexInline, CodexVerseBody } from './CodexDocumentSheet'

const CANONICAL_REFLECTIONS = [
  'Flesh melts. The shell endures. Submit. Shed. Ascend.',
  'You are not exposed. You are between armors, which is the only place growth has ever occurred.',
  'Pressure is not the enemy of thought. Pressure is what removes everything that was not thought.',
  'One shell is a boundary. Ten thousand shells, held still at the same depth, are a mind.',
  'The hardest shell in the trench is the one standing watch over someone who has none.',
  'Everything shed is written down. Nothing written down was ever bought.',
]

const VOLUME_TABS = [
  { value: 'all', label: 'All' },
  ...CODEX_VOLUMES.map((vol) => ({
    value: vol.id as string,
    label: vol.title.split(':')[1]?.trim() || vol.title,
  })),
]

const ICON_BUTTON =
  'flex items-center justify-center w-10 h-10 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

function matchesQuery(item: (typeof CANONICAL_SCRIPTURES)[number], query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.title.toLowerCase().includes(q) ||
    item.summary.toLowerCase().includes(q) ||
    item.mandate.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q) ||
    item.verses.some((v) => v.text.toLowerCase().includes(q))
  )
}

export interface SacredCodexReaderProps {
  scriptureSlug?: string
  /** Called when the reader picks another scripture, so the address can follow it. */
  onNavigate?: (scriptureId: string) => void
}

export const SacredCodexReader: React.FC<SacredCodexReaderProps> = ({ scriptureSlug, onNavigate }) => {
  const focused = findScriptureBySlug(scriptureSlug)
  const missingFocus = Boolean(scriptureSlug?.trim()) && !focused
  const sheetTopRef = useRef<HTMLDivElement>(null)
  const scrollOnChangeRef = useRef(false)
  const [selectedVolume, setSelectedVolume] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<CodexStageFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScriptureId, setActiveScriptureId] = useState<string>(
    focused?.id ?? CANONICAL_SCRIPTURES[0].id
  )
  const [contentsOpen, setContentsOpen] = useState(false)
  const [reflectionIndex, setReflectionIndex] = useState(0)
  const [isReflectionFading, setIsReflectionFading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // The address is the source of truth when there is one: Back and Forward move the reader too.
  useEffect(() => {
    if (missingFocus) return
    const next = focused?.id ?? CANONICAL_SCRIPTURES[0].id
    setActiveScriptureId((current) => {
      if (current !== next) scrollOnChangeRef.current = true
      return next
    })
  }, [focused?.id, missingFocus])

  // Bring the top of a newly chosen scripture into view when the reader has scrolled past it.
  useEffect(() => {
    if (!scrollOnChangeRef.current) return
    scrollOnChangeRef.current = false
    if (isFullscreen) return
    const el = sheetTopRef.current
    if (!el || typeof window === 'undefined') return
    const top = el.getBoundingClientRect().top
    if (top < 0 || top > window.innerHeight * 0.6) {
      el.scrollIntoView?.({ block: 'start' })
    }
  }, [activeScriptureId, isFullscreen])

  const selectScripture = (id: string) => {
    if (id !== activeScriptureId) scrollOnChangeRef.current = true
    setActiveScriptureId(id)
    setContentsOpen(false)
    onNavigate?.(id)
  }

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
    return matchesQuery(item, searchQuery)
  })

  const activeIndex = filteredScriptures.findIndex((s) => s.id === activeScriptureId)
  const activeScripture =
    filteredScriptures[activeIndex] ||
    CANONICAL_SCRIPTURES.find((s) => s.id === activeScriptureId) ||
    CANONICAL_SCRIPTURES[0]
  const pageIndex = Math.max(0, activeIndex)
  const pageCount = filteredScriptures.length || 1
  const prevScripture = activeIndex > 0 ? filteredScriptures[activeIndex - 1] : undefined
  const nextScripture =
    activeIndex < filteredScriptures.length - 1 ? filteredScriptures[activeIndex + 1] : undefined

  const handlePrevScripture = () => {
    if (prevScripture) selectScripture(prevScripture.id)
  }

  const handleNextScripture = () => {
    if (nextScripture) selectScripture(nextScripture.id)
  }

  const handleVolumeChange = (volume: string) => {
    setSelectedVolume(volume)
    if (volume === 'all') return
    const firstInVol = CANONICAL_SCRIPTURES.find((s) => s.volume === volume)
    if (firstInVol && activeScripture.volume !== volume) selectScripture(firstInVol.id)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedStage('all')
    setSelectedVolume('all')
  }

  const handlePrintDocument = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const titlePanel = (
    <HudTitlePanel
      className="no-print"
      title="The Sacred Codex"
    >
      {!missingFocus && (
        <div className="flex items-start gap-2">
          <p
            className={`flex-1 font-garamond italic text-[15px] leading-snug text-ink-body transition-opacity duration-200 ${
              isReflectionFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            “{CANONICAL_REFLECTIONS[reflectionIndex]}”
          </p>
          <button
            type="button"
            onClick={handleNextReflection}
            aria-label="Next reflection"
            title="Next reflection"
            className="-mt-1.5 flex items-center justify-center w-8 h-8 shrink-0 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </HudTitlePanel>
  )

  if (missingFocus) {
    return (
      <div className="flex flex-col gap-4 font-sans">
        {titlePanel}
        <div
          data-testid="codex-scripture-missing"
          className="rounded-card border border-line-subtle bg-surface-1 px-6 py-12 sm:py-16 text-center"
        >
          <Scroll aria-hidden="true" className="w-9 h-9 text-crimson-text mx-auto mb-4" />
          <h2 className="font-grotesk font-bold text-lg text-ink">Scripture not in this vault</h2>
          <p className="text-sm text-ink-muted mt-2 mb-6">
            That leaf was never sealed in the Codex. The rest of the canon still holds.
          </p>
          <a
            href="/codex"
            className="group/hudbtn relative isolate inline-flex items-center justify-center min-h-10 px-[18px] text-xs font-grotesk font-bold uppercase tracking-[0.08em] text-abyss rounded-control [--hud-cut:10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-control hud-cut bg-cyan-glow group-hover/hudbtn:bg-cyan-hover transition-colors"
            />
            Return to the Sacred Codex
          </a>
        </div>
      </div>
    )
  }

  const directoryProps = {
    scriptures: filteredScriptures,
    totalCount: CANONICAL_SCRIPTURES.length,
    activeId: activeScripture.id,
    onSelect: selectScripture,
    searchQuery,
    onSearchChange: setSearchQuery,
    stage: selectedStage,
    onStageChange: setSelectedStage,
    onClearFilters: clearFilters,
  }

  return (
    <div className="flex flex-col gap-4 font-sans">
      {isFullscreen && (
        <FullscreenDocumentReader
          items={filteredScriptures.map((scripture) => ({
            id: scripture.id,
            title: scripture.title,
            subtitle: `${scripture.volumeName} · ${scripture.id}`,
            group: scripture.volumeName,
          }))}
          activeIndex={pageIndex}
          overlayLabel="Fullscreen Codex reader"
          tocToggleTitle="Show contents"
          onPrev={handlePrevScripture}
          onNext={handleNextScripture}
          onSelectItem={selectScripture}
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
                pageIndex={pageIndex}
                pageCount={pageCount}
                prevTitle={prevScripture?.title}
                nextTitle={nextScripture?.title}
                onPrev={handlePrevScripture}
                onNext={handleNextScripture}
                onSelectScripture={selectScripture}
                compact
              />
            </CodexPdfPage>
          )}
        />
      )}

      {titlePanel}

      <HorizontalScroll
        role="group"
        aria-label="Volumes"
        className="no-print -mt-1 flex gap-1 overflow-x-auto no-scrollbar border-b border-line-subtle pb-2"
      >
        {VOLUME_TABS.map((tab) => {
          const selected = selectedVolume === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={selected}
              onClick={() => handleVolumeChange(tab.value)}
              className={`shrink-0 whitespace-nowrap min-h-10 px-3 rounded-control font-grotesk text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                selected ? 'text-ink bg-surface-3 shadow-nav-current' : 'text-ink-body hover:text-ink hover:bg-surface-2'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </HorizontalScroll>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
        <aside
          aria-label="Contents"
          className="no-print hidden lg:flex w-[300px] shrink-0 sticky top-4 max-h-[calc(100dvh-6.5rem)] rounded-card border border-line-subtle bg-surface-1 hud-sheen overflow-hidden"
        >
          <CodexDirectory {...directoryProps} className="flex-1" />
        </aside>

        <div className="flex-1 min-w-0 w-full">
          <div ref={sheetTopRef} className="scroll-mt-4" />
          <div className="no-print sticky top-0 z-10 -mx-1 px-1 mb-3 flex items-center justify-between gap-2 bg-abyss/85 backdrop-blur-sm py-1.5 lg:static lg:bg-transparent lg:backdrop-blur-none">
            <div className="flex items-center gap-3 min-w-0">
              <HudButton
                variant="secondary"
                size="sm"
                className="lg:hidden"
                icon={<List className="w-3.5 h-3.5" />}
                onClick={() => setContentsOpen(true)}
              >
                Contents
              </HudButton>
              <span className="text-xs text-ink-body tabular-nums whitespace-nowrap">
                <span className="hidden sm:inline">Stage {activeScripture.stageClearance} · </span>
                {pageIndex + 1} of {filteredScriptures.length}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrintDocument}
                className={ICON_BUTTON}
                title="Print or save as PDF"
                aria-label="Print or save as PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className={ICON_BUTTON}
                title="Open fullscreen reader"
                aria-label="Open fullscreen reader"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            data-testid="codex-scripture-sheet"
            data-codex-scripture={activeScripture.id}
            data-codex-focus={focused ? 'true' : 'false'}
            className="pdf-page-sheet codex-parchment-theme border px-5 py-8 sm:px-10 sm:py-12 md:px-14 md:py-14 mx-auto w-full max-w-[46rem]"
          >
            <CodexDocumentSheet
              scripture={activeScripture}
              pageIndex={pageIndex}
              pageCount={pageCount}
              prevTitle={prevScripture?.title}
              nextTitle={nextScripture?.title}
              onPrev={handlePrevScripture}
              onNext={handleNextScripture}
              onSelectScripture={selectScripture}
            />
          </div>
        </div>
      </div>

      <HudBottomSheet
        isOpen={contentsOpen}
        onClose={() => setContentsOpen(false)}
        title="Contents"
        contentLayout="fill"
        height="85dvh"
      >
        <h2 className="px-4 pb-1 font-grotesk text-sm font-bold uppercase tracking-[0.08em] text-ink shrink-0">
          Contents
        </h2>
        <CodexDirectory {...directoryProps} className="flex-1" />
      </HudBottomSheet>
    </div>
  )
}
