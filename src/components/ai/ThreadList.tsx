import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { filterThreadsByQuery, groupThreadsByDate } from '@/lib/ai/thread-groups'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { ThreadListItem, type ThreadListDensity } from './ThreadListItem'
import { ThreadActionSheet } from './ThreadActionSheet'
import { DeleteThreadDialog, isDeleteConfirmSkipped } from './DeleteThreadDialog'
import type { ManagedThread } from './useThreadActions'

const pinnedAtMs = (value?: string | Date | null) => {
  if (!value) return 0
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isFinite(ms) ? ms : 0
}

const SECTION_LABEL =
  'flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold tracking-[0.08em] uppercase text-ink-muted select-none'

export interface ThreadListProps {
  threads: ManagedThread[]
  activeThreadId: string | null
  isLoadingThreads: boolean
  onSelectThread: (id: string) => void
  onPin: (threadId: string, pinned: boolean) => void
  onArchive: (threadId: string, archived: boolean) => void
  onRename: (threadId: string, title: string) => void
  onDelete: (threadId: string) => void
  density?: ThreadListDensity
  loadingMessage?: string
  emptyMessage?: string
  loadingNode?: React.ReactNode
  /** Show the title search box once the list is longer than this. */
  searchThreshold?: number
}

/** Placeholder rows shown while chats load. */
export const ThreadListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-1.5" data-testid="thread-list-skeleton" aria-label="Loading chats" role="status">
    {Array.from({ length: rows }, (_, i) => (
      <HudGhostSkeleton key={i} variant="neutral" preset="text" width={`${92 - i * 7}%`} height={36} />
    ))}
  </div>
)

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  activeThreadId,
  isLoadingThreads,
  onSelectThread,
  onPin,
  onArchive,
  onRename,
  onDelete,
  density = 'compact',
  loadingMessage = 'Loading chats...',
  emptyMessage = 'No chats yet. Your conversations will show up here.',
  loadingNode,
  searchThreshold = 5,
}) => {
  const [query, setQuery] = useState('')
  // Date sections need the clock, so they appear after mount (never during SSR).
  const [nowMs, setNowMs] = useState<number | null>(null)
  useEffect(() => {
    setNowMs(Date.now())
  }, [threads])
  const [actionThreadId, setActionThreadId] = useState<string | null>(null)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null)
  const [isArchivedOpen, setIsArchivedOpen] = useState(false)

  const visibleThreads = filterThreadsByQuery(threads, query)
  const isSearching = query.trim().length > 0
  const activeThreads = visibleThreads.filter((t) => !t.archivedAt)
  const pinnedThreads = activeThreads
    .filter((t) => t.pinnedAt)
    .slice()
    .sort((a, b) => pinnedAtMs(b.pinnedAt) - pinnedAtMs(a.pinnedAt))
  const unpinnedThreads = activeThreads.filter((t) => !t.pinnedAt)
  const archivedThreads = visibleThreads.filter((t) => t.archivedAt)
  const unpinnedGroups =
    nowMs != null && !isSearching ? groupThreadsByDate(unpinnedThreads, nowMs) : null
  const showSearch = threads.length > searchThreshold || isSearching

  const actionThread = threads.find((t) => t.id === actionThreadId) || null
  const deleteCandidate = threads.find((t) => t.id === deleteCandidateId) || null

  const handleDeleteRequest = (threadId: string) => {
    if (isDeleteConfirmSkipped()) {
      onDelete(threadId)
    } else {
      setDeleteCandidateId(threadId)
    }
  }

  const renderItem = (t: ManagedThread, archived: boolean) => (
    <ThreadListItem
      key={t.id}
      thread={t}
      isActive={activeThreadId === t.id}
      archived={archived}
      density={density}
      isRenaming={renamingThreadId === t.id}
      onSelect={() => onSelectThread(t.id)}
      onMobileMenu={() => setActionThreadId(t.id)}
      onRenameStart={() => setRenamingThreadId(t.id)}
      onRenameCommit={(title) => {
        setRenamingThreadId(null)
        onRename(t.id, title)
      }}
      onRenameCancel={() => setRenamingThreadId(null)}
      onPin={() => onPin(t.id, !t.pinnedAt)}
      onArchive={() => onArchive(t.id, !t.archivedAt)}
      onDelete={() => handleDeleteRequest(t.id)}
    />
  )

  if (isLoadingThreads) {
    return <div>{loadingNode || <ThreadListSkeleton />}<span className="sr-only">{loadingMessage}</span></div>
  }

  if (threads.length === 0) {
    return <div className="text-xs text-ink-muted py-4 text-center">{emptyMessage}</div>
  }

  return (
    <>
      {showSearch && (
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.stopPropagation()
                setQuery('')
              }
            }}
            placeholder="Search chats"
            aria-label="Search chats"
            className="w-full h-9 pl-8 pr-8 rounded-control bg-surface-1 border border-line-subtle hover:border-line focus:border-line text-base sm:text-xs text-ink placeholder-ink-muted outline-none transition-colors [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {isSearching && visibleThreads.length === 0 && (
        <div className="text-xs text-ink-muted py-4 text-center">No chats match "{query.trim()}".</div>
      )}

      {pinnedThreads.length > 0 && (
        <div data-testid="pinned-threads">
          <div className={SECTION_LABEL}>
            <span>Pinned</span>
            <span className="text-ink-muted font-mono">({pinnedThreads.length})</span>
          </div>
          <div className="space-y-1 mt-1">{pinnedThreads.map((t) => renderItem(t, false))}</div>
        </div>
      )}

      {unpinnedThreads.length > 0 && (
        <div className={pinnedThreads.length > 0 ? 'mt-3' : undefined} data-testid="unpinned-threads">
          {unpinnedGroups ? (
            <div className="space-y-3">
              {unpinnedGroups.map((group) => (
                <div key={group.id} data-testid={`thread-group-${group.id}`}>
                  <div className={SECTION_LABEL}>{group.label}</div>
                  <div className="space-y-1 mt-1">{group.threads.map((t) => renderItem(t, false))}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">{unpinnedThreads.map((t) => renderItem(t, false))}</div>
          )}
        </div>
      )}

      {archivedThreads.length > 0 && (
        <div className="mt-3 pt-2 border-t border-line-subtle">
          <button
            type="button"
            onClick={() => setIsArchivedOpen((v) => !v)}
            aria-expanded={isArchivedOpen}
            className={`w-full ${SECTION_LABEL} hover:text-ink rounded-control transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isArchivedOpen ? (
              <ChevronDown className="w-3 h-3 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 shrink-0" />
            )}
            <span>Archived</span>
            <span className="text-ink-muted font-mono">({archivedThreads.length})</span>
          </button>
          {(isArchivedOpen || isSearching) && <div className="space-y-1 mt-1">{archivedThreads.map((t) => renderItem(t, true))}</div>}
        </div>
      )}

      <ThreadActionSheet
        thread={actionThread}
        archived={!!actionThread?.archivedAt}
        onClose={() => setActionThreadId(null)}
        onPin={(id) => {
          const t = threads.find((x) => x.id === id)
          if (t) onPin(id, !t.pinnedAt)
        }}
        onArchive={(id) => {
          const t = threads.find((x) => x.id === id)
          if (t) onArchive(id, !t.archivedAt)
        }}
        onRename={(id) => setRenamingThreadId(id)}
        onDelete={(id) => handleDeleteRequest(id)}
      />

      <DeleteThreadDialog
        thread={deleteCandidate}
        onConfirm={(id) => {
          setDeleteCandidateId(null)
          onDelete(id)
        }}
        onCancel={() => setDeleteCandidateId(null)}
      />
    </>
  )
}
