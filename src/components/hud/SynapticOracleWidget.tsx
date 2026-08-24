import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getAssetUrl } from '@/lib/assets'
import { AIChatPanel } from '../ai/AIChatPanel'
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

type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export const SynapticOracleWidget: React.FC<SynapticOracleWidgetProps> = ({ userId }) => {
  const oracle = useSafeOracle()

  // Local state fallback if used without provider
  const [localIsOpen, setLocalIsOpen] = useState(false)
  const isPopoutActive = oracle ? oracle.mode === 'popout' : localIsOpen

  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Positions & sizes state + refs to prevent stale closure bugs
  const [buttonPos, setButtonPos] = useState<{ x: number; y: number } | null>(null)
  const buttonPosRef = useRef<{ x: number; y: number } | null>(null)

  const [popoutPos, setPopoutPos] = useState<{ x: number; y: number } | null>(null)
  const popoutPosRef = useRef<{ x: number; y: number } | null>(null)

  const [popoutSize, setPopoutSize] = useState<{ width: number; height: number }>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })
  const popoutSizeRef = useRef<{ width: number; height: number }>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })

  const [isDraggingButton, setIsDraggingButton] = useState(false)
  const [isDraggingWindow, setIsDraggingWindow] = useState(false)
  const [activeResizeDir, setActiveResizeDir] = useState<ResizeDirection | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const buttonDragRef = useRef<{
    startX: number
    startY: number
    initX: number
    initY: number
    hasMoved: boolean
    pointerId: number
  } | null>(null)

  const windowDragRef = useRef<{
    startX: number
    startY: number
    initX: number
    initY: number
    pointerId: number
  } | null>(null)

  const resizeRef = useRef<{
    direction: ResizeDirection
    startX: number
    startY: number
    initX: number
    initY: number
    initW: number
    initH: number
    pointerId: number
  } | null>(null)

  // Calculate safe button coordinates bounded to the viewport
  const getSafeButtonCoords = useCallback(
    (pos: { x: number; y: number } | null) => {
      if (typeof window === 'undefined') return { x: 0, y: 0 }
      const btnW = buttonRef.current?.offsetWidth || 150
      const btnH = buttonRef.current?.offsetHeight || 48
      const maxX = Math.max(8, window.innerWidth - btnW - 8)
      const maxY = Math.max(8, window.innerHeight - btnH - 8)
      if (!pos) {
        return {
          x: Math.max(8, window.innerWidth - btnW - 24),
          y: Math.max(8, window.innerHeight - btnH - 16),
        }
      }
      return {
        x: clamp(pos.x, 8, maxX),
        y: clamp(pos.y, 8, maxY),
      }
    },
    []
  )

  // Calculate safe popout size bounded to viewport
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

  // Calculate safe popout coordinates bounded to viewport
  const getSafePopoutCoords = useCallback(
    (pos: { x: number; y: number } | null, currentSize: { width: number; height: number }) => {
      if (typeof window === 'undefined') return { x: 0, y: 0 }
      const maxX = Math.max(8, window.innerWidth - currentSize.width - 8)
      const maxY = Math.max(8, window.innerHeight - currentSize.height - 8)
      if (!pos) {
        return {
          x: Math.max(8, window.innerWidth - currentSize.width - 24),
          y: Math.max(8, window.innerHeight - currentSize.height - 16),
        }
      }
      return {
        x: clamp(pos.x, 8, maxX),
        y: clamp(pos.y, 8, maxY),
      }
    },
    []
  )

  // Helpers to update and persist coordinates
  const updateButtonPos = useCallback((pos: { x: number; y: number } | null, persist = false) => {
    buttonPosRef.current = pos
    setButtonPos(pos)
    if (persist && pos) {
      try {
        localStorage.setItem(STORAGE_KEY_BTN_POS, JSON.stringify(pos))
      } catch {}
    }
  }, [])

  const updatePopoutPos = useCallback((pos: { x: number; y: number } | null, persist = false) => {
    popoutPosRef.current = pos
    setPopoutPos(pos)
    if (persist && pos) {
      try {
        localStorage.setItem(STORAGE_KEY_POPOUT_POS, JSON.stringify(pos))
      } catch {}
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

    try {
      const savedBtn = localStorage.getItem(STORAGE_KEY_BTN_POS)
      if (savedBtn) {
        const parsed = JSON.parse(savedBtn)
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          updateButtonPos(getSafeButtonCoords(parsed))
        } else {
          updateButtonPos(getSafeButtonCoords(null))
        }
      } else {
        updateButtonPos(getSafeButtonCoords(null))
      }

      const savedSize = localStorage.getItem(STORAGE_KEY_POPOUT_SIZE)
      let initialSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
      if (savedSize) {
        const parsed = JSON.parse(savedSize)
        if (typeof parsed?.width === 'number' && typeof parsed?.height === 'number') {
          initialSize = getSafePopoutDims(parsed)
        }
      }
      updatePopoutSize(initialSize)

      const savedPopoutPos = localStorage.getItem(STORAGE_KEY_POPOUT_POS)
      if (savedPopoutPos) {
        const parsed = JSON.parse(savedPopoutPos)
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          updatePopoutPos(getSafePopoutCoords(parsed, initialSize))
        } else {
          updatePopoutPos(getSafePopoutCoords(null, initialSize))
        }
      } else {
        updatePopoutPos(getSafePopoutCoords(null, initialSize))
      }
    } catch (err) {
      console.warn('Failed to load Oracle widget position from storage:', err)
      updateButtonPos(getSafeButtonCoords(null))
      const defaultDims = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
      updatePopoutSize(defaultDims)
      updatePopoutPos(getSafePopoutCoords(null, defaultDims))
    }
  }, [getSafeButtonCoords, getSafePopoutDims, getSafePopoutCoords, updateButtonPos, updatePopoutPos, updatePopoutSize])

  // Re-clamp on window resize without resetting position
  useEffect(() => {
    if (!isMounted) return
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640)
      }
      if (buttonPosRef.current) {
        const clampedBtn = getSafeButtonCoords(buttonPosRef.current)
        if (clampedBtn.x !== buttonPosRef.current.x || clampedBtn.y !== buttonPosRef.current.y) {
          updateButtonPos(clampedBtn, true)
        }
      }
      if (popoutSizeRef.current && popoutPosRef.current) {
        const clampedSize = getSafePopoutDims(popoutSizeRef.current)
        const clampedPos = getSafePopoutCoords(popoutPosRef.current, clampedSize)
        if (
          clampedSize.width !== popoutSizeRef.current.width ||
          clampedSize.height !== popoutSizeRef.current.height
        ) {
          updatePopoutSize(clampedSize, true)
        }
        if (clampedPos.x !== popoutPosRef.current.x || clampedPos.y !== popoutPosRef.current.y) {
          updatePopoutPos(clampedPos, true)
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMounted, getSafeButtonCoords, getSafePopoutDims, getSafePopoutCoords, updateButtonPos, updatePopoutPos, updatePopoutSize])

  const handleToggle = () => {
    if (oracle) {
      oracle.toggleMode()
    } else {
      setLocalIsOpen((prev) => !prev)
    }
  }

  const handleClose = () => {
    if (oracle) {
      oracle.setMode('closed')
    } else {
      setLocalIsOpen(false)
    }
  }

  const handleResetLayout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_BTN_POS)
      localStorage.removeItem(STORAGE_KEY_POPOUT_POS)
      localStorage.removeItem(STORAGE_KEY_POPOUT_SIZE)
    } catch {}

    const defaultDims = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    updatePopoutSize(defaultDims)
    updatePopoutPos(getSafePopoutCoords(null, defaultDims))
    updateButtonPos(getSafeButtonCoords(null))
  }

  // --- Button Drag Handlers ---
  const handleButtonPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    const currentCoords = buttonPosRef.current || getSafeButtonCoords(null)
    buttonDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentCoords.x,
      initY: currentCoords.y,
      hasMoved: false,
      pointerId: e.pointerId,
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    setIsDraggingButton(true)
  }

  const handleButtonPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!buttonDragRef.current || buttonDragRef.current.pointerId !== e.pointerId) return
    const dx = e.clientX - buttonDragRef.current.startX
    const dy = e.clientY - buttonDragRef.current.startY

    if (!buttonDragRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
      buttonDragRef.current.hasMoved = true
    }

    if (buttonDragRef.current.hasMoved) {
      const nextPos = getSafeButtonCoords({
        x: buttonDragRef.current.initX + dx,
        y: buttonDragRef.current.initY + dy,
      })
      updateButtonPos(nextPos)
    }
  }

  const handleButtonPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!buttonDragRef.current || buttonDragRef.current.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    const wasDrag = buttonDragRef.current.hasMoved
    buttonDragRef.current = null
    setIsDraggingButton(false)

    if (wasDrag) {
      if (buttonPosRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY_BTN_POS, JSON.stringify(buttonPosRef.current))
        } catch {}
      }
    } else {
      handleToggle()
    }
  }

  // --- Window Drag Handlers ---
  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a')
    ) {
      return
    }

    const currentCoords = popoutPosRef.current || getSafePopoutCoords(null, popoutSizeRef.current)
    windowDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentCoords.x,
      initY: currentCoords.y,
      pointerId: e.pointerId,
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    setIsDraggingWindow(true)
  }

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!windowDragRef.current || windowDragRef.current.pointerId !== e.pointerId) return
    const dx = e.clientX - windowDragRef.current.startX
    const dy = e.clientY - windowDragRef.current.startY

    const nextPos = getSafePopoutCoords(
      {
        x: windowDragRef.current.initX + dx,
        y: windowDragRef.current.initY + dy,
      },
      popoutSizeRef.current
    )
    updatePopoutPos(nextPos)
  }

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!windowDragRef.current || windowDragRef.current.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    windowDragRef.current = null
    setIsDraggingWindow(false)

    if (popoutPosRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY_POPOUT_POS, JSON.stringify(popoutPosRef.current))
      } catch {}
    }
  }

  // --- Window Resize Handlers ---
  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()

    const currentCoords = popoutPosRef.current || getSafePopoutCoords(null, popoutSizeRef.current)
    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentCoords.x,
      initY: currentCoords.y,
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

    const { direction, startX, startY, initX, initY, initW, initH } = resizeRef.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    const maxW = Math.max(MIN_WIDTH, window.innerWidth - 16)
    const maxH = Math.max(MIN_HEIGHT, window.innerHeight - 16)

    let nextW = initW
    let nextH = initH
    let nextX = initX
    let nextY = initY

    // Horizontal resizing
    if (direction.includes('e')) {
      nextW = clamp(initW + dx, MIN_WIDTH, maxW)
      if (nextX + nextW > window.innerWidth - 8) {
        nextW = window.innerWidth - 8 - nextX
      }
    } else if (direction.includes('w')) {
      const targetW = initW - dx
      nextW = clamp(targetW, MIN_WIDTH, maxW)
      nextX = initX + (initW - nextW)
      if (nextX < 8) {
        nextW = nextW - (8 - nextX)
        nextX = 8
      }
    }

    // Vertical resizing
    if (direction.includes('s')) {
      nextH = clamp(initH + dy, MIN_HEIGHT, maxH)
      if (nextY + nextH > window.innerHeight - 8) {
        nextH = window.innerHeight - 8 - nextY
      }
    } else if (direction.includes('n')) {
      const targetH = initH - dy
      nextH = clamp(targetH, MIN_HEIGHT, maxH)
      nextY = initY + (initH - nextH)
      if (nextY < 8) {
        nextH = nextH - (8 - nextY)
        nextY = 8
      }
    }

    const safeSize = getSafePopoutDims({ width: nextW, height: nextH })
    const safePos = getSafePopoutCoords({ x: nextX, y: nextY }, safeSize)

    updatePopoutSize(safeSize)
    updatePopoutPos(safePos)
  }

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current || resizeRef.current.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    resizeRef.current = null
    setActiveResizeDir(null)

    if (popoutSizeRef.current && popoutPosRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY_POPOUT_SIZE, JSON.stringify(popoutSizeRef.current))
        localStorage.setItem(STORAGE_KEY_POPOUT_POS, JSON.stringify(popoutPosRef.current))
      } catch {}
    }
  }

  // Hide the floating button completely when sidebar drawer or dedicated page is active
  if (oracle?.mode === 'sidebar' || oracle?.mode === 'page') {
    return null
  }

  const currentBtnPos = isMounted ? buttonPos || getSafeButtonCoords(null) : null
  const currentPopoutPos = isMounted ? popoutPos || getSafePopoutCoords(null, popoutSize) : null

  return (
    <>
      {!isPopoutActive ? (
        <div
          className={`fixed z-40 font-sans select-none ${
            isMounted ? '' : 'bottom-3 right-3 sm:right-6 sm:bottom-4'
          }`}
          style={
            currentBtnPos
              ? {
                  left: `${currentBtnPos.x}px`,
                  top: `${currentBtnPos.y}px`,
                  touchAction: 'none',
                }
              : undefined
          }
        >
          <button
            ref={buttonRef}
            onPointerDown={handleButtonPointerDown}
            onPointerMove={handleButtonPointerMove}
            onPointerUp={handleButtonPointerUp}
            onPointerCancel={handleButtonPointerUp}
            className={`bg-[#0f1414]/95 text-cyan-400 border border-cyan-500/60 p-2.5 sm:p-3 shadow-xl shadow-cyan-950/80 hover:border-cyan-400 flex items-center space-x-2 chamfer-corner group cursor-grab active:cursor-grabbing ${
              isDraggingButton ? 'scale-105' : 'hover:scale-105 transition-transform'
            }`}
            title="Drag to Move • Click to Open Oracle AI"
            aria-label="Open Oracle AI Popout"
          >
            <div className="relative pointer-events-none flex items-center justify-center">
              <img
                src={getAssetUrl('/images/order_emblem.png')}
                alt="Oracle AI"
                className="w-5 h-5 object-contain drop-shadow-[0_0_6px_rgba(0,195,255,0.4)] transition-transform"
              />
            </div>
            <span className="text-xs tracking-wider text-cyan-300 font-bold pointer-events-none">
              ORACLE AI
            </span>
          </button>
        </div>
      ) : (
        <div
          className={`fixed z-40 font-sans overflow-hidden shadow-2xl shadow-cyan-950/90 bg-[#080d0d] ${
            isMobile
              ? 'inset-x-0 bottom-0 w-full h-[75vh] max-h-[85dvh] border-t border-cyan-500/40 rounded-t-lg rounded-b-none'
              : `chamfer-corner border border-cyan-900/80 rounded-none ${
                  isMounted ? '' : 'bottom-3 right-3 sm:right-6 sm:bottom-4 w-[calc(100vw-1.5rem)] sm:w-96'
                } ${isDraggingWindow || activeResizeDir ? 'select-none' : ''}`
          }`}
          style={
            !isMobile && currentPopoutPos
              ? {
                  left: `${currentPopoutPos.x}px`,
                  top: `${currentPopoutPos.y}px`,
                  width: `${popoutSize.width}px`,
                  height: `${popoutSize.height}px`,
                  minWidth: `${MIN_WIDTH}px`,
                  minHeight: `${MIN_HEIGHT}px`,
                  touchAction: 'none',
                }
              : undefined
          }
        >
          {/* Resize handles only rendered on desktop / non-mobile */}
          {!isMobile && (
            <>
              {/* Edge Resize Handles - Clean invisible hit areas (double-click to reset) */}
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 'n')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute top-0 left-3 right-3 h-2 cursor-n-resize z-30"
                title="Double-click to reset window position & size"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 's')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize z-30"
                title="Double-click to reset window position & size"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 'w')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute top-3 bottom-3 left-0 w-2 cursor-w-resize z-30"
                title="Double-click to reset window position & size"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 'e')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute top-3 bottom-3 right-0 w-2 cursor-e-resize z-30"
                title="Double-click to reset window position & size"
              />

              {/* Corner Resize Handles - Clean invisible hit areas (double-click to reset) */}
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nw-resize z-40"
                title="Double-click to reset window position & size"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute top-0 right-0 w-3.5 h-3.5 cursor-ne-resize z-40"
                title="Double-click to reset window position & size"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-sw-resize z-40"
                title="Double-click to reset window position & size"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, 'se')}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onDoubleClick={handleResetLayout}
                className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize z-40"
                title="Double-click to reset window position & size"
              />
            </>
          )}

          {/* Main Chat Panel */}
          <AIChatPanel
            userId={userId}
            isCompact={true}
            onClose={handleClose}
            personaName="SYNAPTIC ORACLE"
            isDraggable={!isMobile}
            headerDragProps={
              !isMobile
                ? {
                    onPointerDown: handleHeaderPointerDown,
                    onPointerMove: handleHeaderPointerMove,
                    onPointerUp: handleHeaderPointerUp,
                    onPointerCancel: handleHeaderPointerUp,
                    onDoubleClick: handleResetLayout,
                    title: 'Drag header to move chat window (double-click edge or header to reset)',
                  }
                : undefined
            }
            className="h-full w-full border-none shadow-none"
          />
        </div>
      )}
    </>
  )
}
