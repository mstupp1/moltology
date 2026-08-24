import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { getAIThreadsFn } from '@/lib/server/api'

export type OracleMode = 'closed' | 'popout' | 'sidebar' | 'page'

export const STORAGE_KEY_ORACLE_LAST_MODE = 'moltology:oracle_last_mode'

export interface OracleThread {
  id: string
  title: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

interface OracleContextType {
  mode: OracleMode
  lastActiveMode: 'popout' | 'sidebar' | 'page'
  setMode: (mode: OracleMode) => void
  toggleMode: (targetMode?: 'popout' | 'sidebar' | 'page') => void
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
  const [lastActiveMode, setLastActiveMode] = useState<'popout' | 'sidebar' | 'page'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_ORACLE_LAST_MODE)
        if (saved === 'sidebar' || saved === 'popout' || saved === 'page') {
          return saved
        }
      } catch {}
    }
    return 'popout'
  })
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
    // If mobile and sidebar mode is requested, redirect to dedicated page mode
    let targetMode = newMode
    if (targetMode === 'sidebar' && typeof window !== 'undefined' && window.innerWidth < 768) {
      targetMode = 'page'
    }

    if (targetMode !== 'closed') {
      setLastActiveMode(targetMode)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_ORACLE_LAST_MODE, targetMode)
        } catch {}
      }
    }

    // If transitioning from sidebar mode to small window (popout) mode, clear saved custom layout
    if (mode === 'sidebar' && targetMode === 'popout' && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('moltology:oracle_popout_pos')
        localStorage.removeItem('moltology:oracle_popout_size')
      } catch {}
    }

    // If closing from small window (popout) mode, reset launcher button tile position
    if (mode === 'popout' && targetMode === 'closed' && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('moltology:oracle_button_pos')
      } catch {}
    }

    if (targetMode === mode) return

    setModeState(targetMode)

    if (targetMode === 'page') {
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

  const toggleMode = (targetMode?: 'popout' | 'sidebar' | 'page') => {
    const effectiveTarget = targetMode || lastActiveMode || 'popout'
    const resolvedMode =
      effectiveTarget === 'sidebar' && typeof window !== 'undefined' && window.innerWidth < 768
        ? 'page'
        : effectiveTarget

    if (mode === resolvedMode) {
      setMode('closed')
    } else {
      setMode(resolvedMode)
    }
  }

  return (
    <OracleContext.Provider
      value={{
        mode,
        lastActiveMode,
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

