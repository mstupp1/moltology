import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { getAuthJWTToken } from '@/lib/jwt'
import { getOracleUsageFn } from '@/lib/server/oracle-usage-api'
import type { OracleUsageSnapshot } from '@/lib/ai/usage-limits'

type State = { userId: string | null; snapshot: OracleUsageSnapshot | null; unavailable: boolean }
const empty: State = { userId: null, snapshot: null, unavailable: false }
let state = empty
let generation = 0
let pending: Promise<void> | null = null
const listeners = new Set<() => void>()
function publish(next: State) {
  state = next
  listeners.forEach((listener) => listener())
}
function selectAccount(userId: string | null) {
  if (state.userId === userId) return
  generation++
  pending = null
  publish({ ...empty, userId })
}
async function refreshUsage(userId: string) {
  if (state.userId !== userId) return
  if (pending) return pending
  const version = generation
  const request = (async () => {
    try {
      const token = await getAuthJWTToken()
      const snapshot = await getOracleUsageFn({ data: { token: token ?? undefined, userId } })
      if (generation === version) publish({ userId, snapshot, unavailable: false })
    } catch {
      if (generation === version) publish({ ...state, unavailable: true })
    }
  })()
  pending = request
  try { await request } finally { if (generation === version) pending = null }
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Shared account-scoped memory only; no usage data survives sign-out. */
export function useOracleUsage(userId: string | null) {
  const current = useSyncExternalStore(subscribe, () => state, () => empty)
  const refresh = useCallback(() => userId ? refreshUsage(userId) : Promise.resolve(), [userId])
  useEffect(() => {
    selectAccount(userId)
    if (!userId) return
    const whenVisible = () => { if (document.visibilityState !== 'hidden') void refresh() }
    whenVisible()
    const timer = window.setInterval(whenVisible, 60_000)
    window.addEventListener('focus', whenVisible)
    document.addEventListener('visibilitychange', whenVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', whenVisible)
      document.removeEventListener('visibilitychange', whenVisible)
    }
  }, [userId, refresh])
  const snapshot = current.userId === userId ? current.snapshot : null
  useEffect(() => {
    if (!snapshot?.nextAllowedAt) return
    const delay = Date.parse(snapshot.nextAllowedAt) - Date.now()
    if (delay <= 0) return
    const timer = window.setTimeout(() => { if (document.visibilityState !== 'hidden') void refresh() }, delay + 100)
    return () => window.clearTimeout(timer)
  }, [snapshot, refresh])
  const unavailable = current.userId === userId && current.unavailable
  return { snapshot, unavailable, refresh, blocked: Boolean(snapshot?.nextAllowedAt && !unavailable) }
}
