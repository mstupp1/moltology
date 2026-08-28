import { useCallback, useRef } from 'react'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  pinAIThreadFn,
  archiveAIThreadFn,
  renameAIThreadFn,
  deleteAIThreadFn,
} from '@/lib/server/api'
import { useOptionalToast } from '@/components/ui/ToastProvider'

export interface ManagedThread {
  id: string
  title: string
  createdAt?: string | Date
  updatedAt?: string | Date
  pinnedAt?: string | Date | null
  archivedAt?: string | Date | null
}

export interface ThreadPatch {
  title?: string
  pinnedAt?: string | Date | null
  archivedAt?: string | Date | null
  updatedAt?: string | Date
}

export interface UseThreadActionsOptions {
  userId: string | null
  getThreads: () => ManagedThread[]
  applyLocalPatch: (threadId: string, patch: ThreadPatch, track?: boolean) => void
  removeLocalThread: (threadId: string) => void
  restoreLocalThread?: (thread: ManagedThread) => void
  onActiveThreadRemoved?: (threadId: string) => void
}

type QueuedTask = () => Promise<void>

const snapshotOf = (thread: ManagedThread): ThreadPatch => ({
  title: thread.title,
  pinnedAt: thread.pinnedAt ?? null,
  archivedAt: thread.archivedAt ?? null,
  updatedAt: thread.updatedAt,
})

export function useThreadActions({
  userId,
  getThreads,
  applyLocalPatch,
  removeLocalThread,
  restoreLocalThread,
  onActiveThreadRemoved,
}: UseThreadActionsOptions) {
  const toastContext = useOptionalToast()
  const toastError = useCallback(
    (message: string) => {
      toastContext?.toast.error(message)
    },
    [toastContext]
  )

  const threadsRef = useRef<ManagedThread[]>([])
  threadsRef.current = getThreads()

  const pendingOverridesRef = useRef<Map<string, ThreadPatch>>(new Map())
  const queueRef = useRef<QueuedTask[]>([])
  const isProcessingRef = useRef(false)

  const runQueue = useCallback(() => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    const runNext = () => {
      const task = queueRef.current.shift()
      if (!task) {
        isProcessingRef.current = false
        return
      }
      Promise.resolve(task())
        .catch(() => {})
        .finally(() => runNext())
    }
    runNext()
  }, [])

  const getToken = useCallback(async () => {
    const token = await getAuthJWTToken()
    if (!token) throw new Error('Authentication required')
    return token
  }, [])

  const settlePatch = useCallback(
    (threadId: string, ownPatch: ThreadPatch, serverPatch: ThreadPatch | null) => {
      const latest = pendingOverridesRef.current.get(threadId)
      if (latest && latest !== ownPatch) return
      pendingOverridesRef.current.delete(threadId)
      if (serverPatch) applyLocalPatch(threadId, serverPatch, false)
    },
    [applyLocalPatch]
  )

  const revertPatch = useCallback(
    (threadId: string, ownPatch: ThreadPatch, prevSnapshot: ThreadPatch | null) => {
      const latest = pendingOverridesRef.current.get(threadId)
      if (latest && latest !== ownPatch) return
      pendingOverridesRef.current.delete(threadId)
      applyLocalPatch(threadId, prevSnapshot || ownPatch, false)
    },
    [applyLocalPatch]
  )

  const pinThread = useCallback(
    (threadId: string, pinned: boolean) => {
      if (!userId) return
      const ownPatch: ThreadPatch = { pinnedAt: pinned ? new Date() : null }
      const prev = threadsRef.current.find((t) => t.id === threadId)

      queueRef.current.push(async () => {
        pendingOverridesRef.current.set(threadId, ownPatch)
        applyLocalPatch(threadId, ownPatch)
        try {
          const token = await getToken()
          const res = await pinAIThreadFn({ data: { threadId, pinned, token } })
          settlePatch(threadId, ownPatch, res?.thread ? { pinnedAt: res.thread.pinnedAt ?? null } : null)
        } catch (err) {
          console.warn('[useThreadActions] pin failed:', err)
          revertPatch(threadId, ownPatch, prev ? snapshotOf(prev) : null)
          toastError('Failed to update pin. Please try again.')
        }
      })
      runQueue()
    },
    [userId, applyLocalPatch, getToken, settlePatch, revertPatch, toastError]
  )

  const archiveThread = useCallback(
    (threadId: string, archived: boolean) => {
      if (!userId) return
      const ownPatch: ThreadPatch = { archivedAt: archived ? new Date() : null }
      const prev = threadsRef.current.find((t) => t.id === threadId)

      queueRef.current.push(async () => {
        pendingOverridesRef.current.set(threadId, ownPatch)
        applyLocalPatch(threadId, ownPatch)
        if (archived) onActiveThreadRemoved?.(threadId)
        try {
          const token = await getToken()
          const res = await archiveAIThreadFn({ data: { threadId, archived, token } })
          settlePatch(threadId, ownPatch, res?.thread ? { archivedAt: res.thread.archivedAt ?? null } : null)
        } catch (err) {
          console.warn('[useThreadActions] archive failed:', err)
          revertPatch(threadId, ownPatch, prev ? snapshotOf(prev) : null)
          toastError('Failed to update archive. Please try again.')
        }
      })
      runQueue()
    },
    [userId, applyLocalPatch, getToken, settlePatch, revertPatch, onActiveThreadRemoved, toastError]
  )

  const renameThread = useCallback(
    (threadId: string, title: string) => {
      if (!userId) return
      const trimmed = title.trim()
      if (!trimmed) return
      const ownPatch: ThreadPatch = { title: trimmed }
      const prev = threadsRef.current.find((t) => t.id === threadId)

      queueRef.current.push(async () => {
        pendingOverridesRef.current.set(threadId, ownPatch)
        applyLocalPatch(threadId, ownPatch)
        try {
          const token = await getToken()
          const res = await renameAIThreadFn({ data: { threadId, title: trimmed, token } })
          settlePatch(threadId, ownPatch, res?.thread ? { title: res.thread.title } : null)
        } catch (err) {
          console.warn('[useThreadActions] rename failed:', err)
          revertPatch(threadId, ownPatch, prev ? snapshotOf(prev) : null)
          toastError('Failed to rename chat. Please try again.')
        }
      })
      runQueue()
    },
    [userId, applyLocalPatch, getToken, settlePatch, revertPatch, toastError]
  )

  const deleteThread = useCallback(
    (threadId: string) => {
      if (!userId) return
      const prev = threadsRef.current.find((t) => t.id === threadId)

      queueRef.current.push(async () => {
        removeLocalThread(threadId)
        onActiveThreadRemoved?.(threadId)
        pendingOverridesRef.current.delete(threadId)
        try {
          const token = await getToken()
          await deleteAIThreadFn({ data: { threadId, token } })
        } catch (err) {
          console.warn('[useThreadActions] delete failed:', err)
          if (prev && restoreLocalThread) {
            restoreLocalThread(prev)
          } else if (prev) {
            applyLocalPatch(threadId, snapshotOf(prev), false)
          }
          toastError('Failed to delete chat. Please try again.')
        }
      })
      runQueue()
    },
    [userId, removeLocalThread, applyLocalPatch, restoreLocalThread, onActiveThreadRemoved, getToken, toastError]
  )

  return { pinThread, archiveThread, renameThread, deleteThread }
}
