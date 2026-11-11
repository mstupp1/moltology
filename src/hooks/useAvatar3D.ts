import { useEffect, useSyncExternalStore } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { can3D, known3D, mark3DUnavailable, subscribe3DSupport } from '@/lib/avatar3d-support'
import { hasExperiment } from '@/lib/experiments'
import { canViewHiddenPages } from '@/lib/hidden-pages'
import { getAuthJWTToken } from '@/lib/jwt'
import { getUserProfileFn } from '@/lib/server/api'

/**
 * Whether the signed-in viewer sees characters in 3D (the `avatar-3d` experiment).
 *
 * Avatars appear many times on a page, so the answer is read once per viewer and shared.
 * Experiments are admin only, so members never trigger the read at all. It is always off in a
 * browser that cannot draw 3D, or once 3D has failed on this page, so those viewers keep 2D.
 */
let known: { userId: string; on: boolean } | null = null
let loading: string | null = null
let listening = false
const listeners = new Set<() => void>()

function publish(next: typeof known): void {
  known = next
  for (const listener of listeners) listener()
}

async function read(userId: string): Promise<void> {
  loading = userId
  let on = false
  try {
    const token = await getAuthJWTToken().catch(() => null)
    const profile = await getUserProfileFn({ data: { token: token ?? undefined, userId } })
    on = hasExperiment(profile?.role, profile?.experiments, 'avatar-3d')
  } catch {
    on = false
  }
  if (loading !== userId) return
  loading = null
  // A browser that cannot draw 3D keeps the 2D character, whatever the switch says.
  if (on && !can3D()) mark3DUnavailable()
  publish({ userId, on })
}

function ensure(userId: string): void {
  if (!listening) {
    listening = true
    window.addEventListener('experiments-changed', () => {
      if (known) void read(known.userId)
    })
  }
  if (known?.userId === userId || loading === userId) return
  void read(userId)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const stop = subscribe3DSupport(listener)
  return () => {
    listeners.delete(listener)
    stop()
  }
}

export function useAvatar3D(): boolean {
  const session = useAuthSession()
  const userId = !session.isPending && canViewHiddenPages(session.user, null) ? (session.userId ?? null) : null
  useEffect(() => {
    if (userId) ensure(userId)
  }, [userId])
  const on = useSyncExternalStore(
    subscribe,
    () => Boolean(userId && known?.userId === userId && known.on && known3D()),
    () => false,
  )
  return on
}

export function resetAvatar3DForTests(): void {
  known = null
  loading = null
}
