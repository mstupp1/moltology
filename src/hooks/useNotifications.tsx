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

const POLL_MS = 60_000

type NotificationsContextValue = {
  notifications: NotificationView[]
  unreadCount: number
  isLoading: boolean
  refresh: () => Promise<void>
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

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    setIsLoading(true)
    try {
      const token = await getAuthJWTToken()
      const result = await getNotificationsFn({
        data: { token: token ?? undefined, userId },
      })
      if (!mountedRef.current) return
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch {
      // Quiet fail — Activity Center still shows toast history
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
    if (!userId) return

    const onFocus = () => {
      void refresh()
    }
    const interval = window.setInterval(() => {
      void refresh()
    }, POLL_MS)

    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [userId, refresh])

  const markRead = useCallback(
    async (notificationId: string) => {
      const token = await getAuthJWTToken()
      await markNotificationReadFn({
        data: { notificationId, token: token ?? undefined, userId },
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
    const token = await getAuthJWTToken()
    await markNotificationReadFn({
      data: { all: true, token: token ?? undefined, userId },
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
      persist.begin('notifications')
      try {
        const token = await getAuthJWTToken()
        await respondFriendRequestFn({
          data: { requestId, action, token: token ?? undefined, userId },
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
        await refresh()
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
