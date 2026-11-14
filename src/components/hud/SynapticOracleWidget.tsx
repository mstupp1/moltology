import React, { useState, useEffect, useRef, useCallback } from 'react'
import { OracleCoreGlyph } from '../ai/OracleCoreGlyph'
import { DEFAULT_ORACLE_PLACEHOLDER } from '@/lib/ai/oracle-models'
import { AIChatPanel } from '../ai/AIChatPanel'
import { usePanelPresence } from '@/hooks/usePanelPresence'
import { HudBottomSheet } from '../ui/HudBottomSheet'
import { useSafeOracle } from './OracleContext'

export interface SynapticOracleWidgetProps {
  userId?: string | null
}

const STORAGE_KEY_BTN_POS = 'moltology:oracle_button_pos'
const STORAGE_KEY_POPOUT_POS = 'moltology:oracle_popout_pos'
const STORAGE_KEY_POPOUT_SIZE = 'moltology:oracle_popout_size'

const MIN_WIDTH = 320
const MIN_HEIGHT = 500
const DEFAULT_WIDTH = 480
const DEFAULT_HEIGHT = 680

type ResizeDirection = 'nw' | 'n' | 'ne' | 'sw' | 'w'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function clearStalePositionKeys() {
  try {
    localStorage.removeItem(STORAGE_KEY_BTN_POS)
    localStorage.removeItem(STORAGE_KEY_POPOUT_POS)
  } catch {}
}

