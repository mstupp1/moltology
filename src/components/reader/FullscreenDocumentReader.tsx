import React, { useCallback, useEffect, useRef, useState } from 'react'
import '@/styles/codex.css'
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  CODEX_PAGE_WIDTH,
  applyZoomScroll,
  clampCodexZoom,
  formatCodexZoom,
  isCompactCodexViewport,
  resolveCodexPageWidth,
  stepCodexZoom,
  toggleDoubleTapZoom,
  touchDistance,
} from '@/lib/codex-reader'

export interface FullscreenDocumentItem {
  id: string
  title: string
  subtitle?: string
  /** Contents heading shown above the first item of each group. */
  group?: string
}

interface FullscreenDocumentReaderProps {
  items: FullscreenDocumentItem[]
  activeIndex: number
  overlayLabel: string
  tocToggleTitle?: string
  mobileHint?: string
  renderItem: (context: { zoom: number; pageWidth: number }) => React.ReactNode
  onPrev: () => void
  onNext: () => void
  onSelectItem: (id: string) => void
  onPrint?: () => void
  onClose: () => void
}

/**
 * Immersive fullscreen document reader for the codex. Owns
 * the viewport chrome (auto-hiding bars, zoom, pinch and double-tap scaling,
 * keyboard navigation, table-of-contents drawer) while the caller renders the
 * actual page content through renderItem.
 *
 * Layout is a true column: top chrome sits above the TOC + viewport row so the
 * sidebar never collides with the toolbar. While the TOC is open, chrome stays
 * pinned and visible.
 */
