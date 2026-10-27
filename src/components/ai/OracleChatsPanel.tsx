import React, { useEffect, useId, useRef, useState } from 'react'
import { ChevronRight, ChevronUp, Gauge, Lock, PanelLeftClose, Search, Settings, SquarePen, UserPlus, X } from 'lucide-react'
import { ThreadList, ThreadListSkeleton } from './ThreadList'
import type { ManagedThread } from './useThreadActions'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { CHAT_LIMIT } from '@/lib/ai/chat-retention'
import { OracleUsage } from './OracleUsage'
import { headerIconButtonClasses } from './OracleHeaderControls'
import type { OracleUsageSnapshot } from '@/lib/ai/usage-limits'

export interface OracleChatsPanelProps {
  id: string
  touch: boolean
  onCollapse: () => void
  onNewChat: () => void
  newChatDisabled: boolean
  newChatTitle: string
  userId: string | null
  isAuthPending: boolean
  threads: ManagedThread[]
  activeThreadId: string | null
  isLoadingThreads: boolean
  layout?: 'column' | 'takeover'
  isOpen?: boolean
  usageSnapshot: OracleUsageSnapshot | null
  usageUnavailable: boolean
  onSelectThread: (id: string) => void
  onPin: (threadId: string, pinned: boolean) => void
  onArchive: (threadId: string, archived: boolean) => void
  onRename: (threadId: string, title: string) => void
  onDelete: (threadId: string) => void
  onOpenAuthModal: () => void
}

