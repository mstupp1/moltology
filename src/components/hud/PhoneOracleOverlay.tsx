import React, { useEffect, useRef, useState } from 'react'
import { AIChatPanel } from '../ai/AIChatPanel'
import { usePanelPresence } from '@/hooks/usePanelPresence'
import { useModalPanelFocus } from '@/hooks/useModalPanelFocus'

const SLIDE_MS = 320
/** A swipe has to start this close to the top (the panel header) to drag the overlay down. */
const SWIPE_ZONE_PX = 72
const SWIPE_CLOSE_PX = 110
const HISTORY_KEY = 'moltologyOracleOverlay'

export interface PhoneOracleOverlayProps {
  isOpen: boolean
  onClose: () => void
  userId?: string | null
}

/**
 * Phone Oracle: a full-screen overlay that slides up over the current page from the bottom
 * bar's core and slides back down to close, so the page underneath keeps its place.
 * Closes from the core, the X, Escape, a swipe down on its header, or the back gesture.
 */
export function PhoneOracleOverlay({ isOpen, onClose, userId }: PhoneOracleOverlayProps) {
  const { mounted, visible } = usePanelPresence(isOpen, SLIDE_MS)
  const panelRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const swipe = useRef<{ startY: number; dy: number; active: boolean } | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useModalPanelFocus(isOpen && mounted, panelRef)

  // The back gesture closes the overlay instead of leaving the page underneath.
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return
    let poppedByUser = false
    try {
      window.history.pushState({ ...(window.history.state ?? {}), [HISTORY_KEY]: true }, '')
    } catch {}
    const onPop = () => {
      poppedByUser = true
      onCloseRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // Closed some other way (core, X, swipe): drop the entry we added so Back still leaves the page.
      if (!poppedByUser && window.history.state?.[HISTORY_KEY]) {
        try {
          window.history.back()
        } catch {}
      }
    }
  }, [isOpen])

  if (!mounted) return null

  const handleTouchStart = (event: React.TouchEvent) => {
    const top = panelRef.current?.getBoundingClientRect().top ?? 0
    const y = event.touches[0].clientY
    swipe.current = y - top <= SWIPE_ZONE_PX ? { startY: y, dy: 0, active: false } : null
  }
  const handleTouchMove = (event: React.TouchEvent) => {
    const state = swipe.current
    if (!state) return
    const dy = event.touches[0].clientY - state.startY
    state.dy = dy
    if (!state.active && dy > 8) state.active = true
    if (state.active) setDrag(Math.max(0, dy))
  }
  const handleTouchEnd = () => {
    const state = swipe.current
    swipe.current = null
    if (state?.active && state.dy > SWIPE_CLOSE_PX) onClose()
    setDrag(null)
  }

  const offset = drag ?? 0

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Synaptic Oracle"
      data-testid="phone-oracle-overlay"
      tabIndex={-1}
      inert={!isOpen}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        transform: visible ? `translateY(${offset}px)` : 'translateY(100%)',
        transitionDuration: drag !== null ? '0ms' : `${SLIDE_MS}ms`,
      }}
      className="sm:hidden fixed inset-x-0 top-0 bottom-[calc(var(--hud-tabbar-height)+env(safe-area-inset-bottom,0px))] z-[99980] flex flex-col bg-surface-1 pt-[env(safe-area-inset-top,0px)] font-sans text-ink shadow-menu transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    >
      <AIChatPanel
        allowEntityMode
        userId={userId}
        onClose={onClose}
        closeOnEscape
        className="flex-1 min-h-0 h-full w-full border-none shadow-none bg-transparent"
      />
    </div>
  )
}
