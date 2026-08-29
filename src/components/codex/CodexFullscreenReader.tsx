import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Printer,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { ScriptureItem } from '@/lib/codexData'
import {
  applyZoomScroll,
  clampCodexZoom,
  formatCodexZoom,
  isCompactCodexViewport,
  resolveCodexPageWidth,
  stepCodexZoom,
  toggleDoubleTapZoom,
  touchDistance,
} from '@/lib/codex-reader'
import { CodexDocumentSheet } from './CodexDocumentSheet'
import { CodexPdfPage } from './CodexPdfPage'

interface CodexFullscreenReaderProps {
  scriptures: ScriptureItem[]
  activeScripture: ScriptureItem
  activeIndex: number
  highlightedVerses: Record<number, boolean>
  copiedVerseIndex: number | null
  onSelectScripture: (id: string) => void
  onPrev: () => void
  onNext: () => void
  onToggleHighlight: (verseNumber: number) => void
  onCopyVerse: (verseNumber: number, text: string) => void
  onPrint: () => void
  onClose: () => void
}

export function CodexFullscreenReader({
  scriptures,
  activeScripture,
  activeIndex,
  highlightedVerses,
  copiedVerseIndex,
  onSelectScripture,
  onPrev,
  onNext,
  onToggleHighlight,
  onCopyVerse,
  onPrint,
  onClose,
}: CodexFullscreenReaderProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const lastTapRef = useRef(0)
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)

  const [zoom, setZoom] = useState(1)
  const [pageWidth, setPageWidth] = useState(720)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  zoomRef.current = zoom

  const fitPage = useCallback((nextZoom = 1) => {
    const viewport = viewportRef.current
    const width = viewport?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 720)
    setPageWidth(resolveCodexPageWidth(width))
    setZoom(clampCodexZoom(nextZoom))
  }, [])

  const setZoomAt = useCallback((nextZoom: number, origin?: { x: number; y: number }) => {
    const viewport = viewportRef.current
    const oldZoom = zoomRef.current
    const clamped = clampCodexZoom(nextZoom)
    if (viewport && origin && oldZoom !== clamped) {
      applyZoomScroll(viewport, oldZoom, clamped, origin.x, origin.y)
    }
    setZoom(clamped)
  }, [])

  const revealChrome = useCallback(() => {
    setChromeVisible(true)
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      if (!navOpen) setChromeVisible(false)
    }, 2800)
  }, [navOpen])

  useEffect(() => {
    const viewport = viewportRef.current
    const width = viewport?.clientWidth || window.innerWidth
    setPageWidth(resolveCodexPageWidth(width))
    setZoom(1)
  }, [])

  useEffect(() => {
    revealChrome()
  }, [revealChrome])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (Math.abs(zoomRef.current - 1) < 0.02) {
        const width = viewportRef.current?.clientWidth || window.innerWidth
        setPageWidth(resolveCodexPageWidth(width))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPrev()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNext()
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setZoomAt(stepCodexZoom(zoomRef.current, 1))
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        setZoomAt(stepCodexZoom(zoomRef.current, -1))
      }
      if (event.key === '0') {
        event.preventDefault()
        fitPage(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fitPage, onClose, onNext, onPrev, setZoomAt])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      const direction = event.deltaY > 0 ? -1 : 1
      setZoomAt(stepCodexZoom(zoomRef.current, direction), {
        x: event.clientX,
        y: event.clientY,
      })
      revealChrome()
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinchRef.current = {
          distance: touchDistance(event.touches[0], event.touches[1]),
          zoom: zoomRef.current,
        }
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && pinchRef.current && pinchRef.current.distance > 0) {
        event.preventDefault()
        const distance = touchDistance(event.touches[0], event.touches[1])
        const ratio = distance / pinchRef.current.distance
        setZoomAt(pinchRef.current.zoom * ratio, {
          x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
          y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
        })
      }
    }

    const onTouchEnd = () => {
      pinchRef.current = null
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('touchstart', onTouchStart, { passive: true })
    viewport.addEventListener('touchmove', onTouchMove, { passive: false })
    viewport.addEventListener('touchend', onTouchEnd)
    viewport.addEventListener('touchcancel', onTouchEnd)

    return () => {
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
      viewport.removeEventListener('touchend', onTouchEnd)
      viewport.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [revealChrome, setZoomAt])

  const handleViewportPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, a, textarea, input')) return

    const now = typeof performance !== 'undefined' ? performance.now() : 0
    if (now - lastTapRef.current < 280) {
      const next = toggleDoubleTapZoom(zoomRef.current)
      setZoomAt(next, { x: event.clientX, y: event.clientY })
      lastTapRef.current = 0
      revealChrome()
      return
    }
    lastTapRef.current = now
    setChromeVisible((visible) => !visible)
  }

  return (
    <div
      className="codex-reader-overlay fixed inset-0 z-[100000] bg-[#050708] flex flex-col overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Immersive Codex reader"
    >
      <div
        className="codex-reader-chrome no-print absolute inset-x-0 top-0 z-30"
        data-hidden={chromeVisible ? 'false' : 'true'}
        onMouseEnter={() => {
          setChromeVisible(true)
          if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
        }}
        onMouseLeave={() => {
          if (!navOpen) revealChrome()
        }}
      >
        <div className="codex-reader-chrome-bar flex items-center justify-between gap-2 px-2.5 sm:px-4 py-2 bg-[#0e1415]/92 backdrop-blur-md border-b border-[#293635] pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => {
                setNavOpen((open) => !open)
                setChromeVisible(true)
              }}
              className={`p-2 chamfer-corner border flex items-center justify-center transition-all min-w-[40px] min-h-[40px] ${
                navOpen
                  ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]'
                  : 'bg-[#151c1d] text-[#839493] border-[#293635] hover:text-white'
              }`}
              title="Toggle Canon Table of Contents Index"
              aria-label="Toggle Canon Table of Contents Index"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-xs font-cinzel font-bold text-[#f4ecd8] truncate">
                {activeScripture.title}
              </span>
              <span className="text-[10px] font-sans text-[#839493] truncate">
                {activeScripture.volumeName} • {activeScripture.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-0.5 bg-[#151c1d] border border-[#293635] chamfer-corner px-1 py-0.5 text-xs font-sans">
              <button
                onClick={onPrev}
                disabled={activeIndex <= 0}
                className="p-1.5 hover:bg-[#293635] rounded disabled:opacity-30 text-[#dfe3e3] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Previous Scripture"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5 text-[#00ffff] font-bold text-xs font-sans tabular-nums">
                {activeIndex + 1} / {scriptures.length}
              </span>
              <button
                onClick={onNext}
                disabled={activeIndex >= scriptures.length - 1}
                className="p-1.5 hover:bg-[#293635] rounded disabled:opacity-30 text-[#dfe3e3] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Next Scripture"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-0.5 bg-[#151c1d] border border-[#293635] chamfer-corner px-1 py-0.5 text-xs font-sans">
              <button
                onClick={() => setZoomAt(stepCodexZoom(zoom, -1))}
                className="p-1.5 hover:bg-[#293635] rounded text-[#839493] hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => fitPage(1)}
                className="px-1.5 text-[11px] text-[#a3b0af] hover:text-[#00ffff] tabular-nums min-w-[3.25rem]"
                title="Fit width"
                aria-label={`Zoom ${formatCodexZoom(zoom)}. Reset to fit width.`}
              >
                {formatCodexZoom(zoom)}
              </button>
              <button
                onClick={() => setZoomAt(stepCodexZoom(zoom, 1))}
                className="p-1.5 hover:bg-[#293635] rounded text-[#839493] hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => fitPage(1)}
                className="hidden sm:flex p-1.5 hover:bg-[#293635] rounded text-[#839493] hover:text-white"
                title="Fit width"
                aria-label="Fit width"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrint}
              className="hidden sm:flex p-2 text-[#00ffff] hover:bg-[#151c1d] chamfer-corner border border-[#293635] min-w-[40px] min-h-[40px] items-center justify-center"
              title="Print / Export PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#839493] hover:text-white hover:bg-[#ff5540]/20 hover:border-[#ff5540] chamfer-corner border border-[#293635] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Exit Fullscreen Overlay (ESC)"
              aria-label="Exit Fullscreen Overlay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {navOpen && (
          <>
            <button
              className="absolute inset-0 bg-black/50 z-20 md:hidden"
              aria-label="Close canon drawer"
              onClick={() => setNavOpen(false)}
            />
            <div className="absolute md:relative inset-y-0 left-0 w-[min(20rem,86vw)] bg-[#0e1415] border-r border-[#293635] p-3 overflow-y-auto space-y-1.5 z-20 font-sans pt-[4.5rem] md:pt-3">
              {scriptures.map((scripture) => {
                const isActive = scripture.id === activeScripture.id
                return (
                  <button
                    key={scripture.id}
                    onClick={() => {
                      onSelectScripture(scripture.id)
                      const width = viewportRef.current?.clientWidth || window.innerWidth
                      if (isCompactCodexViewport(width)) setNavOpen(false)
                    }}
                    className={`w-full text-left p-2.5 chamfer-corner border transition-all text-xs font-serif ${
                      isActive
                        ? 'bg-[#1a2425] border-[#00ffff] text-[#00ffff] font-bold shadow-sm'
                        : 'border-transparent text-[#839493] hover:text-[#dfe3e3] hover:bg-[#151c1d]'
                    }`}
                  >
                    <div className="text-[10px] font-sans text-[#00ffff]">{scripture.id}</div>
                    <div className="truncate font-semibold">{scripture.title}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div
          ref={viewportRef}
          className="codex-reader-viewport flex-1 overflow-auto"
          onClick={handleViewportPointer}
          onMouseMove={revealChrome}
        >
          <div className="codex-reader-well min-h-full flex justify-center items-start px-2 sm:px-6 py-16 sm:py-14 pb-24">
            <CodexPdfPage
              zoom={zoom}
              pageWidth={pageWidth}
              scriptureId={activeScripture.id}
              className="p-6 sm:p-10 md:p-14"
            >
              <CodexDocumentSheet
                scripture={activeScripture}
                pageIndex={activeIndex}
                pageCount={scriptures.length}
                highlightedVerses={highlightedVerses}
                copiedVerseIndex={copiedVerseIndex}
                onToggleHighlight={onToggleHighlight}
                onCopyVerse={onCopyVerse}
                onPrev={onPrev}
                onNext={onNext}
                onSelectScripture={onSelectScripture}
                compact
              />
            </CodexPdfPage>
          </div>
        </div>
      </div>

      <div
        className="codex-reader-chrome codex-reader-chrome-bottom no-print absolute inset-x-0 bottom-0 z-30 sm:hidden"
        data-hidden={chromeVisible ? 'false' : 'true'}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#0e1415]/92 backdrop-blur-md border-t border-[#293635] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onPrev}
            disabled={activeIndex <= 0}
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider border border-[#293635] text-[#dfe3e3] disabled:opacity-30 chamfer-corner"
          >
            Previous
          </button>
          <span className="text-[10px] font-sans text-[#839493]">
            Tap the leaf to rest the well
          </span>
          <button
            onClick={onNext}
            disabled={activeIndex >= scriptures.length - 1}
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider border border-[#293635] text-[#dfe3e3] disabled:opacity-30 chamfer-corner"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