export const OracleChatsPanel: React.FC<OracleChatsPanelProps> = ({
  id,
  touch,
  onCollapse,
  onNewChat,
  newChatDisabled,
  newChatTitle,
  userId,
  isAuthPending,
  threads,
  activeThreadId,
  isLoadingThreads,
  layout = 'takeover',
  isOpen = true,
  usageSnapshot,
  usageUnavailable,
  onSelectThread,
  onPin,
  onArchive,
  onRename,
  onDelete,
  onOpenAuthModal,
}) => {
  const [showUsage, setShowUsage] = useState(false)
  const usageId = useId()
  const searchId = useId()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const collapseButtonRef = useRef<HTMLButtonElement>(null)
  const headerButton = headerIconButtonClasses(touch)

  useEffect(() => {
    if (isOpen) collapseButtonRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  const hideSearch = () => {
    setQuery('')
    setShowSearch(false)
    searchButtonRef.current?.focus()
  }
  return (
    <section
      id={id}
      onKeyDown={(event) => {
        if (event.defaultPrevented || event.key !== 'Escape' || !showSearch) return
        // Let menus and dialogs consume Escape before the sidebar search does.
        if ((event.target as HTMLElement).closest('[role="menu"], [role="dialog"], [role="alertdialog"]')) return
        event.preventDefault()
        event.stopPropagation()
        if (query) setQuery('')
        else hideSearch()
      }}
      role="region"
      aria-label="Chats"
      data-testid="oracle-chats-panel"
      data-chats-layout={layout}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`flex flex-col min-h-0 h-full bg-surface-1/95 backdrop-blur-xl font-sans overflow-hidden transition-[opacity,transform,width,flex-basis] duration-200 ease-out motion-reduce:transition-none ${isOpen ? 'animate-[oracle-chats-enter_200ms_ease-out] motion-reduce:animate-none' : ''} ${layout === 'column'
        ? `shrink-0 border-r border-line-subtle ${isOpen ? 'w-64 lg:w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-2 border-r-0'}`
        : `w-full ${isOpen ? 'flex-1 opacity-100 translate-x-0' : 'absolute inset-0 z-20 pointer-events-none opacity-0 translate-x-2'}`}`}
    >
      <div className="flex shrink-0 items-center gap-1 px-3 pt-3 pb-2">
        <h2 className="min-w-0 flex-1 text-base font-semibold text-ink select-none">Synaptic Oracle</h2>
        <button
          ref={searchButtonRef}
          type="button"
          title="Search chats"
          aria-label="Search chats"
          aria-expanded={showSearch}
          aria-controls={searchId}
          onClick={() => showSearch ? hideSearch() : setShowSearch(true)}
          className={headerButton}
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          ref={collapseButtonRef}
          type="button"
          title="Collapse chats"
          aria-label="Collapse chats"
          aria-expanded={true}
          aria-controls={id}
          onClick={onCollapse}
          className={headerButton}
        >
          <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="shrink-0 px-2 pb-3">
        <button
          type="button"
          onClick={onNewChat}
          disabled={newChatDisabled}
          title={newChatTitle}
          className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-base text-ink-body hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <SquarePen className="w-5 h-5 shrink-0" aria-hidden="true" />
          New Chat
        </button>
        <div id={searchId} hidden={!showSearch} className="relative mt-2">
          {showSearch && (
            <>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search chats"
                placeholder="Search chats"
                className="h-11 w-full rounded-control border border-line-subtle bg-surface-2 pl-9 pr-10 text-base sm:text-sm text-ink placeholder-ink-muted focus:border-cyan-glow focus:outline-hidden [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-0 top-0 inline-flex h-11 w-10 items-center justify-center rounded-control text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
        {userId && !isAuthPending && !isLoadingThreads && threads.length >= CHAT_LIMIT && (
          <p className="px-2 pb-2 text-[11px] text-ink" data-testid="chat-limit-note">
            Delete a chat to start another.
          </p>
        )}
        {isAuthPending ? (
          <div className="p-3 space-y-2 font-sans" data-testid="oracle-chats-auth-skeleton">
            <HudGhostSkeleton variant="cyan" preset="badge" width={88} height={14} />
            <HudGhostSkeleton variant="neutral" preset="text" width="100%" height={24} />
            <HudGhostSkeleton variant="neutral" preset="text" width="80%" height={24} />
          </div>
        ) : userId ? (
          isLoadingThreads ? (
            <ThreadListSkeleton />
          ) : threads.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-ink-muted space-y-2">
              <p className="text-xs text-ink-muted">No chats yet. Your conversations will show up here.</p>
            </div>
          ) : (
            <ThreadList
              threads={threads}
              activeThreadId={activeThreadId}
              isLoadingThreads={false}
              density="comfortable"
              searchQuery={query}
              onSelectThread={onSelectThread}
              onPin={onPin}
              onArchive={onArchive}
              onRename={onRename}
              onDelete={onDelete}
            />
          )
        ) : (
          <div className="p-3 space-y-3 font-sans">
            <div className="flex items-center space-x-2 text-cyan-glow">
              <Lock className="w-4 h-4 text-cyan-glow shrink-0" />
              <span className="text-xs font-bold tracking-[0.08em] uppercase">GUEST MODE</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Guest chats aren't saved. Sign up free to keep them.
            </p>
            <BenthicCTAButton
              variant="cyan"
              size="sm"
              fullWidth
              onClick={onOpenAuthModal}
            >
              <span className="flex items-center justify-center gap-1.5 text-xs font-bold font-grotesk tracking-[0.08em] uppercase">
                <UserPlus className="w-3.5 h-3.5" />
                <span>SIGN UP FREE</span>
              </span>
            </BenthicCTAButton>
          </div>
        )}
      </div>
      {userId && !isAuthPending && (
        <div className="shrink-0 border-t border-line-subtle p-2">
          <div
            id={usageId}
            aria-hidden={!showUsage}
            inert={!showUsage}
            className={`grid transition-[grid-template-rows,opacity] duration-250 ease-in-out motion-reduce:transition-none ${showUsage ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="min-h-0 overflow-hidden">
              <section aria-label="Usage" className="max-h-64 overflow-y-auto p-2 pb-4 space-y-3">
                {!usageSnapshot && !usageUnavailable && <p role="status" className="text-[11px] text-ink-muted">Loading usage…</p>}
                <OracleUsage snapshot={usageSnapshot} unavailable={usageUnavailable} expanded />
              </section>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={showUsage}
            aria-controls={usageId}
            onClick={() => setShowUsage(open => !open)}
            className="flex min-h-10 w-full items-center gap-2 rounded-control px-2 text-xs text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-cyan-glow"
          >
            <Gauge className="w-4 h-4" aria-hidden="true" />Usage
            <ChevronUp className={`ml-auto w-4 h-4 transition-transform duration-250 motion-reduce:transition-none ${showUsage ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <a href="/settings" className="flex min-h-10 w-full items-center gap-2 rounded-control px-2 text-xs text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-cyan-glow">
            <Settings className="w-4 h-4" aria-hidden="true" />Settings
            <ChevronRight className="ml-auto w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </section>
  )
}
