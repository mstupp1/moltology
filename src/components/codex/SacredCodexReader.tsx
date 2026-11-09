import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, List, Maximize2, Printer, Scroll } from 'lucide-react'
import { CANONICAL_SCRIPTURES, type ScriptureItem } from '@/lib/codexData'
import { codexVerseAnchor, findScriptureBySlug, verseNumberFromHash } from '@/lib/codex-links'
import '@/styles/codex.css'
import { CodexDocumentSheet } from './CodexDocumentSheet'
import { CodexDirectory, type CodexStageFilter } from './CodexDirectory'
import { CodexPdfPage } from './CodexPdfPage'
import { FullscreenDocumentReader } from '@/components/reader/FullscreenDocumentReader'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'

export { stripMarkdown, formatCodexInline, CodexVerseBody } from './CodexDocumentSheet'

/** Where /codex reopens: the last scripture this browser read. */
export const CODEX_LAST_READ_KEY = 'moltology:codex:last-read'

const ICON_BUTTON =
  'flex items-center justify-center w-10 h-10 shrink-0 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** Searches shorter than this filter the list but are not marked in the text. */
const MIN_HIGHLIGHT = 2

function matchesQuery(item: ScriptureItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.title.toLowerCase().includes(q) ||
    item.summary.toLowerCase().includes(q) ||
    item.mandate.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q) ||
    item.verses.some((v) => v.text.toLowerCase().includes(q) || (v.heading ?? '').toLowerCase().includes(q))
  )
}

function countMatches(item: ScriptureItem, query: string): number {
  const q = query.trim().toLowerCase()
  if (q.length < MIN_HIGHLIGHT) return 0
  const texts = [item.title, item.mandate, ...item.verses.flatMap((v) => [v.heading ?? '', v.text])]
  let total = 0
  for (const text of texts) {
    const haystack = text.toLowerCase()
    let from = haystack.indexOf(q)
    while (from !== -1) {
      total += 1
      from = haystack.indexOf(q, from + q.length)
    }
  }
  return total
}

function readLastRead(): string | undefined {
  try {
    return window.localStorage.getItem(CODEX_LAST_READ_KEY) ?? undefined
  } catch {
    return undefined
  }
}

function saveLastRead(id: string) {
  try {
    window.localStorage.setItem(CODEX_LAST_READ_KEY, id)
  } catch {
    // Private windows and blocked storage just skip the reminder.
  }
}

export interface CodexNavigateOptions {
  /** Verse to open at; the address gets #verse-N. */
  verse?: number
  /** Replace the current history entry instead of adding one. */
  replace?: boolean
}

export interface SacredCodexReaderProps {
  scriptureSlug?: string
  /** Called when the reader picks another scripture or verse, so the address can follow it. */
  onNavigate?: (scriptureId: string, options?: CodexNavigateOptions) => void
  /** Address hash such as verse-3; the reader scrolls to that verse. */
  verseHash?: string
}