export function FullscreenDocumentReader({
  items,
  activeIndex,
  overlayLabel,
  tocToggleTitle = 'Show contents',
  mobileHint = 'Tap the page to show or hide controls',
  renderItem,
  onPrev,
  onNext,
  onSelectItem,
  onPrint,
  onClose,
}: FullscreenDocumentReaderProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const lastTapRef = useRef(0)
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)

  const [zoom, setZoom] = useState(1)
  const [pageWidth, setPageWidth] = useState(720)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  const activeItem = items[activeIndex]
  const showChrome = chromeVisible || navOpen

  zoomRef.current = zoom

  const fitPage = useCallback((nextZoom = 1) => {
    const viewport = viewportRef.current
    const width = viewport?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : CODEX_PAGE_WIDTH)
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
    if (navOpen) {
      setChromeVisible(true)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [navOpen])

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
        if (navOpen) {
          setNavOpen(false)
          return
        }
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
  }, [fitPage, navOpen, onClose, onNext, onPrev, setZoomAt])

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
    if (navOpen) {
      setChromeVisible(true)
      return
    }
    setChromeVisible((visible) => !visible)
  }

  const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
  const toolButton = `flex items-center justify-center min-w-10 min-h-10 rounded-control text-ink-muted hover:text-ink hover:bg-surface-3 disabled:opacity-30 disabled:pointer-events-none transition-colors ${focusRing}`

  return (
    <div
      className="codex-reader-overlay fixed inset-0 z-[100000] h-dvh w-dvw bg-abyss flex flex-col overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={overlayLabel}
    >
      <div
        className="codex-reader-chrome codex-reader-chrome-top no-print shrink-0 z-30"
        data-hidden={showChrome ? 'false' : 'true'}
        data-pinned={navOpen ? 'true' : 'false'}
        onMouseEnter={() => {
          setChromeVisible(true)
          if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
        }}
        onMouseLeave={() => {
          if (!navOpen) revealChrome()
        }}
      >
        <div className="codex-reader-chrome-bar grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:px-4 py-1.5 bg-surface-1/95 backdrop-blur-md border-b border-line-subtle pt-[max(0.375rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                setNavOpen((open) => !open)
                setChromeVisible(true)
              }}
              aria-pressed={navOpen}
              className={`${toolButton} ${navOpen ? 'bg-surface-3 text-cyan-glow' : ''}`}
              title={tocToggleTitle}
              aria-label={tocToggleTitle}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden md:flex flex-col min-w-0">
              <span className="text-sm font-garamond font-semibold text-ink truncate">{activeItem?.title}</span>
              {activeItem?.subtitle && (
                <span className="text-[11px] font-sans text-ink-muted truncate">{activeItem.subtitle}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 font-sans">
            <div className="hidden sm:flex items-center rounded-control bg-surface-2 border border-line-subtle">
              <button
                type="button"
                onClick={onPrev}
                disabled={activeIndex <= 0}
                className={toolButton}
                title="Previous"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1 text-xs font-bold text-ink tabular-nums whitespace-nowrap">
                {activeIndex + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={activeIndex >= items.length - 1}
                className={toolButton}
                title="Next"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center rounded-control bg-surface-2 border border-line-subtle">
              <button
                type="button"
                onClick={() => setZoomAt(stepCodexZoom(zoom, -1))}
                className={toolButton}
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fitPage(1)}
                className={`min-h-10 min-w-[3.25rem] px-1 text-xs text-ink-body hover:text-ink tabular-nums rounded-control ${focusRing}`}
                title="Fit width"
                aria-label={`Zoom ${formatCodexZoom(zoom)}. Reset to fit width.`}
              >
                {formatCodexZoom(zoom)}
              </button>
              <button
                type="button"
                onClick={() => setZoomAt(stepCodexZoom(zoom, 1))}
                className={toolButton}
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className={`hidden sm:flex ${toolButton}`}
                title="Print or save as PDF"
                aria-label="Print or save as PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={toolButton}
              title="Close reader (Esc)"
              aria-label="Close reader (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {navOpen && (
          <>
            <button
              type="button"
              className="absolute inset-0 bg-black/60 z-20 md:hidden"
              aria-label="Close contents"
              onClick={() => setNavOpen(false)}
            />
            <nav
              aria-label="Contents"
              className="absolute md:relative inset-y-0 left-0 w-[min(20rem,86vw)] shrink-0 bg-surface-1 border-r border-line-subtle py-2 overflow-y-auto overscroll-contain z-20 font-sans"
            >
              <ul>
                {items.map((item, index) => {
                  const isActive = item.id === activeItem?.id
                  const showGroup = item.group && (index === 0 || items[index - 1].group !== item.group)
                  return (
                    <li key={item.id}>
                      {showGroup && (
                        <div className="px-4 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                          {item.group}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectItem(item.id)
                          const width = viewportRef.current?.clientWidth || window.innerWidth
                          if (isCompactCodexViewport(width)) setNavOpen(false)
                        }}
                        aria-current={isActive ? 'true' : undefined}
                        className={`relative w-full text-left px-4 py-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                          isActive ? 'bg-surface-2 text-ink' : 'text-ink-body hover:text-ink hover:bg-surface-2'
                        }`}
                      >
                        {isActive && <span aria-hidden="true" className="absolute left-0 inset-y-0 w-[2px] bg-cyan-glow" />}
                        <span className="block font-garamond text-base leading-snug">{item.title}</span>
                        <span className="block text-[11px] text-ink-muted tabular-nums">{item.id}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </>
        )}

        <div
          ref={viewportRef}
          className="codex-reader-viewport flex-1 min-w-0 overflow-auto"
          onClick={handleViewportPointer}
          onMouseMove={revealChrome}
        >
          <div className="codex-reader-well min-h-full flex justify-center items-start px-2 sm:px-6 py-6 sm:py-10 pb-24">
            {renderItem({ zoom, pageWidth })}
          </div>
        </div>
      </div>

      <div
        className="codex-reader-chrome codex-reader-chrome-bottom no-print absolute inset-x-0 bottom-0 z-30 sm:hidden"
        data-hidden={showChrome ? 'false' : 'true'}
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-2 py-1.5 bg-surface-1/95 backdrop-blur-md border-t border-line-subtle pb-[max(0.375rem,env(safe-area-inset-bottom))] font-sans">
          <button
            type="button"
            onClick={onPrev}
            disabled={activeIndex <= 0}
            className={toolButton}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center min-w-0">
            <div className="text-xs font-bold text-ink tabular-nums">
              {activeIndex + 1} of {items.length}
            </div>
            <div className="text-[11px] text-ink-muted truncate">{mobileHint}</div>
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={activeIndex >= items.length - 1}
            className={toolButton}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
