import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import {
  TOTAL_ALIGNMENT_TASKS,
  mergeCompletions,
  computeStreak,
  buildStreakHistory,
  localDateString,
  type AlignmentTaskItem,
  type DailyStreakDay,
} from '@/lib/alignment-tasks'
import {
  getFreshAlignmentSnapshot,
  setCachedAlignmentSnapshot,
  snapshotFromCompletedKeys,
} from '@/lib/alignment-snapshot'
import {
  getDailyAlignmentFn,
  getUserProfileFn,
  toggleDailyAlignmentTaskFn,
} from '@/lib/server/api'
import { useHudPersist } from '@/hooks/useHudPersist'
import {
  calculateProgression,
  calculateXpFromHistory,
  type ProgressionState,
} from '@/lib/progression'
import { SilentSynchronizationDialog } from '@/components/hud/SilentSynchronizationDialog'
import { generateLobsterAvatarDataUri, parseLobsterAvatarConfig } from '@/lib/lobster-avatar'
import { resolveMemberPublicName } from '@/lib/member-handle'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

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
  setTaskCompleted: (taskKey: string, completed: boolean) => Promise<void>
  openSilentSynchronization: () => void
  refetch: () => Promise<void>
  currentDate: string
  isGuest: boolean
  xp: number
  stage: number
  progression: ProgressionState
}

const AlignmentContext = createContext<AlignmentContextValue | null>(null)

