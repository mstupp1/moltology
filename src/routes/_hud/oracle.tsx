import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { useSafeOracle } from '@/components/hud/OracleContext'
import { getAIThreadsFn } from '@/lib/server/api'
import { oracleAuthData } from '@/lib/ai/oracle-auth-client'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { useAuthSession } from '@/hooks/useAuthSession'
import { parseOracleThreadSearch, validateOracleSearch } from '@/lib/ai/last-oracle-thread'

const LazyAIChatPanel = React.lazy(() =>
  import('@/components/ai/AIChatPanel').then((m) => ({ default: m.AIChatPanel }))
)

function OracleRouteComponent() {
  const oracle = useSafeOracle()
  const session = useAuthSession()
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const requestedThreadId = parseOracleThreadSearch(search)
  const userId = session.userId || oracle?.userId || null
  const [localThreads, setLocalThreads] = useState<any[]>([])
  const [localActiveThreadId, setLocalActiveThreadId] = useState<string | null>(null)
  const [localIsLoading, setLocalIsLoading] = useState(false)
  const appliedSearchThreadRef = useRef<string | undefined>(undefined)

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
    let cancelled = false
    setLocalIsLoading(true)
    void oracleAuthData(userId)
      .then((auth) => getAIThreadsFn({ data: auth }))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setLocalThreads(data)
        }
      })
      .catch((err) => console.warn('Failed to load user AI threads:', err))
      .finally(() => {
        if (!cancelled) setLocalIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, oracle])

  useEffect(() => {
    if (!requestedThreadId || appliedSearchThreadRef.current === requestedThreadId) return

    const exists = threads.some((thread) => thread.id === requestedThreadId)
    if (exists) {
      appliedSearchThreadRef.current = requestedThreadId
      setActiveThreadId(requestedThreadId)
      return
    }

    if (isLoadingThreads) return
    if (threads.length > 0) {
      appliedSearchThreadRef.current = requestedThreadId
    }
  }, [requestedThreadId, isLoadingThreads, threads])

  const handleThreadCreated = (newThreadId: string) => {
    setActiveThreadId(newThreadId)
    if (oracle) {
      oracle.refreshThreads()
    } else if (userId) {
      void oracleAuthData(userId)
        .then((auth) => getAIThreadsFn({ data: auth }))
        .then((data) => {
          if (Array.isArray(data)) {
            setLocalThreads(data)
          }
        })
        .catch((err) => console.warn('Failed to refresh threads after creation:', err))
    }
  }

  return (
    <div className="h-full flex flex-col font-sans text-ink">
      <div className="flex-1 min-h-0 bg-surface-1 sm:bg-abyss/40 backdrop-blur-md overflow-hidden relative">
        <React.Suspense fallback={<HudWorkspaceGhost />}>
          <LazyAIChatPanel
            allowEntityMode
            desktopChatsSidebar
            userId={userId}
            threadId={activeThreadId}
            onThreadCreated={handleThreadCreated}
            onThreadChange={setActiveThreadId}
            className="h-full border-none shadow-none bg-transparent"
          />
        </React.Suspense>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/oracle')({
  validateSearch: validateOracleSearch,
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Synaptic Oracle | Moltology',
        description: 'Private benthic consultation channel for authenticated units.',
      }),
    ],
  }),
  component: OracleRouteComponent,
  pendingComponent: HudWorkspaceGhost,
})
