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

export type ThreadListDensity = 'compact' | 'comfortable'

export interface ThreadListItemProps {
  thread: ManagedThread
  isActive: boolean
  archived?: boolean
  isRenaming?: boolean
  density?: ThreadListDensity
  onSelect: () => void
  onRenameStart: () => void
  onRenameCommit: (title: string) => void
  onRenameCancel: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  isActive,
  archived = false,
  isRenaming = false,
  density = 'compact',
  onSelect,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onPin,
  onArchive,
  onDelete,
}) => {
  const [renameValue, setRenameValue] = useState(thread.title || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchOrigin = useRef<{ x: number; y: number } | null>(null)
  const heldRef = useRef(false)
  const rowButtonRef = useRef<HTMLButtonElement>(null)
  const cancelHold = () => {
    if (holdRef.current != null) clearTimeout(holdRef.current)
    holdRef.current = null
    touchOrigin.current = null
  }
  useEffect(() => cancelHold, [])
  const committedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPinned = !!thread.pinnedAt

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

  const isComfortable = density === 'comfortable'
  const kebabClasses = `items-center justify-center shrink-0 transition-all cursor-pointer text-current rounded-control hover:text-ink hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
    isComfortable ? 'min-w-11 min-h-11 p-2.5' : 'p-1'
  }`

  return (
    <HudDropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <div
        data-density={density}
        className={`group relative w-full flex items-center text-xs transition-all rounded-control overflow-hidden select-none ${
          isActive
            ? 'bg-surface-3 shadow-nav-current text-ink'
            : 'hover:bg-surface-2 text-ink-body hover:text-ink'
        }`}
        style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
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
                e.stopPropagation()
                committedRef.current = true
                onRenameCancel()
              }
            }}
            onBlur={commitRename}
            aria-label="Rename chat"
            className="flex-1 min-w-0 mx-2 my-1 px-2 py-1 rounded-control bg-surface-2 border border-line focus:border-cyan-glow focus:shadow-field-focus text-ink text-xs outline-hidden"
          />
        ) : (
          <>
            <button
              type="button"
              ref={rowButtonRef}
              onPointerDown={(e) => {
                cancelHold()
                heldRef.current = false
                if (e.pointerType !== 'touch' || !e.isPrimary) return
                touchOrigin.current = { x: e.clientX, y: e.clientY }
                holdRef.current = setTimeout(() => {
                  heldRef.current = true
                  setMenuOpen(true)
                  cancelHold()
                }, 500)
              }}
              onPointerMove={(e) => {
                const origin = touchOrigin.current
                if (origin && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) cancelHold()
              }}
              onPointerUp={cancelHold}
              onPointerCancel={cancelHold}
              onPointerLeave={cancelHold}
              onContextMenu={(e) => {
                e.preventDefault()
                cancelHold()
                heldRef.current = true
                setMenuOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                  e.preventDefault()
                  setMenuOpen(true)
                }
              }}
              onClick={(e) => {
                if (heldRef.current) {
                  e.preventDefault()
                  heldRef.current = false
                  return
                }
                onSelect()
              }}
              title={thread.title}
              aria-current={isActive ? 'true' : undefined}
              className={`flex-1 min-w-0 text-left bg-transparent border-none outline-hidden cursor-pointer select-none focus:outline-hidden focus:ring-0 active:outline-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                isComfortable ? 'min-h-11 px-3 py-3' : 'px-2 py-1.5'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="flex items-center gap-1 min-w-0">
                {isPinned && !archived && (
                  <Pin className="w-2.5 h-2.5 text-cyan-glow shrink-0" fill="currentColor" />
                )}
                <span className="block truncate">{thread.title || 'Untitled Consultation'}</span>
              </span>
            </button>

            <div className="flex items-center shrink-0 pr-1">
              <HudDropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Chat options"
                  title="Chat options"
                  data-testid="thread-kebab-desktop"
                  className={`${kebabClasses} sr-only md:not-sr-only md:inline-flex ${
                    isComfortable
                      ? 'opacity-100'
                      : 'md:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 focus-visible:opacity-100 focus:opacity-100'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </HudDropdownMenuTrigger>
              <HudDropdownMenuContent align="end" sideOffset={2}
                onCloseAutoFocus={(e) => {
                  e.preventDefault()
                  if (!isRenaming) rowButtonRef.current?.focus()
                }}
              >
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
            </div>
          </>
        )}
      </div>
    </HudDropdownMenu>
  )
}
