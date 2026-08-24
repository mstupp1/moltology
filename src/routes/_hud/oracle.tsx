import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Lock, UserPlus, Shield, X, Pencil } from 'lucide-react'
import { AIChatPanel } from '@/components/ai/AIChatPanel'
import { useSafeOracle } from '@/components/hud/OracleContext'
import { authClient } from '@/lib/auth-client'
import { getAIThreadsFn } from '@/lib/server/api'
import { AuthModal } from '@/components/AuthModal'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

interface OracleSidebarContentProps {
  userId: string | null
  threads: any[]
  activeThreadId: string | null
  isLoadingThreads: boolean
  onSelectThread: (id: string | null) => void
  onNewChat?: () => void
  onOpenAuthModal: () => void
}

function OracleSidebarContent({
  userId,
  threads,
  activeThreadId,
  isLoadingThreads,
  onSelectThread,
  onNewChat,
  onOpenAuthModal,
}: OracleSidebarContentProps) {
  if (userId) {
    return (
      <div className="flex flex-col h-full space-y-3 font-sans">
        <div className="flex items-center justify-between border-b border-cyan-950 pb-1.5 shrink-0">
          <span className="text-[11px] font-bold text-cyan-500 tracking-wider uppercase">
            CHATS
          </span>
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-300 transition-colors p-1 group cursor-pointer chamfer-corner hover:bg-cyan-950/50"
              title="New Chat"
              aria-label="New Chat"
            >
              <span className="text-[10px] tracking-wider uppercase font-medium text-gray-400 group-hover:text-cyan-300">
                New Chat
              </span>
              <Pencil className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-200" />
            </button>
          )}
        </div>

        {isLoadingThreads ? (
          <div className="text-xs text-gray-500 py-4 text-center">Loading threads...</div>
        ) : threads.length === 0 ? (
          <div className="text-xs text-gray-500 py-4 text-center">No recorded threads yet.</div>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectThread(t.id)}
                className={`w-full text-left p-2 text-xs truncate transition-all chamfer-corner flex items-center space-x-2 cursor-pointer ${
                  activeThreadId === t.id
                    ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-md'
                    : 'bg-[#080d0d] hover:bg-cyan-950/50 text-gray-400 border border-cyan-950'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between h-full space-y-4 font-sans">
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider uppercase">GUEST MODE</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          You are exploring the Oracle as a guest. Chats in guest mode are temporary and limited.
        </p>
        <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/40 chamfer-corner space-y-1.5 text-[10px] text-cyan-300">
          <div className="font-bold text-cyan-200 flex items-center gap-1">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>MEMBER BENEFITS:</span>
          </div>
          <ul className="space-y-1 text-gray-400 list-disc list-inside">
            <li>Full, detailed Oracle answers</li>
            <li>Saved consultation history</li>
            <li>Personalized progress tracking</li>
          </ul>
        </div>
      </div>
      <BenthicCTAButton
        variant="red"
        size="md"
        fullWidth
        onClick={onOpenAuthModal}
      >
        <span className="flex items-center justify-center gap-2 text-xs font-bold font-grotesk tracking-wider">
          <UserPlus className="w-4 h-4" />
          <span>SIGN UP</span>
        </span>
      </BenthicCTAButton>
    </div>
  )
}

function OracleRouteComponent() {
  const oracle = useSafeOracle()

  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = propOrContextUserId(user, oracle?.userId)

  function propOrContextUserId(u: any, contextId?: string | null) {
    if (contextId !== undefined) return contextId
    return u?.id || u?.sub || null
  }

  const [localThreads, setLocalThreads] = useState<any[]>([])
  const [localActiveThreadId, setLocalActiveThreadId] = useState<string | null>(null)
  const [localIsLoading, setLocalIsLoading] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const threads = oracle ? oracle.threads : localThreads
  const activeThreadId = oracle ? oracle.activeThreadId : localActiveThreadId
  const isLoadingThreads = oracle ? oracle.isLoadingThreads : localIsLoading

  const setActiveThreadId = (id: string | null) => {
    if (oracle) {
      oracle.setActiveThreadId(id)
    } else {
      setLocalActiveThreadId(id)
    }
  }

  useEffect(() => {
    if (oracle || !userId) return
    setLocalIsLoading(true)
    getAIThreadsFn({ data: { userId } })
      .then((data) => {
        if (Array.isArray(data)) {
          setLocalThreads(data)
          if (data.length > 0 && !localActiveThreadId) {
            setLocalActiveThreadId(data[0].id)
          }
        }
      })
      .catch((err) => console.warn('Failed to load user AI threads:', err))
      .finally(() => setLocalIsLoading(false))
  }, [userId, oracle])

  const handleCreateNewThread = () => {
    setActiveThreadId(null)
  }

  const handleThreadCreated = (newThreadId: string) => {
    setActiveThreadId(newThreadId)
    if (oracle) {
      oracle.refreshThreads()
    } else if (userId) {
      getAIThreadsFn({ data: { userId } })
        .then((data) => {
          if (Array.isArray(data)) {
            setLocalThreads(data)
          }
        })
        .catch((err) => console.warn('Failed to refresh threads after creation:', err))
    }
  }

  return (
    <div className="h-full flex flex-col font-sans text-[#dfe3e3]">
      {/* Unified Single Container (No Gap between Sidebar & Chat Canvas) */}
      <div className="flex-1 min-h-[500px] h-full bg-[#060a0a] border border-cyan-900/60 chamfer-corner flex overflow-hidden relative shadow-2xl">
        
        {/* Desktop Sidebar (Integrated with left border, hidden on mobile) */}
        <aside className="hidden md:flex w-64 lg:w-72 bg-[#050808]/95 border-r border-cyan-900/50 p-3 flex-col shrink-0 overflow-y-auto z-10">
          <OracleSidebarContent
            userId={userId}
            threads={threads}
            activeThreadId={activeThreadId}
            isLoadingThreads={isLoadingThreads}
            onSelectThread={(id) => setActiveThreadId(id)}
            onNewChat={handleCreateNewThread}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        </aside>

        {/* Seamless Chat Panel with Borderless Integration */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
          <AIChatPanel
            userId={userId}
            threadId={activeThreadId}
            onThreadCreated={handleThreadCreated}
            personaName="SYNAPTIC ORACLE"
            className="h-full border-none shadow-none"
            onToggleConversations={() => setIsMobileDrawerOpen(true)}
          />
        </div>

        {/* Mobile Slide-Over Overlay Backdrop */}
        <div
          className={`fixed md:hidden inset-0 bg-black/75 backdrop-blur-xs z-40 transition-opacity duration-300 ${
            isMobileDrawerOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Mobile Slide-Over Conversations Drawer */}
        <div
          className={`fixed md:hidden top-0 bottom-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-[#060a0a] border-r border-cyan-900/80 shadow-2xl z-50 flex flex-col h-full transform transition-transform duration-300 ease-in-out ${
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Conversations"
        >
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between p-3 border-b border-cyan-900/60 bg-[#0b1010] shrink-0">
            <div className="flex items-center space-x-2 text-cyan-300">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-wider uppercase font-sans">
                Conversations
              </span>
            </div>
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
              aria-label="Close Conversations"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Drawer Body */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col">
            <OracleSidebarContent
              userId={userId}
              threads={threads}
              activeThreadId={activeThreadId}
              isLoadingThreads={isLoadingThreads}
              onSelectThread={(id) => {
                setActiveThreadId(id)
                setIsMobileDrawerOpen(false)
              }}
              onNewChat={() => {
                handleCreateNewThread()
                setIsMobileDrawerOpen(false)
              }}
              onOpenAuthModal={() => {
                setIsAuthModalOpen(true)
                setIsMobileDrawerOpen(false)
              }}
            />
          </div>
        </div>

      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </div>
  )
}

export const Route = createFileRoute('/_hud/oracle')({
  component: OracleRouteComponent,
  pendingComponent: HudWorkspaceGhost,
})
