import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePanelPresence } from '@/hooks/usePanelPresence'
import { useModalPanelFocus } from '@/hooks/useModalPanelFocus'

export interface HudBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  ariaLabel?: string
  className?: string
  dragThreshold?: number
  showHandle?: boolean
  height?: string
  maxHeight?: string
  overlayClassName?: string
  containerClassName?: string
  contentLayout?: 'default' | 'fill'
}

export const HudBottomSheet: React.FC<HudBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  ariaLabel = 'Modal Sheet',
  className = '',
  dragThreshold = 70,
  showHandle = true,
  height,
  maxHeight = '85dvh',
  overlayClassName = '',
  containerClassName = '',
  contentLayout = 'default',
}) => {
  const [mounted, setMounted] = useState(false)
  const { mounted: isRendered, visible: isVisible } = usePanelPresence(isOpen, 250)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const dragStartY = useRef(0)
  const currentDragY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  useModalPanelFocus(isOpen && isRendered && mounted, sheetRef)

  useEffect(() => {
    if (isOpen) {
      setDragOffset(0)
      setIsDragging(false)
    }
  }, [isOpen])

  // Body scroll lock
  useEffect(() => {
    if (isRendered && typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isRendered])

  const handleClose = useCallback(() => {
    if (isOpen) onClose()
  }, [isOpen, onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const layer = target?.closest?.('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')
      if (layer && layer !== sheetRef.current) return
      if (event.key === 'Escape' && !event.defaultPrevented && isOpen) {
        event.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // ── Drag Gestures (Touch & Pointer) ──
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStartY.current = clientY
    currentDragY.current = clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    currentDragY.current = clientY
    const delta = clientY - dragStartY.current

    if (delta > 0) {
      // Dragging downwards: move sheet with 1:1 finger tracking
      setDragOffset(delta)
    } else {
      // Dragging upwards: apply rubber-band damping
      setDragOffset(delta * 0.15)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const delta = currentDragY.current - dragStartY.current

    if (delta > dragThreshold) {
      // Dragged down past threshold: complete close
      handleClose()
    } else {
      // Snap back to open position
      setDragOffset(0)
    }
  }

  if (!mounted || !isRendered || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      data-hud-bottom-sheet=""
      className={`fixed inset-0 z-[99990] flex flex-col justify-end select-none font-sans ${containerClassName}`}
    >
      {/* Dimmed Backdrop Overlay */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-250 ease-out motion-reduce:transition-none ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${overlayClassName}`}
      />

      {/* Bottom Anchored Modal Sheet */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        inert={!isOpen}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
        aria-label={title || ariaLabel}
        style={{
          height,
          maxHeight,
          transform: isVisible ? `translateY(${Math.max(0, dragOffset)}px)` : 'translateY(100%)',
          transitionDuration: isDragging ? '0ms' : undefined,
        }}
        className={`relative transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-none z-[99991] w-full rounded-t-3xl bg-[#03090cfb] border-t-2 border-t-[#00c3ff]/70 border-x-0 border-b-0 shadow-[0_-20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(0,195,255,0.25)] backdrop-blur-2xl text-xs text-[#dfe3e3] ${
          contentLayout === 'fill'
            ? 'flex flex-col p-0 overflow-hidden'
            : 'p-4 pb-8 space-y-3 overflow-y-auto'
        } ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      >
        {/* Top Interactive Drag Handle Area */}
        {showHandle && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            aria-label="Drag handle to close"
            className={`w-full ${
              contentLayout === 'fill' ? 'py-2.5 pt-3 pb-2 shrink-0' : 'py-2 -mt-2 mb-1'
            } flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none`}
          >
            <div className="w-12 h-1 rounded-full bg-[#00c3ff]/40 hover:bg-[#00c3ff]/80 transition-colors" />
          </div>
        )}

        {/* Content */}
        {contentLayout === 'fill' ? (
          <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>,
    document.body
  )
}
