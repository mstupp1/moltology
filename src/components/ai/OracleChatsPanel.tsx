import React from 'react'
import { Lock, UserPlus } from 'lucide-react'
import { ThreadList, ThreadListSkeleton } from './ThreadList'
import type { ManagedThread } from './useThreadActions'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'
import { CHAT_LIMIT } from '@/lib/ai/chat-retention'

export type OracleChatsLayout = 'takeover' | 'column'

export interface OracleChatsPanelProps {
  userId: string | null
  isAuthPending: boolean
  threads: ManagedThread[]
  activeThreadId: string | null
  isLoadingThreads: boolean
  layout: OracleChatsLayout
  onSelectThread: (id: string) => void
  onPin: (threadId: string, pinned: boolean) => void
  onArchive: (threadId: string, archived: boolean) => void
  onRename: (threadId: string, title: string) => void
  onDelete: (threadId: string) => void
  onOpenAuthModal: () => void
}

export const OracleChatsPanel: React.FC<OracleChatsPanelProps> = ({
  userId,
  isAuthPending,
  threads,
  activeThreadId,
  isLoadingThreads,
  layout,
  onSelectThread,
  onPin,
  onArchive,
  onRename,
  onDelete,
  onOpenAuthModal,
}) => {
  return (
    <section
      role="region"
      aria-label="Chats"
      data-testid="oracle-chats-panel"
      data-chats-layout={layout}
      className={`flex flex-col min-h-0 h-full bg-surface-1/95 backdrop-blur-xl font-sans ${
        layout === 'column'
          ? 'w-64 lg:w-72 shrink-0 border-r border-line-subtle'
          : 'flex-1 w-full'
      }`}
    >
      <h2 className="px-4 pt-3 pb-1 text-xs font-medium text-ink-muted shrink-0 select-none">Chats</h2>

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
              searchThreshold={layout === 'takeover' ? 0 : undefined}
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
    </section>
  )
}
