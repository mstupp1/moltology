import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { getAIThreadsFn } from '@/lib/server/api'

export type OracleMode = 'closed' | 'popout' | 'sidebar' | 'page'

export interface OracleThread {
  id: string
  title: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

interface OracleContextType {
  mode: OracleMode
  setMode: (mode: OracleMode) => void
  toggleMode: (targetMode: 'popout' | 'sidebar' | 'page') => void
  activeThreadId: string | null
  setActiveThreadId: (id: string | null) => void
  threads: OracleThread[]
  isLoadingThreads: boolean
  refreshThreads: () => Promise<void>
  userId: string | null
}

const OracleContext = createContext<OracleContextType | undefined>(undefined)

export const OracleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname

  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null

  const [mode, setModeState] = useState<OracleMode>(() =>
    currentPath === '/oracle' ? 'page' : 'closed'
  )
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threads, setThreads] = useState<OracleThread[]>([])
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)

  // Track the route the user was on prior to navigating to /oracle
  const lastNonOracleRouteRef = useRef<string>('/dashboard')

  useEffect(() => {
    if (currentPath !== '/oracle') {
      lastNonOracleRouteRef.current = currentPath
    }
  }, [currentPath])

  // Sync mode with current pathname
  useEffect(() => {
    if (currentPath === '/oracle') {
      if (mode !== 'page') {
        setModeState('page')
      }
    } else {
      if (mode === 'page') {
        setModeState('closed')
      }
    }
  }, [currentPath])

  // Load threads for authenticated user
  const refreshThreads = async () => {
    if (!userId) {
      setThreads([])
      return
    }
    setIsLoadingThreads(true)
    try {
      const data = await getAIThreadsFn({ data: { userId } })
      if (Array.isArray(data)) {
        setThreads(data)
        if (data.length > 0 && !activeThreadId) {
          setActiveThreadId(data[0].id)
        }
      }
    } catch (err) {
      console.warn('Failed to load user AI threads:', err)
    } finally {
      setIsLoadingThreads(false)
    }
  }

  useEffect(() => {
    refreshThreads()
  }, [userId])

  const setMode = (newMode: OracleMode) => {
    if (newMode === mode) return

    setModeState(newMode)

    if (newMode === 'page') {
      if (currentPath !== '/oracle') {
        navigate({ to: '/oracle' })
      }
    } else {
      if (currentPath === '/oracle') {
        const destination =
          lastNonOracleRouteRef.current && lastNonOracleRouteRef.current !== '/oracle'
            ? lastNonOracleRouteRef.current
            : '/dashboard'
        navigate({ to: destination })
      }
    }
  }

  const toggleMode = (targetMode: 'popout' | 'sidebar' | 'page') => {
    if (mode === targetMode) {
      setMode('closed')
    } else {
      setMode(targetMode)
    }
  }

  return (
    <OracleContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        activeThreadId,
        setActiveThreadId,
        threads,
        isLoadingThreads,
        refreshThreads,
        userId,
      }}
    >
      {children}
    </OracleContext.Provider>
  )
}

export const useOracle = () => {
  const context = useContext(OracleContext)
  if (!context) {
    throw new Error('useOracle must be used within an OracleProvider')
  }
  return context
}

export const useSafeOracle = () => {
  return useContext(OracleContext)
}

