import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePanelPresence } from '@/hooks/usePanelPresence'
import { AIChatPanel } from '../ai/AIChatPanel'
import { useSafeOracle } from './OracleContext'

export interface AISidebarDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  userId?: string | null
}

const STORAGE_KEY_SIDEBAR_WIDTH = 'moltology:oracle_sidebar_width'
export const SIDEBAR_MIN_WIDTH = 320
export const SIDEBAR_MAX_WIDTH = 720

/** Keeps the sidebar between its min width and the smaller of its max and 60% of the window. */
export function clampSidebarWidth(width: number, viewportWidth: number): number {
  const max = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.round(viewportWidth * 0.6)))
  return Math.round(Math.max(SIDEBAR_MIN_WIDTH, Math.min(max, width)))
}

export const AISidebarDrawer: React.FC<AISidebarDrawerProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  userId,
}) => {
  const oracle = useSafeOracle()
  // null until mount: the server render uses the default w-80/lg:w-96 classes.
  const [width, setWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number; pointerId: number } | null>(null)
  const asideRef = useRef<HTMLElement>(null)

  const isVisible = oracle ? oracle.mode === 'sidebar' : Boolean(propIsOpen)
  const presence = usePanelPresence(isVisible)
  const openerRef = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (!isVisible) return
    openerRef.current = document.activeElement as HTMLElement | null
    return () => {
      if (asideRef.current?.contains(document.activeElement) && openerRef.current?.isConnected) {
        openerRef.current.focus()
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY_SIDEBAR_WIDTH))
      if (Number.isFinite(saved) && saved > 0) setWidth(clampSidebarWidth(saved, window.innerWidth))
    } catch {}

    const handleResize = () => {
      setWidth((prev) => (prev == null ? prev : clampSidebarWidth(prev, window.innerWidth)))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isVisible])

  const persistWidth = useCallback((next: number | null) => {
    try {
      if (next == null) localStorage.removeItem(STORAGE_KEY_SIDEBAR_WIDTH)
      else localStorage.setItem(STORAGE_KEY_SIDEBAR_WIDTH, String(next))
    } catch {}
  }, [])

  if (!presence.mounted) return null

  const handleClose = () => {
    if (oracle) {
      oracle.setMode('closed')
    }
    if (propOnClose) {
      propOnClose()
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    const startWidth = width ?? asideRef.current?.getBoundingClientRect().width ?? SIDEBAR_MIN_WIDTH
    dragRef.current = { startX: e.clientX, startWidth, pointerId: e.pointerId }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    setIsResizing(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    // The sidebar is on the right, so dragging left makes it wider.
    setWidth(clampSidebarWidth(drag.startWidth + (drag.startX - e.clientX), window.innerWidth))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    dragRef.current = null
    setIsResizing(false)
    persistWidth(width)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const current = width ?? asideRef.current?.getBoundingClientRect().width ?? SIDEBAR_MIN_WIDTH
    const next = clampSidebarWidth(current + (e.key === 'ArrowLeft' ? 32 : -32), window.innerWidth)
    setWidth(next)
    persistWidth(next)
  }

  const handleReset = () => {
    setWidth(null)
    persistWidth(null)
  }

  return (
    <div
      className={`relative hidden md:block h-full shrink-0 ${isVisible && width == null ? 'w-80 lg:w-96' : ''}`}
      style={{ width: isVisible ? width ?? undefined : 0 }}
    >
      <aside
        ref={asideRef}
        aria-hidden={!isVisible}
        inert={!isVisible}
        style={width != null ? { width: `${width}px` } : undefined}
        className={`absolute inset-y-0 right-0 flex ${width == null ? 'w-80 lg:w-96' : ''} bg-surface-1 border-l border-line-subtle flex-col h-full z-30 shrink-0 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none shadow-2xl font-sans ${isResizing ? 'select-none' : ''} ${presence.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Oracle sidebar"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuenow={width ?? undefined}
          tabIndex={0}
          title="Drag to resize. Double-click to reset."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleReset}
          onKeyDown={handleKeyDown}
          className={`group absolute inset-y-0 -left-1 w-2 z-40 cursor-col-resize focus-visible:outline-hidden`}
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-[3px] w-px transition-colors ${
              isResizing ? 'bg-line-hover' : 'bg-transparent group-hover:bg-line group-focus-visible:bg-cyan-glow'
            }`}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <AIChatPanel
            userId={userId}
            isCompact={false}
            onClose={handleClose}
            className="h-full border-none shadow-none"
          />
        </div>
      </aside>
    </div>
  )
}