export function AlignmentProvider({ children }: { children: React.ReactNode }) {
  const session = useAuthSession()
  const userId = session.userId
  const isAuthPending = session.isPending
  const isGuest = session.isGuest
  const persist = useHudPersist()

  const toastCtx = useOptionalToast()
  const toast = toastCtx?.toast ?? {
    success: () => '',
    error: () => '',
    warning: () => '',
    info: () => '',
    hud: () => '',
  }

  const [currentDate, setCurrentDate] = useState<string>(() => localDateString())
  const [tasks, setTasks] = useState<AlignmentTaskItem[]>(() => mergeCompletions([]))
  const [history, setHistory] = useState<Array<{ date: string; completedCount: number }>>([])
  const [serverStreakDays, setServerStreakDays] = useState<number>(0)
  const [serverTodayWasComplete, setServerTodayWasComplete] = useState(false)
  const [hasServerStreakBaseline, setHasServerStreakBaseline] = useState(false)
  const [serverXp, setServerXp] = useState<number>(0)
  const [serverStage, setServerStage] = useState<number>(1)
  const [optimisticXpDelta, setOptimisticXpDelta] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [silentDialogOpen, setSilentDialogOpen] = useState(false)
  const [silentDialogDate, setSilentDialogDate] = useState<string | null>(null)
  const silentDialogUserRef = useRef<string | null>(null)
  const [silentAvatarUrl, setSilentAvatarUrl] = useState<string | null>(null)
  const [silentAvatarName, setSilentAvatarName] = useState<string | undefined>()

  const sessionImage = session.user?.image ?? session.user?.avatar ?? session.user?.picture ?? null
  const loadSilentAvatar = useCallback(async () => {
    if (!userId) { setSilentAvatarUrl(null); setSilentAvatarName(undefined); return }
    const activeUserId = userId
    try {
      const token = await getAuthJWTToken().catch(() => null)
      const profile = await getUserProfileFn({ data: { token: token ?? undefined, userId: activeUserId } })
      if (userIdRef.current !== activeUserId) return
      const config = parseLobsterAvatarConfig(profile?.avatarConfig)
      setSilentAvatarUrl(config ? generateLobsterAvatarDataUri(config, 128, { frame: 'portrait', staticMotion: true }) : sessionImage)
      setSilentAvatarName(resolveMemberPublicName({ userId: activeUserId, handle: profile?.handle, larvaId: profile?.larvaId }))
    } catch { setSilentAvatarUrl(null); setSilentAvatarName(undefined) }
  }, [userId, sessionImage])

  /* Profile data is fetched only when the member opens this practice. */
  const profileAvatarRef = useRef(loadSilentAvatar)
  profileAvatarRef.current = loadSilentAvatar
  useEffect(() => {
    if (!userId) { setSilentAvatarUrl(null); setSilentAvatarName(undefined); return }
    const onAvatarChanged = () => { void profileAvatarRef.current() }
    window.addEventListener('profile-avatar-changed', onAvatarChanged)
    return () => window.removeEventListener('profile-avatar-changed', onAvatarChanged)
  }, [userId])

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
  const snapshotUserRef = useRef<string | null>(null)
  const hasTrustworthyCountRef = useRef(false)

  // Track pending optimistic target states per task key to prevent server responses from stomping in-flight clicks
  const pendingOverridesRef = useRef<Map<string, boolean>>(new Map())
  // Serial queue of task keys to persist sequentially to the backend
  const queueRef = useRef<string[]>([])
  const isProcessingRef = useRef<boolean>(false)

  const persistSnapshot = useCallback((date: string, nextTasks: AlignmentTaskItem[]) => {
    const id = userIdRef.current
    if (!id) return
    setCachedAlignmentSnapshot(
      id,
      snapshotFromCompletedKeys(
        date,
        nextTasks.filter((t) => t.completed).map((t) => t.key),
      ),
    )
  }, [])

  const markCountReady = useCallback((nextTasks: AlignmentTaskItem[], date: string) => {
    hasTrustworthyCountRef.current = true
    persistSnapshot(date, nextTasks)
    setIsLoading(false)
  }, [persistSnapshot])

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
      hasTrustworthyCountRef.current = true
      setIsLoading(false)
      return
    }

    if (!isSilent && !hasTrustworthyCountRef.current) {
      setIsLoading(true)
    }

    try {
      const token = await getAuthJWTToken()
      if (!token) {
        // Signed-in chrome with no JWT yet: do not paint the unauthenticated empty stub as 0/8.
        return
      }

      const data = await getDailyAlignmentFn({
        data: { date: targetDate, token },
      })
      if (data) {
        const serverHistory = data.history || []
        setServerStreakDays(data.streakDays || 0)
        setServerTodayWasComplete(
          serverHistory.find((day) => day.date === targetDate)?.completedCount === TOTAL_ALIGNMENT_TASKS,
        )
        setHasServerStreakBaseline(true)
        const mergedTasks = applyPendingOverrides(data.tasks)
        tasksRef.current = mergedTasks
        setTasks(mergedTasks)
        markCountReady(mergedTasks, targetDate)

        setServerXp(data.xp ?? 0)
        setServerStage(data.stage ?? 1)

        if (pendingOverridesRef.current.size === 0) {
          setHistory(serverHistory)
          setOptimisticXpDelta(0)
        } else {
          // If pending overrides are active, merge history while preserving currentDate's optimistic count
          const optimisticCount = mergedTasks.filter((t) => t.completed).length
          const withoutToday = serverHistory.filter((h) => h.date !== targetDate)
          setHistory([...withoutToday, { date: targetDate, completedCount: optimisticCount }])
        }
      }
    } catch (err) {
      console.warn('[useDailyAlignment] Failed to fetch alignment from server:', err)
    } finally {
      if (hasTrustworthyCountRef.current) {
        setIsLoading(false)
      }
      initialFetchDoneRef.current = true
    }
  }, [userId, applyPendingOverrides, markCountReady])

  // Seed last-known liturgies before paint so the header never flashes a fake 0/8
  useIsomorphicLayoutEffect(() => {
    if (!userId) {
      snapshotUserRef.current = null
      if (!isAuthPending) {
        hasTrustworthyCountRef.current = true
        setIsLoading(false)
      }
      return
    }

    if (snapshotUserRef.current === userId && hasTrustworthyCountRef.current) return
    snapshotUserRef.current = userId

    const today = localDateString()
    const snapshot = getFreshAlignmentSnapshot(userId, today)
    if (!snapshot) return

    const merged = applyPendingOverrides(mergeCompletions(snapshot.completedKeys))
    tasksRef.current = merged
    setTasks(merged)
    markCountReady(merged, today)
  }, [userId, isAuthPending, applyPendingOverrides, markCountReady])

  // Re-fetch on user login or date change
  useEffect(() => {
    const today = localDateString()
    setCurrentDate(today)
    currentDateRef.current = today

    if (userId) {
      fetchAlignment(today, hasTrustworthyCountRef.current)
    } else if (!isAuthPending) {
      hasTrustworthyCountRef.current = true
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
          const snapshot = getFreshAlignmentSnapshot(userId, today)
          if (snapshot) {
            const merged = applyPendingOverrides(mergeCompletions(snapshot.completedKeys))
            tasksRef.current = merged
            setTasks(merged)
            markCountReady(merged, today)
            fetchAlignment(today, true)
          } else {
            hasTrustworthyCountRef.current = false
            setIsLoading(true)
            fetchAlignment(today, false)
          }
        } else {
          const fresh = mergeCompletions([])
          tasksRef.current = fresh
          setTasks(fresh)
          hasTrustworthyCountRef.current = true
          setIsLoading(false)
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentDate, userId, fetchAlignment, applyPendingOverrides, markCountReady])

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
              persistSnapshot(currentDateRef.current, merged)

              const remainingOverridesCount = pendingOverridesRef.current.size
              setServerXp(response.xp ?? 0)
              setServerStage(response.stage ?? 1)
              const responseHistory = response.history || []
              setServerStreakDays(response.streakDays || 0)
              setServerTodayWasComplete(
                responseHistory.find((day) => day.date === currentDateRef.current)?.completedCount === TOTAL_ALIGNMENT_TASKS,
              )
              setHasServerStreakBaseline(true)

              if (remainingOverridesCount > 0) {
                const optimisticCount = merged.filter((t) => t.completed).length
                const withoutToday = responseHistory.filter((h) => h.date !== currentDateRef.current)
                setHistory([...withoutToday, { date: currentDateRef.current, completedCount: optimisticCount }])
              } else {
                setHistory(responseHistory)
                setOptimisticXpDelta(0)
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
    if (userId && hasServerStreakBaseline) {
      const optimisticTodayIsComplete = tasks.every((task) => task.completed)
      if (serverTodayWasComplete && !optimisticTodayIsComplete) {
        return Math.max(0, serverStreakDays - 1)
      }
      if (!serverTodayWasComplete && optimisticTodayIsComplete) {
        return serverStreakDays + 1
      }
      return serverStreakDays
    }
    return computeStreak(history, currentDate)
  }, [userId, hasServerStreakBaseline, serverTodayWasComplete, serverStreakDays, tasks, history, currentDate])

  const streakHistory = useMemo(() => {
    return buildStreakHistory(history, currentDate, 14)
  }, [history, currentDate])

  const setTaskCompleted = useCallback(
    async (taskKeyOrId: string, nextCompleted: boolean) => {
      const targetKey = taskKeyOrId.toLowerCase().trim()
      const currentTasks = tasksRef.current
      const currentTask = currentTasks.find((t) => t.key === targetKey || t.id === targetKey)
      if (!currentTask) return

      const canonicalKey = currentTask.key

      // Determine next completion state based on current optimistic state
      if (currentTask.completed === nextCompleted) return

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
      persistSnapshot(currentDateRef.current, nextTasks)

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

      // Optimistic XP adjustment
      const willComplete = nextCompleted
      let delta = willComplete ? 10 : -10
      if (willComplete && nextCount === TOTAL_ALIGNMENT_TASKS) {
        delta += 20
      } else if (!willComplete && prevCount === TOTAL_ALIGNMENT_TASKS) {
        delta -= 20
      }
      setOptimisticXpDelta((prev) => prev + delta)

      // Authenticated users: enqueue background sync
      if (userIdRef.current) {
        if (!queueRef.current.includes(canonicalKey)) {
          queueRef.current.push(canonicalKey)
        }
        triggerQueueProcessing()
      }
    },
    [triggerQueueProcessing, persistSnapshot]
  )

  const toggleTask = useCallback(async (taskKey: string) => {
    const key = taskKey.toLowerCase().trim()
    const current = tasksRef.current.find((task) => task.key === key || task.id === key)
    if (current) await setTaskCompleted(taskKey, !current.completed)
  }, [setTaskCompleted])
  const openSilentSynchronization = useCallback(() => {
    silentDialogUserRef.current = userIdRef.current
    setSilentDialogDate(currentDateRef.current)
    setSilentDialogOpen(true)
    void profileAvatarRef.current()
  }, [])
  const completeSilentSynchronization = useCallback(() => {
    if (silentDialogDate === currentDateRef.current && silentDialogUserRef.current === userIdRef.current) void setTaskCompleted('silent-synchronization', true)
  }, [silentDialogDate, setTaskCompleted])

  const refetch = useCallback(async () => {
    await fetchAlignment(currentDateRef.current)
  }, [fetchAlignment])

  const progression = useMemo<ProgressionState>(() => {
    if (userId) {
      const currentXp = Math.max(0, serverXp + optimisticXpDelta)
      return calculateProgression(currentXp)
    }
    const guestXp = calculateXpFromHistory(history, currentDate, tasks)
    return calculateProgression(guestXp)
  }, [userId, serverXp, optimisticXpDelta, history, currentDate, tasks])

  const effectiveXp = progression.xp
  const effectiveStage = progression.stage

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
    setTaskCompleted,
    openSilentSynchronization,
    refetch,
    currentDate,
    isGuest,
    xp: effectiveXp,
    stage: effectiveStage,
    progression,
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
    setTaskCompleted,
    openSilentSynchronization,
    refetch,
    currentDate,
    isGuest,
    effectiveXp,
    effectiveStage,
    progression,
  ])

  return (
    <AlignmentContext.Provider value={value}>
      {children}
      <SilentSynchronizationDialog open={silentDialogOpen} onClose={() => setSilentDialogOpen(false)} onComplete={completeSilentSynchronization} avatarUrl={silentAvatarUrl} avatarName={silentAvatarName} />
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
  const setTaskCompleted = useCallback(async (taskKeyOrId: string, completed: boolean) => {
    const key = taskKeyOrId.toLowerCase().trim()
    setTasks((prev) => {
      const next = prev.map((t) => t.key === key || t.id === key ? { ...t, completed } : t)
      tasksRef.current = next
      return next
    })
  }, [])
  const openSilentSynchronization = useCallback(() => {}, [])

  const refetch = useCallback(async () => {}, [])

  const progression = useMemo<ProgressionState>(() => {
    const xp = calculateXpFromHistory([], currentDate, tasks)
    return calculateProgression(xp)
  }, [currentDate, tasks])

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
    setTaskCompleted,
    openSilentSynchronization,
    refetch,
    currentDate,
    isGuest: true,
    xp: progression.xp,
    stage: progression.stage,
    progression,
  }
}

export function useDailyAlignment(): AlignmentContextValue {
  const ctx = useContext(AlignmentContext)
  if (!ctx) {
    return useStandaloneDailyAlignment()
  }
  return ctx
}
