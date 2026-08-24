import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Lock, UserPlus, Shield, X, Pencil } from 'lucide-react'
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
  hideHeader?: boolean
}

function OracleSidebarContent({
  userId,
  threads,
  activeThreadId,
  isLoadingThreads,
  onSelectThread,
  onNewChat,
  onOpenAuthModal,
  hideHeader = false,
}: OracleSidebarContentProps) {
  if (userId) {
    return (
      <div className="flex flex-col h-full space-y-3 font-sans">
        {!hideHeader && (
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
        )}

        {isLoadingThreads ? (
          <div className="text-xs text-gray-500 py-4 text-center">Loading threads...</div>
        ) : threads.length === 0 ? (
          <div className="text-xs text-gray-500 py-4 text-center">No recorded threads yet.</div>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectThread(t.id)}
                title={t.title}
                className={`w-full text-left px-2 py-1.5 text-xs block transition-all chamfer-corner cursor-pointer border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none ${
                  activeThreadId === t.id
                    ? 'bg-cyan-950/70 text-cyan-200 shadow-md backdrop-blur-xs'
                    : 'bg-[#080d0e]/50 hover:bg-cyan-950/40 text-gray-400 backdrop-blur-xs'
                }`}
                style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="block truncate select-none">
                  {t.title || 'Untitled Consultation'}
                </span>
                {t.createdAt && (
                  <span className="block text-[9px] text-gray-500 font-mono mt-0.5 select-none">
                    {new Date(t.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
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
        <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/35 backdrop-blur-xs chamfer-corner space-y-1.5 text-[10px] text-cyan-300">
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
      {/* Full-Screen Unified Container with Translucent Glass Backdrop */}
      <div className="flex-1 h-full bg-[#060a0c]/40 backdrop-blur-md flex overflow-hidden relative">
        
        {/* Desktop Sidebar with Translucent Glass Styling */}
        <aside className="hidden md:flex w-64 lg:w-72 bg-[#050809]/75 backdrop-blur-md border-r border-cyan-900/40 p-3 flex-col shrink-0 overflow-y-auto z-10">
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
            className="h-full border-none shadow-none bg-transparent"
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

        {/* Mobile Slide-Over Chats Drawer */}
        <div
          className={`fixed md:hidden top-0 bottom-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-[#050809]/95 backdrop-blur-md border-r border-cyan-900/60 shadow-2xl z-50 flex flex-col h-full transform transition-transform duration-300 ease-in-out ${
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Chats"
        >
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between p-3 border-b border-cyan-900/50 bg-[#090e0f]/90 shrink-0">
            <span className="text-xs font-bold text-cyan-300 tracking-wider uppercase font-sans">
              CHATS
            </span>
            <div className="flex items-center gap-2">
              {userId && (
                <button
                  type="button"
                  onClick={() => {
                    handleCreateNewThread()
                    setIsMobileDrawerOpen(false)
                  }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-300 transition-colors p-1 group cursor-pointer chamfer-corner hover:bg-cyan-950/50"
                  title="New Chat"
                  aria-label="New Chat"
                >
                  <span className="text-[10px] tracking-wider uppercase font-medium text-gray-400 group-hover:text-cyan-300">
                    New Chat
                  </span>
                  <Pencil className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-200" />
                </button>
              )}
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                aria-label="Close Chats"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
              hideHeader={true}
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
