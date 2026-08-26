import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface HudBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  ariaLabel?: string
  className?: string
  dragThreshold?: number
  showHandle?: boolean
  maxHeight?: string
  overlayClassName?: string
  containerClassName?: string
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
  maxHeight = '85dvh',
  overlayClassName = '',
  containerClassName = '',
}) => {
  const [mounted, setMounted] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const dragStartY = useRef(0)
  const currentDragY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Smooth IN and OUT Transition State Machine
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isOpen) {
      setIsRendered(true)
      setDragOffset(0)
      // Small frame delay to ensure DOM render before activating CSS transition
      timer = setTimeout(() => {
        setIsVisible(true)
      }, 20)
    } else if (isRendered) {
      setIsVisible(false)
      // Wait for exit transition duration before removing from DOM
      timer = setTimeout(() => {
        setIsRendered(false)
        setDragOffset(0)
      }, 250)
    }

    return () => clearTimeout(timer)
  }, [isOpen, isRendered])

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

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRendered) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRendered])

  // Trigger smooth exit animation
  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 250)
  }, [onClose])

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
    <div className={`fixed inset-0 z-[99990] flex flex-col justify-end select-none font-sans ${containerClassName}`}>
      {/* Dimmed Backdrop Overlay */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-250 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${overlayClassName}`}
      />

      {/* Bottom Anchored Modal Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || ariaLabel}
        style={{
          maxHeight,
          transform: isVisible ? `translateY(${Math.max(0, dragOffset)}px)` : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease-out',
        }}
        className={`relative z-[99991] w-full rounded-t-3xl bg-[#03090cfb] border-t-2 border-t-[#00c3ff]/70 border-x-0 border-b-0 shadow-[0_-20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(0,195,255,0.25)] backdrop-blur-2xl p-4 pb-8 space-y-3 overflow-y-auto text-xs text-[#dfe3e3] ${
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
            className="w-full py-2 -mt-2 mb-1 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <div className="w-12 h-1 rounded-full bg-[#00c3ff]/40 hover:bg-[#00c3ff]/80 transition-colors" />
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>,
    document.body
  )
}
