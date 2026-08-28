import React from 'react'
import { Pin, PinOff, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import type { ManagedThread } from './useThreadActions'

export interface ThreadActionSheetProps {
  thread: ManagedThread | null
  archived?: boolean
  onClose: () => void
  onPin: (threadId: string) => void
  onArchive: (threadId: string) => void
  onRename: (threadId: string) => void
  onDelete: (threadId: string) => void
}

export const ThreadActionSheet: React.FC<ThreadActionSheetProps> = ({
  thread,
  archived = false,
  onClose,
  onPin,
  onArchive,
  onRename,
  onDelete,
}) => {
  if (!thread) return null
  const isPinned = !!thread.pinnedAt

  const run = (action: (threadId: string) => void) => {
    onClose()
    action(thread.id)
  }

  const rowClasses =
    'w-full flex items-center gap-3 px-3 py-3 text-xs font-medium rounded-none transition-colors cursor-pointer select-none'

  return (
    <HudBottomSheet
      isOpen
      onClose={onClose}
      title="Chat options"
      ariaLabel={`Options for ${thread.title || 'Untitled Consultation'}`}
      className="max-w-md mx-auto"
    >
      <p className="text-[10px] text-cyan-500 tracking-wider uppercase font-bold px-3 pb-1 truncate">
        {thread.title || 'Untitled Consultation'}
      </p>

      <div className="divide-y divide-cyan-950/80">
        {!archived && (
          <button
            type="button"
            onClick={() => run(onPin)}
            className={`${rowClasses} text-gray-200 hover:bg-cyan-950/60 hover:text-cyan-200`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isPinned ? (
              <PinOff className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <Pin className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            {isPinned ? 'Unpin chat' : 'Pin to top'}
          </button>
        )}

        {!archived && (
          <button
            type="button"
            onClick={() => run(onRename)}
            className={`${rowClasses} text-gray-200 hover:bg-cyan-950/60 hover:text-cyan-200`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Pencil className="w-4 h-4 text-cyan-400 shrink-0" />
            Rename
          </button>
        )}

        <button
          type="button"
          onClick={() => run(onArchive)}
          className={`${rowClasses} text-gray-200 hover:bg-cyan-950/60 hover:text-cyan-200`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {archived ? (
            <ArchiveRestore className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <Archive className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          {archived ? 'Unarchive' : 'Archive'}
        </button>

        <button
          type="button"
          onClick={() => run(onDelete)}
          className={`${rowClasses} text-red-400 hover:bg-red-950/60 hover:text-red-300`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          Delete chat
        </button>
      </div>
    </HudBottomSheet>
  )
}
