import React, { useEffect, useRef, useState } from 'react'
import { Pin, PinOff, Pencil, Archive, ArchiveRestore, Trash2, MoreVertical } from 'lucide-react'
import {
  HudDropdownMenu,
  HudDropdownMenuTrigger,
  HudDropdownMenuContent,
  HudDropdownMenuItem,
  HudDropdownMenuSeparator,
} from '@/components/ui/HudDropdownMenu'
import type { ManagedThread } from './useThreadActions'

export interface ThreadListItemProps {
  thread: ManagedThread
  isActive: boolean
  archived?: boolean
  isRenaming?: boolean
  onSelect: () => void
  onMobileMenu: () => void
  onRenameStart: () => void
  onRenameCommit: (title: string) => void
  onRenameCancel: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
}

const formatDate = (value?: string | Date) =>
  new Date(value as string).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  isActive,
  archived = false,
  isRenaming = false,
  onSelect,
  onMobileMenu,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onPin,
  onArchive,
  onDelete,
}) => {
  const [renameValue, setRenameValue] = useState(thread.title || '')
  const committedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPinned = !!thread.pinnedAt
  const dateSource = thread.updatedAt || thread.createdAt

  useEffect(() => {
    if (isRenaming) {
      committedRef.current = false
      setRenameValue(thread.title || '')
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isRenaming, thread.title])

  const commitRename = () => {
    if (committedRef.current) return
    committedRef.current = true
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== (thread.title || '')) {
      onRenameCommit(trimmed)
    } else {
      onRenameCancel()
    }
  }

  const kebabClasses =
    'inline-flex items-center justify-center p-1 shrink-0 transition-all cursor-pointer text-current hover:text-cyan-200 hover:bg-cyan-950/60'

  return (
    <div
      className={`group relative w-full flex items-center text-xs transition-all chamfer-corner select-none ${
        isActive
          ? 'bg-cyan-950/70 text-cyan-200 shadow-md backdrop-blur-xs'
          : 'bg-[#080d0e]/50 hover:bg-cyan-950/40 text-gray-400 backdrop-blur-xs'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={renameValue}
          maxLength={120}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              committedRef.current = true
              onRenameCancel()
            }
          }}
          onBlur={commitRename}
          aria-label="Rename chat"
          className="flex-1 min-w-0 mx-2 my-1 px-2 py-1 bg-[#041014]/80 border border-cyan-800/60 focus:border-cyan-400 text-cyan-100 text-xs outline-none"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            title={thread.title}
            className="flex-1 min-w-0 text-left px-2 py-1.5 bg-transparent border-none outline-none cursor-pointer select-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span className="flex items-center gap-1 min-w-0">
              {isPinned && <Pin className="w-2.5 h-2.5 text-cyan-400 shrink-0" fill="currentColor" />}
              <span className="block truncate">{thread.title || 'Untitled Consultation'}</span>
            </span>
            {dateSource && (
              <span className="block text-[9px] text-gray-500 font-mono mt-0.5 select-none">
                {formatDate(dateSource)}
              </span>
            )}
          </button>

          <div className="flex items-center shrink-0 pr-1">
            <HudDropdownMenu>
              <HudDropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Chat options"
                  title="Chat options"
                  data-testid="thread-kebab-desktop"
                  className={`${kebabClasses} hidden md:inline-flex md:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 focus-visible:opacity-100 focus:opacity-100`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </HudDropdownMenuTrigger>
              <HudDropdownMenuContent align="end" sideOffset={2}>
                {!archived && (
                  <HudDropdownMenuItem onSelect={onPin}>
                    {isPinned ? (
                      <PinOff className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Pin className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {isPinned ? 'Unpin' : 'Pin'}
                  </HudDropdownMenuItem>
                )}
                {!archived && (
                  <HudDropdownMenuItem onSelect={onRenameStart}>
                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                    Rename
                  </HudDropdownMenuItem>
                )}
                <HudDropdownMenuItem onSelect={onArchive}>
                  {archived ? (
                    <ArchiveRestore className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 shrink-0" />
                  )}
                  {archived ? 'Unarchive' : 'Archive'}
                </HudDropdownMenuItem>
                <HudDropdownMenuSeparator />
                <HudDropdownMenuItem destructive onSelect={onDelete}>
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  Delete
                </HudDropdownMenuItem>
              </HudDropdownMenuContent>
            </HudDropdownMenu>

            <button
              type="button"
              aria-label="Chat options"
              title="Chat options"
              data-testid="thread-kebab-mobile"
              onClick={(e) => {
                e.stopPropagation()
                onMobileMenu()
              }}
              className={`${kebabClasses} md:hidden opacity-70`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
