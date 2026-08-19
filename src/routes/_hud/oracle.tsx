import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Plus, Lock, UserPlus, Shield } from 'lucide-react'
import { AIChatPanel } from '@/components/ai/AIChatPanel'
import { useSafeOracle } from '@/components/hud/OracleContext'
import { authClient } from '@/lib/auth-client'
import { getAIThreadsFn } from '@/lib/server/api'
import { AuthModal } from '@/components/AuthModal'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'

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
    <div className="h-full flex flex-col space-y-3 sm:space-y-4 font-sans text-[#dfe3e3]">
      {/* Main Grid: Thread History Sidebar (if logged in) or Guest Gate Callout + Full Chat Panel */}
      <div className="flex-1 min-h-[500px] flex flex-col md:flex-row gap-3 sm:gap-4 overflow-hidden">
        {/* Thread History Sidebar (Logged In Users) */}
        {userId ? (
          <div className="w-full md:w-64 bg-[#060a0a]/95 border border-cyan-900/50 p-2.5 sm:p-3 flex flex-col space-y-3 chamfer-corner shrink-0 overflow-y-auto">
            <button
              onClick={handleCreateNewThread}
              className="w-full bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 py-2 px-3 text-xs flex items-center justify-center space-x-2 chamfer-corner transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>NEW CONSULTATION</span>
            </button>

            <div className="text-[11px] font-bold text-cyan-500 tracking-wider uppercase border-b border-cyan-950 pb-1">
              HISTORICAL THREADS
            </div>

            {isLoadingThreads ? (
              <div className="text-xs text-gray-500 py-4 text-center">Loading threads...</div>
            ) : threads.length === 0 ? (
              <div className="text-xs text-gray-500 py-4 text-center">No recorded threads yet.</div>
            ) : (
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`w-full text-left p-2 text-xs truncate transition-all chamfer-corner flex items-center space-x-2 ${
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
        ) : (
          /* Guest Mode Benefits Box */
          <div className="w-full md:w-64 bg-[#060a0a]/95 border border-cyan-900/50 p-4 flex flex-col justify-between space-y-4 chamfer-corner shrink-0">
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
              onClick={() => setIsAuthModalOpen(true)}
            >
              <span className="flex items-center justify-center gap-2 text-xs font-bold font-grotesk tracking-wider">
                <UserPlus className="w-4 h-4" />
                <span>SIGN UP</span>
              </span>
            </BenthicCTAButton>
          </div>
        )}

        {/* Full-Height Main AI Canvas */}
        <div className="flex-1 min-w-0 bg-[#060a0a] border border-cyan-900/60 chamfer-corner overflow-hidden">
          <AIChatPanel
            userId={userId}
            threadId={activeThreadId}
            onThreadCreated={handleThreadCreated}
            personaName="SYNAPTIC ORACLE"
            className="h-full"
          />
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
})