export const SynapticOracleWidget: React.FC<SynapticOracleWidgetProps> = ({ userId }) => {
  const oracle = useSafeOracle()

  // Local state fallback if used without provider
  const [localIsOpen, setLocalIsOpen] = useState(false)
  const isPopoutActive = oracle ? oracle.mode === 'popout' : localIsOpen

  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [popoutSize, setPopoutSize] = useState<{ width: number; height: number }>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })
  const popoutSizeRef = useRef<{ width: number; height: number }>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })

  const [activeResizeDir, setActiveResizeDir] = useState<ResizeDirection | null>(null)

  // Popout open/close animation state — mirrors HudBottomSheet pattern
  const { mounted: isRendered, visible: isVisible } = usePanelPresence(isPopoutActive && !isMobile)

  const resizeRef = useRef<{
    direction: ResizeDirection
    startX: number
    startY: number
    initW: number
    initH: number
    pointerId: number
  } | null>(null)

  const getSafePopoutDims = useCallback((size: { width: number; height: number } | null) => {
    if (typeof window === 'undefined' || window.innerWidth < 640) return size ?? { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    const maxW = Math.max(1, window.innerWidth - 24 - 16)
    const maxH = Math.max(1, window.innerHeight - 16 - 16)
    const targetW = size ? size.width : DEFAULT_WIDTH
    const targetH = size ? size.height : DEFAULT_HEIGHT
    return {
      width: clamp(targetW, Math.min(MIN_WIDTH, maxW), maxW),
      height: clamp(targetH, Math.min(MIN_HEIGHT, maxH), maxH),
    }
  }, [])

  const updatePopoutSize = useCallback((size: { width: number; height: number }, persist = false) => {
    popoutSizeRef.current = size
    setPopoutSize(size)
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY_POPOUT_SIZE, JSON.stringify(size))
      } catch {}
    }
  }, [])

  // Initial load from localStorage on mount
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 640)
    }

    clearStalePositionKeys()

    try {
      const savedSize = localStorage.getItem(STORAGE_KEY_POPOUT_SIZE)
      let initialSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
      if (savedSize) {
        const parsed = JSON.parse(savedSize)
        if (Number.isFinite(parsed?.width) && parsed.width > 0 && Number.isFinite(parsed?.height) && parsed.height > 0) {
          initialSize = getSafePopoutDims(parsed)
        }
      }
      updatePopoutSize(getSafePopoutDims(initialSize))
    } catch (err) {
      console.warn('Failed to load Oracle widget size from storage:', err)
      updatePopoutSize(getSafePopoutDims(null))
    }
  }, [getSafePopoutDims, updatePopoutSize])

  // Re-clamp size on window resize
  useEffect(() => {
    if (!isMounted) return
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640)
      }
      const clampedSize = getSafePopoutDims(popoutSizeRef.current)
      if (
        clampedSize.width !== popoutSizeRef.current.width ||
        clampedSize.height !== popoutSizeRef.current.height
      ) {
        updatePopoutSize(clampedSize, true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMounted, getSafePopoutDims, updatePopoutSize])

  // Reset popout size when leaving sidebar mode (X-close or switch to mini window)
  const prevOracleModeRef = useRef<string | null>(oracle ? oracle.mode : null)
  useEffect(() => {
    if (!oracle) return
    const prevMode = prevOracleModeRef.current
    const currentMode = oracle.mode
    prevOracleModeRef.current = currentMode

    if (prevMode === 'sidebar' && (currentMode === 'popout' || currentMode === 'closed')) {
      try {
        localStorage.removeItem(STORAGE_KEY_POPOUT_SIZE)
      } catch {}
      clearStalePositionKeys()
      updatePopoutSize(getSafePopoutDims(null))
    }
  }, [oracle?.mode, updatePopoutSize])

  const handleToggle = () => {
    if (oracle) {
      oracle.toggleMode()
    } else {
      setLocalIsOpen((prev) => !prev)
    }
  }

  const handleClose = () => {
    if (oracle) oracle.setMode('closed')
    else setLocalIsOpen(false)
  }

  const handleMobileClose = useCallback(() => {
    if (oracle) {
      oracle.setMode('closed')
    } else {
      setLocalIsOpen(false)
    }
  }, [oracle])

  const wasPopoutOpenRef = useRef(false)
  useEffect(() => {
    if (isPopoutActive) wasPopoutOpenRef.current = true
    if (wasPopoutOpenRef.current && !isPopoutActive && !isRendered) {
      wasPopoutOpenRef.current = false
      document.querySelector<HTMLButtonElement>(isMobile ? '[aria-label="Open Oracle AI Tray"]' : '[aria-label="Open Oracle AI Popout"]')?.focus()
    }
  }, [isPopoutActive, isRendered, isMobile])

  const handleResetSize = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_POPOUT_SIZE)
    } catch {}
    clearStalePositionKeys()
    updatePopoutSize(getSafePopoutDims(null))
  }

  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()

    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      initW: popoutSizeRef.current.width,
      initH: popoutSizeRef.current.height,
      pointerId: e.pointerId,
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    setActiveResizeDir(direction)
  }

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current || resizeRef.current.pointerId !== e.pointerId) return

    const { direction, startX, startY, initW, initH } = resizeRef.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    let nextW = initW
    let nextH = initH

    // Bottom-right anchored: left/top edges grow the window toward the interior
    if (direction.includes('w')) {
      nextW = initW - dx
    }
    if (direction.includes('n')) {
      nextH = initH - dy
    }

    updatePopoutSize(getSafePopoutDims({ width: nextW, height: nextH }))
  }

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current || resizeRef.current.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    resizeRef.current = null
    setActiveResizeDir(null)

    if (popoutSizeRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY_POPOUT_SIZE, JSON.stringify(popoutSizeRef.current))
      } catch {}
    }
  }

  const resizeHandleProps = (direction: ResizeDirection) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => handleResizePointerDown(e, direction),
    onPointerMove: handleResizePointerMove,
    onPointerUp: handleResizePointerUp,
    onPointerCancel: handleResizePointerUp,
    onDoubleClick: handleResetSize,
    title: 'Double-click to reset window size',
  })

  // Hide the floating button completely when sidebar drawer or dedicated page is active
  if (oracle?.mode === 'sidebar' || oracle?.mode === 'page') {
    return null
  }

  return (
    <>
      {/* Phones reach Oracle from the bottom bar, so there is no floating pill there. */}
      {/* ── Mobile: Gesture-driven Pull-Up Bottom Sheet Tray ── */}
      {isMobile && (
        <HudBottomSheet
          isOpen={isPopoutActive}
          onClose={handleMobileClose}
          contentLayout="fill"
          height="80dvh"
          maxHeight="85dvh"
          ariaLabel="Synaptic Oracle AI Assistant"
          containerClassName="sm:hidden font-sans"
          className="bg-surface-1 border-t border-line rounded-t-card shadow-menu"
        >
          <AIChatPanel
            userId={userId}
            isCompact={true}
            onClose={handleMobileClose}
            className="h-full w-full border-none shadow-none"
          />
        </HudBottomSheet>
      )}

      {/* ── Desktop: the synaptic core launcher; hovering slides out the prompt ── */}
      {!isMobile && !isPopoutActive && !isRendered && (
        <div className="hidden md:block fixed z-40 right-6 bottom-4 font-sans select-none">
          <button
            type="button"
            onClick={handleToggle}
            className="group relative flex items-center rounded-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-glow"
            title="Open Oracle AI"
            aria-label="Open Oracle AI Popout"
            data-testid="oracle-core-launcher"
          >
            <span
              aria-hidden
              className="pointer-events-none -mr-7 flex h-10 items-center overflow-hidden whitespace-nowrap rounded-full border border-line bg-surface-1/95 backdrop-blur-xl shadow-menu max-w-0 pl-0 pr-0 opacity-0 transition-[max-width,padding,opacity] duration-300 ease-out group-hover:max-w-[240px] group-hover:pl-4 group-hover:pr-10 group-hover:opacity-100 group-focus-visible:max-w-[240px] group-focus-visible:pl-4 group-focus-visible:pr-10 group-focus-visible:opacity-100 motion-reduce:transition-none"
            >
              <span className="text-xs tracking-wide text-ink-body font-medium">{DEFAULT_ORACLE_PLACEHOLDER}</span>
              <span
                data-testid="oracle-caret-cursor"
                className="inline-block w-[1.5px] h-3.5 ml-1 bg-cyan-glow animate-caret-blink shrink-0"
              />
            </span>
            <span className="relative transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none">
              <OracleCoreGlyph size={52} />
            </span>
          </button>
        </div>
      )}

      {/* ── Desktop: Bottom-right popout with fade and vertical motion ── */}
      {!isMobile && isRendered && (
        <div
          className={`fixed z-40 right-6 bottom-4 font-sans overflow-hidden transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none shadow-menu bg-surface-1 rounded-card border border-line hidden sm:block ${
            activeResizeDir ? 'select-none' : ''
          }`}
          aria-hidden={!isPopoutActive}
          inert={!isPopoutActive}
          style={{
            width: `${popoutSize.width}px`,
            height: `${popoutSize.height}px`,
            minWidth: `min(${MIN_WIDTH}px, calc(100vw - 40px))`,
            minHeight: `min(${MIN_HEIGHT}px, calc(100dvh - 32px))`,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
            transformOrigin: 'bottom right',
          }}
        >
          {/* Interior-facing resize handles (bottom-right stays anchored) */}
          <div
            {...resizeHandleProps('n')}
            className="absolute top-0 left-3 right-3 h-2 cursor-n-resize z-30"
          />
          <div
            {...resizeHandleProps('w')}
            className="absolute top-3 bottom-3 left-0 w-2 cursor-w-resize z-30"
          />
          <div
            {...resizeHandleProps('nw')}
            className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nw-resize z-40"
          />
          <div
            {...resizeHandleProps('ne')}
            className="absolute top-0 right-0 w-3.5 h-3.5 cursor-ne-resize z-40"
          />
          <div
            {...resizeHandleProps('sw')}
            className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-sw-resize z-40"
          />

          <AIChatPanel
            userId={userId}
            isCompact={true}
            onClose={handleClose}
            closeOnEscape
            className="h-full w-full border-none shadow-none"
          />
        </div>
      )}
    </>
  )
}
