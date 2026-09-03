import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ThreadListItem, type ThreadListDensity } from './ThreadListItem'
import { ThreadActionSheet } from './ThreadActionSheet'
import { DeleteThreadDialog, isDeleteConfirmSkipped } from './DeleteThreadDialog'
import type { ManagedThread } from './useThreadActions'

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
}

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
  loadingMessage = 'Loading threads...',
  emptyMessage = 'No recorded threads yet.',
  loadingNode,
}) => {
  const [actionThreadId, setActionThreadId] = useState<string | null>(null)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null)
  const [isArchivedOpen, setIsArchivedOpen] = useState(false)

  const activeThreads = threads.filter((t) => !t.archivedAt)
  const archivedThreads = threads.filter((t) => t.archivedAt)

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
    return <div>{loadingNode || <div className="text-xs text-gray-500 py-4 text-center">{loadingMessage}</div>}</div>
  }

  if (threads.length === 0) {
    return <div className="text-xs text-gray-500 py-4 text-center">{emptyMessage}</div>
  }

  return (
    <>
      <div className="space-y-1.5">
        {activeThreads.map((t) => renderItem(t, false))}
      </div>

      {archivedThreads.length > 0 && (
        <div className="mt-3 pt-2 border-t border-cyan-950/70">
          <button
            type="button"
            onClick={() => setIsArchivedOpen((v) => !v)}
            aria-expanded={isArchivedOpen}
            className="w-full flex items-center gap-1.5 px-1 py-1 text-[10px] font-bold tracking-wider uppercase text-gray-500 hover:text-cyan-300 transition-colors cursor-pointer select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isArchivedOpen ? (
              <ChevronDown className="w-3 h-3 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 shrink-0" />
            )}
            <span>Archived</span>
            <span className="text-gray-600 font-mono">({archivedThreads.length})</span>
          </button>
          {isArchivedOpen && <div className="space-y-1.5 mt-1.5">{archivedThreads.map((t) => renderItem(t, true))}</div>}
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
