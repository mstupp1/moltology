import React from 'react'
import { ArrowLeft, Lock, UserPlus, X } from 'lucide-react'
import { ThreadList } from './ThreadList'
import type { ManagedThread } from './useThreadActions'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'
import { getAssetUrl } from '../../lib/assets'
import { HudGhostSkeleton } from '@/components/ui/HudGhostLoader'

export type OracleChatsLayout = 'takeover' | 'column'

export interface OracleChatsPanelProps {
  userId: string | null
  isAuthPending: boolean
  threads: ManagedThread[]
  activeThreadId: string | null
  isLoadingThreads: boolean
  layout: OracleChatsLayout
  onSelectThread: (id: string) => void
  onClose: () => void
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
  onClose,
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
      className={`flex flex-col min-h-0 h-full bg-[#060a0d]/95 backdrop-blur-xl font-sans ${
        layout === 'column'
          ? 'w-64 lg:w-72 shrink-0 border-r border-cyan-900/40'
          : 'flex-1 w-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-cyan-950 bg-[#080e11]/90 shrink-0 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center min-w-11 min-h-11 p-2.5 text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer rounded"
            title="Back to conversation"
            aria-label="Back to conversation"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-cyan-500 tracking-wider uppercase font-sans">
            CHATS
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center min-w-11 min-h-11 p-2.5 text-gray-400 hover:text-red-400 transition-colors cursor-pointer rounded"
          title="Close Chats"
          aria-label="Close Chats"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        {isAuthPending ? (
          <div className="p-3 space-y-2 font-sans" data-testid="oracle-chats-auth-skeleton">
            <HudGhostSkeleton variant="cyan" preset="badge" width={88} height={14} />
            <HudGhostSkeleton variant="neutral" preset="text" width="100%" height={24} />
            <HudGhostSkeleton variant="neutral" preset="text" width="80%" height={24} />
          </div>
        ) : userId ? (
          isLoadingThreads ? (
            <div className="py-6 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
              <img
                src={getAssetUrl('/images/order_emblem.png')}
                alt="Loading"
                className="w-4 h-4 object-contain animate-pulse drop-shadow-[0_0_6px_rgba(0,195,255,0.4)]"
              />
              <span className="text-[11px] text-cyan-400/80 animate-pulse">Accessing archives...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-gray-400 space-y-2">
              <p className="text-[11px] text-gray-400">No recorded chats yet.</p>
            </div>
          ) : (
            <ThreadList
              threads={threads}
              activeThreadId={activeThreadId}
              isLoadingThreads={false}
              density="comfortable"
              onSelectThread={onSelectThread}
              onPin={onPin}
              onArchive={onArchive}
              onRename={onRename}
              onDelete={onDelete}
            />
          )
        ) : (
          <div className="p-3 space-y-3 font-sans">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-bold tracking-wider uppercase">GUEST MODE</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Chats in guest mode are temporary. Create a free initiate account to preserve your neural consultations.
            </p>
            <BenthicCTAButton
              variant="red"
              size="sm"
              fullWidth
              onClick={onOpenAuthModal}
            >
              <span className="flex items-center justify-center gap-1.5 text-xs font-bold font-grotesk tracking-wider uppercase">
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