export const SacredCodexReader: React.FC<SacredCodexReaderProps> = ({ scriptureSlug, onNavigate, verseHash }) => {
  const focusedSummary = findScriptureBySlug(scriptureSlug)
  const focused = focusedSummary ? CANONICAL_SCRIPTURES.find((s) => s.id === focusedSummary.id) : undefined
  const missingFocus = Boolean(scriptureSlug?.trim()) && !focused
  const sheetTopRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  // Set when the open scripture changes: 'pick' from the reader itself, 'address' from the URL.
  const scrollOnChangeRef = useRef<false | 'pick' | 'address'>(false)
  const restoreCheckedRef = useRef(false)
  const [selectedStage, setSelectedStage] = useState<CodexStageFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScriptureId, setActiveScriptureId] = useState<string>(
    focused?.id ?? CANONICAL_SCRIPTURES[0].id
  )
  const [activeVerse, setActiveVerse] = useState<number | undefined>(undefined)
  const [contentsOpen, setContentsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const query = searchQuery.trim()
  const highlight = query.length >= MIN_HIGHLIGHT ? query : undefined

  // The address is the source of truth when there is one: Back and Forward move the reader too.
  useEffect(() => {
    if (missingFocus) return
    const next = focused?.id ?? CANONICAL_SCRIPTURES[0].id
    setActiveScriptureId((current) => {
      if (current !== next) scrollOnChangeRef.current = 'address'
      return next
    })
  }, [focused?.id, missingFocus])

  // /codex with no scripture reopens the last one read here; after that, remember each one opened.
  useEffect(() => {
    if (missingFocus) return
    if (!restoreCheckedRef.current) {
      restoreCheckedRef.current = true
      if (!scriptureSlug) {
        const saved = readLastRead()
        if (saved && saved !== activeScriptureId && CANONICAL_SCRIPTURES.some((s) => s.id === saved)) {
          setActiveScriptureId(saved)
          onNavigate?.(saved, { replace: true })
          return
        }
      }
    }
    saveLastRead(activeScriptureId)
    // onNavigate and scriptureSlug are only read on the first pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScriptureId, missingFocus])

  // Bring the top of a newly chosen scripture (or its first search hit) into view.
  useEffect(() => {
    const reason = scrollOnChangeRef.current
    if (!reason) return
    scrollOnChangeRef.current = false
    setActiveVerse(undefined)
    if (isFullscreen || typeof window === 'undefined') return
    // An address with #verse-N is handled by the verse effect below.
    if (reason === 'address' && verseNumberFromHash(verseHash) !== undefined) return
    const hit = highlight ? sheetRef.current?.querySelector<HTMLElement>('[data-codex-hit]') : null
    if (hit) {
      hit.scrollIntoView?.({ block: 'center' })
      return
    }
    const el = sheetTopRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top
    if (top < 0 || top > window.innerHeight * 0.6) {
      el.scrollIntoView?.({ block: 'start' })
    }
    // Only a change of scripture should move the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScriptureId, isFullscreen])

  // A link such as /codex/scr-030#verse-3 opens at that verse once the scripture is showing.
  useEffect(() => {
    if (isFullscreen || typeof window === 'undefined') return
    const verse = verseNumberFromHash(verseHash)
    if (verse === undefined) return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(codexVerseAnchor(verse))?.scrollIntoView?.({ block: 'start' })
      setActiveVerse(verse)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeScriptureId, isFullscreen, verseHash])

  // Track which section is being read so the contents list can mark it.
  useEffect(() => {
    if (isFullscreen || typeof window === 'undefined') return
    let frame = 0
    const update = () => {
      frame = 0
      const sections = sheetRef.current?.querySelectorAll<HTMLElement>('section[id^="verse-"]')
      if (!sections?.length) return
      const line = Math.min(160, window.innerHeight * 0.3)
      let current: number | undefined
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = verseNumberFromHash(section.id)
        else break
      }
      setActiveVerse(current)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [activeScriptureId, isFullscreen])

  const selectScripture = (id: string) => {
    if (id !== activeScriptureId) scrollOnChangeRef.current = 'pick'
    setActiveScriptureId(id)
    setContentsOpen(false)
    onNavigate?.(id)
  }

  const selectVerse = (verseNumber: number) => {
    const wasOpen = contentsOpen
    setContentsOpen(false)
    setActiveVerse(verseNumber)
    const jump = () =>
      document.getElementById(codexVerseAnchor(verseNumber))?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
    // Let the phone sheet release the page before scrolling it.
    if (wasOpen) window.setTimeout(jump, 220)
    else jump()
    onNavigate?.(activeScriptureId, { verse: verseNumber })
  }

  const filteredScriptures = CANONICAL_SCRIPTURES.filter((item) => {
    if (selectedStage !== 'all' && item.stageClearance !== selectedStage) return false
    return matchesQuery(item, searchQuery)
  })

  const matchCounts = useMemo(() => {
    if (!highlight) return undefined
    const counts: Record<string, number> = {}
    for (const item of filteredScriptures) counts[item.id] = countMatches(item, highlight)
    return counts
    // filteredScriptures is derived from these two values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, selectedStage])

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

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedStage('all')
  }

  const handlePrintDocument = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (missingFocus) {
    return (
      <div className="flex flex-col gap-4 font-sans">
        <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-ink tracking-tight">The Sacred Codex</h1>
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
    onSelectVerse: selectVerse,
    activeVerse,
    searchQuery,
    onSearchChange: setSearchQuery,
    stage: selectedStage,
    onStageChange: setSelectedStage,
    onClearFilters: clearFilters,
    matchCounts,
  }

  const actions = (
    <div className="flex items-center gap-0.5 shrink-0">
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
  )

  return (
    <div className="flex flex-col font-sans">
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

      <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 items-start">
        <aside
          aria-label="Contents"
          className="no-print hidden lg:flex flex-col w-[300px] shrink-0 sticky top-4 h-[calc(100dvh-3.5rem)] max-h-[60rem] rounded-card border border-line-subtle bg-surface-1 overflow-hidden"
        >
          <p aria-hidden="true" className="px-4 pt-4 pb-1 shrink-0 font-grotesk font-extrabold text-xl text-ink tracking-tight">
            The Sacred Codex
          </p>
          <CodexDirectory {...directoryProps} className="flex-1" />
        </aside>

        <div className="flex-1 min-w-0 w-full">
          <h1 className="sr-only">The Sacred Codex</h1>
          <div ref={sheetTopRef} className="scroll-mt-20 lg:scroll-mt-4" />

          {/* Phone: one slim sticky bar where tapping the title opens the contents. Desktop: position and actions. */}
          <div className="no-print sticky -top-2.5 sm:-top-4 md:-top-6 z-10 -mx-2.5 sm:-mx-4 md:-mx-6 px-1.5 sm:px-2 mb-3 flex items-center gap-1 bg-abyss/90 backdrop-blur-sm border-b border-line-subtle lg:static lg:mx-0 lg:px-0 lg:bg-transparent lg:backdrop-blur-none lg:border-0">
            <button
              type="button"
              onClick={() => setContentsOpen(true)}
              aria-label={`Contents, reading ${activeScripture.title}`}
              className="lg:hidden flex-1 min-w-0 flex items-center gap-2.5 min-h-12 px-2 rounded-control text-left hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <List aria-hidden="true" className="w-4 h-4 shrink-0 text-ink-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted tabular-nums">
                  Codex · {pageIndex + 1} of {filteredScriptures.length}
                </span>
                <span className="block truncate text-sm font-semibold text-ink">{activeScripture.title}</span>
              </span>
              <ChevronDown aria-hidden="true" className="w-4 h-4 shrink-0 text-ink-muted" />
            </button>
            <span className="hidden lg:inline flex-1 text-xs text-ink-body tabular-nums whitespace-nowrap">
              Stage {activeScripture.stageClearance} · {pageIndex + 1} of {filteredScriptures.length}
            </span>
            {actions}
          </div>

          <div
            ref={sheetRef}
            data-testid="codex-scripture-sheet"
            data-codex-scripture={activeScripture.id}
            data-codex-focus={focused ? 'true' : 'false'}
            className="pdf-page-sheet codex-parchment-theme border px-5 py-7 sm:px-10 sm:py-12 md:px-14 md:py-14 mx-auto w-full max-w-[46rem]"
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
              anchorVerses
              highlight={highlight}
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
