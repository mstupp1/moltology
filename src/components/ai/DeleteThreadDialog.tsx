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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete chat confirmation"
        className="relative z-10 w-full max-w-xs bg-[#050a0c]/95 backdrop-blur-md border border-red-900/60 shadow-[0_8px_30px_rgba(0,0,0,0.9),0_0_12px_rgba(255,50,50,0.12)] chamfer-corner p-4 font-sans text-xs text-[#dfe3e3]"
      >
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm font-bold font-grotesk tracking-wider uppercase text-red-300">
            DELETE CHAT
          </span>
        </div>
        <p className="text-gray-400 leading-relaxed mb-1">
          <span className="text-cyan-200 font-medium">{thread.title || 'Untitled Consultation'}</span> and all of its
          messages will be permanently removed.
        </p>
        <p className="text-[10px] text-red-400/80 mb-3">This cannot be undone.</p>

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none text-[11px] text-gray-400 hover:text-gray-300">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
            className="w-3.5 h-3.5 accent-cyan-500 cursor-pointer"
          />
          Don&apos;t ask again for deleted chats
        </label>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-cyan-200 hover:bg-cyan-950/50 chamfer-corner transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-3 py-1.5 text-xs font-bold tracking-wider text-red-200 bg-red-950/70 hover:bg-red-900/80 border border-red-800/60 chamfer-corner transition-colors cursor-pointer"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  )
}
