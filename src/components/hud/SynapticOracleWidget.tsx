import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronUp } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { DEFAULT_ORACLE_PLACEHOLDER } from '@/lib/ai/oracle-models'
import { AIChatPanel } from '../ai/AIChatPanel'
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
const DEFAULT_WIDTH = 384
const DEFAULT_HEIGHT = 640

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

/**
 * Shared styling classes for the rounded pill launcher (both mobile dock and desktop floating button).
 */
export const ORACLE_PILL_BASE_CLASSES =
  'bg-[#060b0ef2] backdrop-blur-xl border border-[#00c3ff]/40 hover:border-[#00c3ff]/80 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_20px_rgba(0,195,255,0.2)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.9),0_0_25px_rgba(0,195,255,0.35)] rounded-full px-4 py-2.5 flex items-center justify-between gap-3 group select-none text-left'

/**
 * Shared interior content for the Oracle launcher pill (emblem, placeholder, realistic caret, chevron).
 */
export function OracleLauncherPillContent() {
  return (
    <>
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none">
        <div className="relative shrink-0 flex items-center justify-center">
          <img
            src={getAssetUrl('/images/order_emblem.png')}
            alt="Oracle AI"
            className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(0,195,255,0.6)] group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="flex items-center min-w-0">
          <span className="text-xs tracking-wide text-cyan-200/90 font-medium group-hover:text-cyan-100 transition-colors truncate">
            {DEFAULT_ORACLE_PLACEHOLDER}
          </span>
          <span
            data-testid="oracle-caret-cursor"
            aria-hidden="true"
            className="inline-block w-[1.5px] h-3.5 ml-1 bg-[#00c3ff] shadow-[0_0_4px_#00c3ff] animate-caret-blink shrink-0"
          />
        </div>
      </div>
      <ChevronUp className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-300 transition-transform group-hover:-translate-y-0.5 shrink-0 ml-auto pointer-events-none" />
    </>
  )
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
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const resizeRef = useRef<{
    direction: ResizeDirection
    startX: number
    startY: number
    initW: number
    initH: number
    pointerId: number
  } | null>(null)

  const getSafePopoutDims = useCallback((size: { width: number; height: number } | null) => {
    if (typeof window === 'undefined') return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    const maxW = Math.max(MIN_WIDTH, window.innerWidth - 16)
    const maxH = Math.max(MIN_HEIGHT, window.innerHeight - 16)
    const targetW = size ? size.width : DEFAULT_WIDTH
    const targetH = size ? size.height : DEFAULT_HEIGHT
    return {
      width: clamp(targetW, MIN_WIDTH, maxW),
      height: clamp(targetH, MIN_HEIGHT, maxH),
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
        if (typeof parsed?.width === 'number' && typeof parsed?.height === 'number') {
          initialSize = getSafePopoutDims(parsed)
        }
      }
      updatePopoutSize(initialSize)
    } catch (err) {
      console.warn('Failed to load Oracle widget size from storage:', err)
      updatePopoutSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
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
      updatePopoutSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
    }
  }, [oracle?.mode, updatePopoutSize])

  const handleToggle = () => {
    if (oracle) {
      oracle.toggleMode()
    } else {
      setLocalIsOpen((prev) => !prev)
    }
  }

  // Animate the popout panel in/out — isRendered keeps it in the DOM during exit transition
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isPopoutActive) {
      setIsRendered(true)
      timer = setTimeout(() => setIsVisible(true), 20)
    } else if (isRendered) {
      setIsVisible(false)
      timer = setTimeout(() => setIsRendered(false), 280)
    }
    return () => clearTimeout(timer)
  }, [isPopoutActive])

  const handleClose = () => {
    // Kick off exit animation then actually close
    setIsVisible(false)
    setTimeout(() => {
      if (oracle) {
        oracle.setMode('closed')
      } else {
        setLocalIsOpen(false)
      }
    }, 280)
  }

  const handleMobileClose = useCallback(() => {
    if (oracle) {
      oracle.setMode('closed')
    } else {
      setLocalIsOpen(false)
    }
  }, [oracle])

  const mobilePillTouchStartYRef = useRef<number | null>(null)

  const handleMobilePillTouchStart = (e: React.TouchEvent) => {
    mobilePillTouchStartYRef.current = e.touches[0]?.clientY ?? null
  }

  const handleMobilePillTouchEnd = (e: React.TouchEvent) => {
    if (mobilePillTouchStartYRef.current !== null && e.changedTouches[0]) {
      const deltaY = mobilePillTouchStartYRef.current - e.changedTouches[0].clientY
      mobilePillTouchStartYRef.current = null
      // If swiped up by > 15px, open the tray
      if (deltaY > 15) {
        handleToggle()
      }
    }
  }

  const handleResetSize = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_POPOUT_SIZE)
    } catch {}
    clearStalePositionKeys()
    updatePopoutSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
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
      {/* ── Mobile: Bottom Pull-Up Prompt Pill Dock ── */}
      {!isPopoutActive && (
        <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 max-w-md mx-auto sm:hidden font-sans select-none pointer-events-auto">
          <button
            type="button"
            onClick={handleToggle}
            onTouchStart={handleMobilePillTouchStart}
            onTouchEnd={handleMobilePillTouchEnd}
            className={`${ORACLE_PILL_BASE_CLASSES} w-full cursor-pointer transition-all duration-200 active:scale-[0.98]`}
            aria-label="Open Oracle AI Tray"
            title="Tap or swipe up to consult Oracle AI"
          >
            <OracleLauncherPillContent />
          </button>
        </div>
      )}

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
          className="bg-[#080d0d] border-t border-cyan-500/40 rounded-t-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(0,195,255,0.15)]"
        >
          <AIChatPanel
            userId={userId}
            isCompact={true}
            onClose={handleMobileClose}
            personaName="SYNAPTIC ORACLE"
            className="h-full w-full border-none shadow-none"
          />
        </HudBottomSheet>
      )}

      {/* ── Desktop: Fixed Floating Launcher Button ── */}
      {!isMobile && !isPopoutActive && !isRendered && (
        <div className="hidden sm:block fixed z-40 right-6 bottom-4 font-sans select-none">
          <button
            type="button"
            onClick={handleToggle}
            className={`${ORACLE_PILL_BASE_CLASSES} cursor-pointer hover:scale-105 transition-transform`}
            title="Open Oracle AI"
            aria-label="Open Oracle AI Popout"
          >
            <OracleLauncherPillContent />
          </button>
        </div>
      )}

      {/* ── Desktop: Bottom-right popout with fade + scale-in ── */}
      {!isMobile && isRendered && (
        <div
          className={`fixed z-40 right-6 bottom-4 font-sans overflow-hidden shadow-2xl shadow-cyan-950/90 bg-[#080d0d] chamfer-corner border border-cyan-900/80 rounded-none hidden sm:block ${
            activeResizeDir ? 'select-none' : ''
          }`}
          style={{
            width: `${popoutSize.width}px`,
            height: `${popoutSize.height}px`,
            minWidth: `${MIN_WIDTH}px`,
            minHeight: `${MIN_HEIGHT}px`,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
            transition: 'opacity 220ms ease-out, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
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
            personaName="SYNAPTIC ORACLE"
            className="h-full w-full border-none shadow-none"
          />
        </div>
      )}
    </>
  )
}
