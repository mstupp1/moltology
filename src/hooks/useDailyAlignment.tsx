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

  // Synchronous references to eliminate stale closures and race conditions on rapid clicks
  const tasksRef = useRef<AlignmentTaskItem[]>(tasks)
  tasksRef.current = tasks

  const userIdRef = useRef<string | null>(userId)
  userIdRef.current = userId

  const currentDateRef = useRef<string>(currentDate)
  currentDateRef.current = currentDate

  const toastRef = useRef(toast)
  toastRef.current = toast

  const persistRef = useRef(persist)
  persistRef.current = persist

  const initialFetchDoneRef = useRef(false)

  // Track pending optimistic target states per task key to prevent server responses from stomping in-flight clicks
  const pendingOverridesRef = useRef<Map<string, boolean>>(new Map())
  // Serial queue of task keys to persist sequentially to the backend
  const queueRef = useRef<string[]>([])
  const isProcessingRef = useRef<boolean>(false)

  const applyPendingOverrides = useCallback((serverTasks: AlignmentTaskItem[]): AlignmentTaskItem[] => {
    if (pendingOverridesRef.current.size === 0) return serverTasks
    return serverTasks.map((t) => {
      if (pendingOverridesRef.current.has(t.key)) {
        return {
          ...t,
          completed: pendingOverridesRef.current.get(t.key)!,
        }
      }
      return t
    })
  }, [])

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
        const mergedTasks = applyPendingOverrides(data.tasks)
        tasksRef.current = mergedTasks
        setTasks(mergedTasks)

        if (pendingOverridesRef.current.size === 0) {
          setHistory(data.history || [])
          setServerStreakDays(data.streakDays || 0)
        } else {
          // If pending overrides are active, merge history while preserving currentDate's optimistic count
          const optimisticCount = mergedTasks.filter((t) => t.completed).length
          const serverHistory = data.history || []
          const withoutToday = serverHistory.filter((h) => h.date !== targetDate)
          setHistory([...withoutToday, { date: targetDate, completedCount: optimisticCount }])
        }
      }
    } catch (err) {
      console.warn('[useDailyAlignment] Failed to fetch alignment from server:', err)
    } finally {
      setIsLoading(false)
      initialFetchDoneRef.current = true
    }
  }, [userId, applyPendingOverrides])

  // Re-fetch on user login or date change
  useEffect(() => {
    const today = localDateString()
    setCurrentDate(today)
    currentDateRef.current = today

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
        currentDateRef.current = today
        if (userId) {
          fetchAlignment(today, true)
        } else {
          const fresh = mergeCompletions([])
          tasksRef.current = fresh
          setTasks(fresh)
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentDate, userId, fetchAlignment])

  // Serial queue worker to process mutations sequentially without race conditions
  const triggerQueueProcessing = useCallback(() => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setIsSyncing(true)
    persistRef.current.begin('daily-alignment')

    const runQueue = async () => {
      try {
        while (queueRef.current.length > 0) {
          const nextKey = queueRef.current.shift()!
          const targetCompleted = pendingOverridesRef.current.get(nextKey)
          if (targetCompleted === undefined) {
            continue
          }

          try {
            const token = await getAuthJWTToken()
            const response = await toggleDailyAlignmentTaskFn({
              data: {
                taskKey: nextKey,
                completed: targetCompleted,
                date: currentDateRef.current,
                userId: userIdRef.current || undefined,
                token: token ?? undefined,
              },
            })

            // If the pending override has not changed during this in-flight call, clear it
            if (pendingOverridesRef.current.get(nextKey) === targetCompleted) {
              pendingOverridesRef.current.delete(nextKey)
            }

            if (response) {
              const merged = response.tasks.map((serverTask) => {
                if (pendingOverridesRef.current.has(serverTask.key)) {
                  return {
                    ...serverTask,
                    completed: pendingOverridesRef.current.get(serverTask.key)!,
                  }
                }
                return serverTask
              })

              tasksRef.current = merged
              setTasks(merged)

              const remainingOverridesCount = pendingOverridesRef.current.size
              if (remainingOverridesCount > 0) {
                const optimisticCount = merged.filter((t) => t.completed).length
                const serverHistory = response.history || []
                const withoutToday = serverHistory.filter((h) => h.date !== currentDateRef.current)
                setHistory([...withoutToday, { date: currentDateRef.current, completedCount: optimisticCount }])
              } else {
                setHistory(response.history || [])
                setServerStreakDays(response.streakDays || 0)
              }
            }
          } catch (err) {
            console.warn('[useDailyAlignment] Remote alignment sync disrupted:', err)
            pendingOverridesRef.current.delete(nextKey)
            toastRef.current.warning(
              'Alignment liturgy recorded locally. Telemetry synchronization will re-engage.',
              {
                id: 'daily-alignment-sync-warning',
                title: 'TELEMETRY SYNC',
                duration: 4000,
              }
            )
          }
        }
      } finally {
        isProcessingRef.current = false
        setIsSyncing(false)
        persistRef.current.end('daily-alignment')
      }
    }

    runQueue()
  }, [])

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

  const toggleTask = useCallback(
    async (taskKeyOrId: string) => {
      const targetKey = taskKeyOrId.toLowerCase().trim()
      const currentTasks = tasksRef.current
      const currentTask = currentTasks.find((t) => t.key === targetKey || t.id === targetKey)
      if (!currentTask) return

      const canonicalKey = currentTask.key

      // Determine next completion state based on current optimistic state
      const nextCompleted = !currentTask.completed

      // Record pending override
      pendingOverridesRef.current.set(canonicalKey, nextCompleted)

      // Compute updated tasks array immediately
      const prevCount = currentTasks.filter((t) => t.completed).length
      const nextTasks = currentTasks.map((t) =>
        t.key === canonicalKey ? { ...t, completed: nextCompleted } : t
      )
      const nextCount = nextTasks.filter((t) => t.completed).length

      // Synchronously update ref & React state
      tasksRef.current = nextTasks
      setTasks(nextTasks)

      // Synchronously update local history for instant streak/heatmap alignment
      setHistory((prev) => {
        const existing = prev.filter((h) => h.date !== currentDateRef.current)
        return [...existing, { date: currentDateRef.current, completedCount: nextCount }]
      })

      // Completion celebration trigger
      if (prevCount < TOTAL_ALIGNMENT_TASKS && nextCount === TOTAL_ALIGNMENT_TASKS) {
        toastRef.current.success('All eight daily alignment liturgies recorded. Protocol verified.', {
          id: 'daily-alignment-complete-toast',
          title: 'DAILY ALIGNMENT COMPLETE',
          duration: 6000,
        })
      }

      // Authenticated users: enqueue background sync
      if (userIdRef.current) {
        if (!queueRef.current.includes(canonicalKey)) {
          queueRef.current.push(canonicalKey)
        }
        triggerQueueProcessing()
      }
    },
    [triggerQueueProcessing]
  )

  const refetch = useCallback(async () => {
    await fetchAlignment(currentDateRef.current)
  }, [fetchAlignment])

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
  const tasksRef = useRef<AlignmentTaskItem[]>(tasks)
  tasksRef.current = tasks
  const currentDate = useMemo(() => localDateString(), [])
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks])
  const completedCount = completedTasks.length
  const isAllCompleted = completedCount === TOTAL_ALIGNMENT_TASKS

  const toggleTask = useCallback(async (taskKeyOrId: string) => {
    const targetKey = taskKeyOrId.toLowerCase().trim()
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.key === targetKey || t.id === targetKey
          ? { ...t, completed: !t.completed }
          : t
      )
      tasksRef.current = next
      return next
    })
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
