import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { authClient } from '@/lib/auth-client'
import { getAuthJWTToken } from '@/lib/jwt'
import { useToast } from '@/components/ui/ToastProvider'
import {
  CANONICAL_ALIGNMENT_TASKS,
  TOTAL_ALIGNMENT_TASKS,
  mergeCompletions,
  computeStreak,
  buildStreakHistory,
  localDateString,
  type AlignmentTaskItem,
  type DailyStreakDay,
} from '@/lib/alignment-tasks'
import {
  getDailyAlignmentFn,
  toggleDailyAlignmentTaskFn,
} from '@/lib/server/api'
import { useHudPersist } from '@/hooks/useHudPersist'

export interface AlignmentContextValue {
  tasks: AlignmentTaskItem[]
  completedCount: number
  totalCount: number
  isAllCompleted: boolean
  streakDays: number
  streakHistory: DailyStreakDay[]
  history: Array<{ date: string; completedCount: number }>
  isLoading: boolean
  isSyncing: boolean
  toggleTask: (taskKey: string) => Promise<void>
  refetch: () => Promise<void>
  currentDate: string
  isGuest: boolean
}

const AlignmentContext = createContext<AlignmentContextValue | null>(null)

export function AlignmentProvider({ children }: { children: React.ReactNode }) {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null
  const isAuthPending = sessionRes?.isPending ?? false
  const isGuest = !userId && !isAuthPending
  const persist = useHudPersist()

  let toast: {
    success: (m: string, o?: any) => string
    error: (m: string, o?: any) => string
    warning: (m: string, o?: any) => string
    info: (m: string, o?: any) => string
    hud: (m: string, o?: any) => string
  }
  try {
    const toastCtx = useToast()
    toast = toastCtx.toast
  } catch {
    toast = {
      success: () => '',
      error: () => '',
      warning: () => '',
      info: () => '',
      hud: () => '',
    }
  }

  const [currentDate, setCurrentDate] = useState<string>(() => localDateString())
  const [tasks, setTasks] = useState<AlignmentTaskItem[]>(() => mergeCompletions([]))
  const [history, setHistory] = useState<Array<{ date: string; completedCount: number }>>([])
  const [serverStreakDays, setServerStreakDays] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const initialFetchDoneRef = useRef(false)

  // Fetch alignment from backend for authenticated users
  const fetchAlignment = useCallback(async (targetDate: string, isSilent = false) => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    if (!isSilent) {
      setIsLoading(true)
    }

    try {
      const token = await getAuthJWTToken()
      const data = await getDailyAlignmentFn({
        data: { date: targetDate, token: token ?? undefined },
      })
      if (data) {
        setTasks(data.tasks)
        setHistory(data.history || [])
        setServerStreakDays(data.streakDays || 0)
      }
    } catch (err) {
      console.warn('[useDailyAlignment] Failed to fetch alignment from server:', err)
    } finally {
      setIsLoading(false)
      initialFetchDoneRef.current = true
    }
  }, [userId])

  // Re-fetch on user login or date change
  useEffect(() => {
    const today = localDateString()
    setCurrentDate(today)

    if (userId) {
      fetchAlignment(today)
    } else if (!isAuthPending) {
      setIsLoading(false)
    }
  }, [userId, isAuthPending, fetchAlignment])

  // Check for local calendar date turnover on window focus
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleFocus = () => {
      const today = localDateString()
      if (today !== currentDate) {
        setCurrentDate(today)
        if (userId) {
          fetchAlignment(today, true)
        } else {
          setTasks(mergeCompletions([]))
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentDate, userId, fetchAlignment])

  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks])
  const completedCount = completedTasks.length
  const isAllCompleted = completedCount === TOTAL_ALIGNMENT_TASKS

  const streakDays = useMemo(() => {
    if (userId && serverStreakDays > 0) {
      return serverStreakDays
    }
    return computeStreak(history, currentDate)
  }, [userId, serverStreakDays, history, currentDate])

  const streakHistory = useMemo(() => {
    return buildStreakHistory(history, currentDate, 14)
  }, [history, currentDate])

  const toggleTask = useCallback(async (taskKeyOrId: string) => {
    // Normalize key or id
    const targetKey = taskKeyOrId.toLowerCase().trim()
    const currentTask = tasks.find((t) => t.key === targetKey || t.id === targetKey)
    if (!currentTask) return

    const prevTasks = [...tasks]
    const nextCompleted = !currentTask.completed
    const nextTasks = tasks.map((t) =>
      t.key === currentTask.key ? { ...t, completed: nextCompleted } : t
    )

    const prevCount = prevTasks.filter((t) => t.completed).length
    const nextCount = nextTasks.filter((t) => t.completed).length

    // Optimistically update UI
    setTasks(nextTasks)

    // Check completion trigger: if user completes all 8 tasks
    if (prevCount < TOTAL_ALIGNMENT_TASKS && nextCount === TOTAL_ALIGNMENT_TASKS) {
      toast.success('All eight daily alignment liturgies recorded. Protocol verified.', {
        id: 'daily-alignment-complete-toast',
        title: 'DAILY ALIGNMENT COMPLETE',
        duration: 6000,
      })
    }

    // Authenticated users: persist to backend
    if (userId) {
      setIsSyncing(true)
      persist.begin('daily-alignment')
      try {
        const token = await getAuthJWTToken()
        const response = await toggleDailyAlignmentTaskFn({
          data: {
            taskKey: currentTask.key,
            completed: nextCompleted,
            date: currentDate,
            userId: userId || undefined,
            token: token ?? undefined,
          },
        })

        if (response) {
          setTasks(response.tasks)
          setHistory(response.history || [])
          setServerStreakDays(response.streakDays || 0)
        }
      } catch (err) {
        console.warn('[useDailyAlignment] Remote alignment sync disrupted:', err)
        // Maintain optimistic task state and record local history
        setHistory((prev) => {
          const existing = prev.filter((h) => h.date !== currentDate)
          return [...existing, { date: currentDate, completedCount: nextCount }]
        })
        toast.warning(
          'Alignment liturgy recorded locally. Telemetry synchronization will re-engage.',
          {
            id: 'daily-alignment-sync-warning',
            title: 'TELEMETRY SYNC',
            duration: 4000,
          }
        )
      } finally {
        persist.end('daily-alignment')
        setIsSyncing(false)
      }
    } else {
      // Guest local-only history update
      setHistory((prev) => {
        const existing = prev.filter((h) => h.date !== currentDate)
        return [...existing, { date: currentDate, completedCount: nextCount }]
      })
    }
  }, [tasks, userId, currentDate, toast, persist])

  const refetch = useCallback(async () => {
    await fetchAlignment(currentDate)
  }, [fetchAlignment, currentDate])

  const value = useMemo<AlignmentContextValue>(() => ({
    tasks,
    completedCount,
    totalCount: TOTAL_ALIGNMENT_TASKS,
    isAllCompleted,
    streakDays,
    streakHistory,
    history,
    isLoading,
    isSyncing,
    toggleTask,
    refetch,
    currentDate,
    isGuest,
  }), [
    tasks,
    completedCount,
    isAllCompleted,
    streakDays,
    streakHistory,
    history,
    isLoading,
    isSyncing,
    toggleTask,
    refetch,
    currentDate,
    isGuest,
  ])

  return (
    <AlignmentContext.Provider value={value}>
      {children}
    </AlignmentContext.Provider>
  )
}

function useStandaloneDailyAlignment(): AlignmentContextValue {
  const [tasks, setTasks] = useState<AlignmentTaskItem[]>(() => mergeCompletions([]))
  const currentDate = useMemo(() => localDateString(), [])
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks])
  const completedCount = completedTasks.length
  const isAllCompleted = completedCount === TOTAL_ALIGNMENT_TASKS

  const toggleTask = useCallback(async (taskKeyOrId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.key === taskKeyOrId || t.id === taskKeyOrId
          ? { ...t, completed: !t.completed }
          : t
      )
    )
  }, [])

  const refetch = useCallback(async () => {}, [])

  return {
    tasks,
    completedCount,
    totalCount: TOTAL_ALIGNMENT_TASKS,
    isAllCompleted,
    streakDays: 0,
    streakHistory: buildStreakHistory([], currentDate, 14),
    history: [],
    isLoading: false,
    isSyncing: false,
    toggleTask,
    refetch,
    currentDate,
    isGuest: true,
  }
}

export function useDailyAlignment(): AlignmentContextValue {
  const ctx = useContext(AlignmentContext)
  if (!ctx) {
    return useStandaloneDailyAlignment()
  }
  return ctx
}
