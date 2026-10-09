import React, { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { ManagedThread } from './useThreadActions'

export const STORAGE_KEY_ORACLE_SKIP_DELETE_CONFIRM = 'moltology:oracle_skip_delete_confirm'

export const isDeleteConfirmSkipped = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY_ORACLE_SKIP_DELETE_CONFIRM) === 'true'
  } catch {
    return false
  }
}

export interface DeleteThreadDialogProps {
  thread: ManagedThread | null
  onConfirm: (threadId: string) => void
  onCancel: () => void
}

export const DeleteThreadDialog: React.FC<DeleteThreadDialogProps> = ({ thread, onConfirm, onCancel }) => {
  const [mounted, setMounted] = useState(false)
  const [dontAskAgain, setDontAskAgain] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (thread) setDontAskAgain(false)
  }, [thread?.id])

  if (!mounted || !thread) return null

  const handleConfirm = () => {
    try {
      if (dontAskAgain) {
        window.localStorage.setItem(STORAGE_KEY_ORACLE_SKIP_DELETE_CONFIRM, 'true')
      }
    } catch {}
    onConfirm(thread.id)
  }

  return (
    <div data-hud-modal-root="" className="fixed inset-0 z-[99996] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-abyss/80 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete chat confirmation"
        className="relative z-10 w-full max-w-xs rounded-card border border-line bg-surface-1 shadow-menu p-4 font-sans text-xs text-ink"
      >
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-crimson-text shrink-0" />
          <span className="text-sm font-bold font-grotesk tracking-[0.08em] uppercase text-ink">
            DELETE CHAT
          </span>
        </div>
        <p className="text-ink-body leading-relaxed mb-1">
          <span className="text-ink font-medium">{thread.title || 'Untitled Consultation'}</span> and all of its
          messages will be permanently removed.
        </p>
        <p className="text-[11px] text-crimson-text mb-3">This cannot be undone.</p>

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none text-[11px] text-ink-muted hover:text-ink-body">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
            className="w-3.5 h-3.5 accent-cyan-glow cursor-pointer"
          />
          Don&apos;t ask again for deleted chats
        </label>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink hover:bg-surface-2 rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-crimson-text border border-crimson-aggro/55 hover:bg-crimson-soft hover:border-crimson-aggro rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  )
}
