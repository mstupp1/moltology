import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useModalPanelFocus } from '@/hooks/useModalPanelFocus'
import { usePanelPresence } from '@/hooks/usePanelPresence'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { LobsterAvatarFullBody } from './LobsterAvatarFullBody'

export interface CharacterOverlayProps {
  isOpen: boolean
  onClose: () => void
  config: LobsterAvatarConfig | null | undefined
  /** Whose character this is, for the heading and screen readers. */
  name: string
}

/**
 * The whole character, large, over the page. Full screen on a phone and a centred panel on a
 * desktop. In 3D it can be dragged to turn. Escape, the close button or a tap outside closes it.
 */
export function CharacterOverlay({ isOpen, onClose, config, name }: CharacterOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const { mounted: rendered, visible } = usePanelPresence(isOpen, 200)
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => setMounted(true), [])
  useModalPanelFocus(isOpen && rendered && mounted, panel)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!mounted || !rendered) return null
  return createPortal(
    <div
      className={`fixed inset-0 z-[99990] flex items-stretch sm:items-center justify-center bg-abyss/85 backdrop-blur-md transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      data-testid="character-overlay"
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`${name}'s character`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`relative flex w-full flex-col bg-surface-1 sm:w-[min(560px,92vw)] sm:rounded-card sm:border sm:border-line-subtle sm:shadow-2xl transition-transform duration-200 ${visible ? 'scale-100' : 'scale-[0.98]'}`}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2 sm:pt-3">
          <h2 className="font-grotesk text-base font-bold text-ink truncate">{name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-10 w-10 items-center justify-center rounded-card text-ink-muted hover:text-ink hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 min-h-0 px-3 pb-[max(env(safe-area-inset-bottom),12px)] sm:pb-3">
          <LobsterAvatarFullBody
            config={config}
            size={640}
            alt={`${name}'s character`}
            className="w-full h-full min-h-[60dvh] sm:h-auto sm:min-h-0 sm:aspect-[4/5] sm:max-h-[78vh] rounded-card"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
