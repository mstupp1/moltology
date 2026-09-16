import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getAuthJWTToken } from '@/lib/jwt'
import { useAuthSession } from '@/hooks/useAuthSession'
import {
  getNotificationsFn,
  markNotificationReadFn,
  respondFriendRequestFn,
} from '@/lib/server/api'
import type { NotificationView } from '@/lib/notifications'
import { useHudPersist } from '@/hooks/useHudPersist'
import { useToast } from '@/components/ui/ToastProvider'
import {
  hubUrlForNotificationKind,
  showSystemNotification,
} from '@/lib/system-notifications'
import { shouldFetchNotifications } from '@/lib/notifications-refresh'

export { NOTIFICATIONS_MIN_INTERVAL_MS } from '@/lib/notifications-refresh'

type NotificationsContextValue = {
  notifications: NotificationView[]
  unreadCount: number
  isLoading: boolean
  refresh: (opts?: { force?: boolean }) => Promise<void>
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
  acceptFriendRequest: (requestId: string, notificationId?: string) => Promise<void>
  declineFriendRequest: (requestId: string, notificationId?: string) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const session = useAuthSession()
  const userId = session.user?.id
  const persist = useHudPersist()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationView[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)
  const authFailureRef = useRef(false)
  const lastFetchedAtRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Reset auth failure flag whenever active user changes
  useEffect(() => {
    authFailureRef.current = false
    lastFetchedAtRef.current = null
    inFlightRef.current = false
  }, [userId])

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    if (!userId || authFailureRef.current) {
      if (!userId) {
        setNotifications([])
        setUnreadCount(0)
      }
      return
    }
    if (
      !shouldFetchNotifications({
        lastFetchedAt: lastFetchedAtRef.current,
        now: Date.now(),
        force: opts?.force,
        inFlight: inFlightRef.current,
      })
    ) {
      return
    }
    inFlightRef.current = true
    setIsLoading(true)
    try {
      const token = await getAuthJWTToken()
      if (!token) {
        setNotifications([])
        setUnreadCount(0)
        return
      }
      const result = await getNotificationsFn({
        data: { token, userId },
      })
      if (!mountedRef.current) return
      authFailureRef.current = false
      lastFetchedAtRef.current = Date.now()
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch (err) {
      // If unauthenticated or token expired, halt polling until user re-authenticates
      const message = err instanceof Error ? err.message : String(err)
      if (
        message.toLowerCase().includes('unauthenticated') ||
        message.toLowerCase().includes('authentication required')
      ) {
        authFailureRef.current = true
      }
    } finally {
      inFlightRef.current = false
      if (mountedRef.current) setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      lastFetchedAtRef.current = null
      inFlightRef.current = false
      return
    }

    void refresh()

    const onWakeup = () => {
      if (typeof document !== 'undefined' && document.hidden) return
      void refresh()
    }

    window.addEventListener('focus', onWakeup)
    document.addEventListener('visibilitychange', onWakeup)
    return () => {
      window.removeEventListener('focus', onWakeup)
      document.removeEventListener('visibilitychange', onWakeup)
    }
  }, [userId, refresh])

  // Bridge Activity Center rows to OS surface alerts when the hub is backgrounded.
  useEffect(() => {
    if (!userId) return
    for (const item of notifications) {
      if (item.readAt) continue
      void showSystemNotification({
        title: item.title,
        body: item.detail,
        tag: `activity-${item.id}`,
        url: hubUrlForNotificationKind(item.kind, item.payload),
      })
    }
  }, [notifications, userId])

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return
      const token = await getAuthJWTToken()
      if (!token) return
      await markNotificationReadFn({
        data: { notificationId, token, userId },
      })
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date().toISOString(), actionable: false } : n
        )
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    },
    [userId]
  )

  const markAllRead = useCallback(async () => {
    if (!userId) return
    const token = await getAuthJWTToken()
    if (!token) return
    await markNotificationReadFn({
      data: { all: true, token, userId },
    })
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        readAt: n.readAt || new Date().toISOString(),
        actionable: false,
      }))
    )
    setUnreadCount(0)
  }, [userId])

  const respond = useCallback(
    async (requestId: string, action: 'accept' | 'reject', notificationId?: string) => {
      if (!userId) {
        toast.error('Authentication required.')
        return
      }
      persist.begin('notifications')
      try {
        const token = await getAuthJWTToken()
        if (!token) {
          toast.error('Authentication required.')
          return
        }
        await respondFriendRequestFn({
          data: { requestId, action, token, userId },
        })
        if (notificationId) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId
                ? { ...n, readAt: new Date().toISOString(), actionable: false }
                : n
            )
          )
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        toast.success(action === 'accept' ? 'Friend request accepted.' : 'Friend request declined.')
        await refresh({ force: true })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not update friend request.')
      } finally {
        persist.end('notifications')
      }
    },
    [persist, refresh, toast, userId]
  )

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refresh,
      markRead,
      markAllRead,
      acceptFriendRequest: (requestId, notificationId) =>
        respond(requestId, 'accept', notificationId),
      declineFriendRequest: (requestId, notificationId) =>
        respond(requestId, 'reject', notificationId),
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      refresh,
      markRead,
      markAllRead,
      respond,
    ]
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

const EMPTY: NotificationsContextValue = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  acceptFriendRequest: async () => {},
  declineFriendRequest: async () => {},
}

export function useNotifications(): NotificationsContextValue {
  return useContext(NotificationsContext) ?? EMPTY
}
