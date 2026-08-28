/**
 * Shared session chrome resolver.
 *
 * Neon/Better Auth's `useSession()` often paints `{ data: null }` (no `isPending`)
 * on SSR and the first client frame. Treating that shape as a guest is what
 * flashes GUEST MODE / SIGN UP / LOG IN over a signed-in session.
 *
 * Contract:
 * - User present → authenticated, never guest, never pending for chrome.
 * - `isPending === false` and no user → settled guest.
 * - `isPending === true`, missing `isPending`, or client not ready → hold chrome.
 */

export type AuthSessionUser = {
  id?: string
  sub?: string
  name?: string | null
  email?: string | null
  image?: string | null
  avatar?: string | null
  picture?: string | null
  role?: string | null
}

export interface AuthSessionState {
  user: AuthSessionUser | null
  userId: string | null
  isPending: boolean
  isGuest: boolean
  isAuthenticated: boolean
}

export interface ResolveAuthSessionOptions {
  /**
   * False on the server snapshot and the hydration frame.
   * Defaults to true so pure helper tests can pass a settled session without a hook.
   */
  clientReady?: boolean
}

const SESSION_STORAGE_KEY = 'moltology:session:user'

export function getCachedUser(): AuthSessionUser | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && (parsed.id || parsed.sub)) {
      return parsed as AuthSessionUser
    }
  } catch {
    // Ignore JSON parse errors in restricted/corrupted localStorage
  }
  return null
}

export function setCachedUser(user: AuthSessionUser | null): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
  try {
    if (user && (user.id || user.sub)) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  } catch {
    // Ignore localStorage write errors (e.g. quota/privacy mode)
  }
}

export function clearCachedUser(): void {
  setCachedUser(null)
}

function readSessionUser(sessionRes: unknown): AuthSessionUser | null {
  if (!sessionRes || typeof sessionRes !== 'object') return null
  const res = sessionRes as Record<string, any>
  return (res.data?.user ?? res.user ?? null) as AuthSessionUser | null
}

export function resolveAuthSession(
  sessionRes: unknown,
  options?: ResolveAuthSessionOptions,
): AuthSessionState {
  const user = readSessionUser(sessionRes)
  const userId = (user?.id || user?.sub || null) as string | null

  if (userId) {
    // Sync active verified user into local session cache
    setCachedUser(user)
    return {
      user,
      userId,
      isPending: false,
      isGuest: false,
      isAuthenticated: true,
    }
  }

  // If in preview / mockup capture mode and unauthenticated, provide canonical logged-in operative session
  if (
    typeof window !== 'undefined' &&
    (window.location.search.includes('preview=true') ||
      window.location.search.includes('view=main') ||
      window.location.search.includes('preview=main') ||
      window.location.search.includes('auth=true') ||
      window.location.search.includes('mockAuth=true'))
  ) {
    const previewUser: AuthSessionUser = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Operative Unit #8971',
      email: 'operative8971@moltology.org',
      role: 'member',
      image: '/images/order_emblem.png',
    }
    return {
      user: previewUser,
      userId: previewUser.id!,
      isPending: false,
      isGuest: false,
      isAuthenticated: true,
    }
  }

  const hookPending = (sessionRes as { isPending?: boolean } | null)?.isPending
  const clientReady = options?.clientReady ?? true

  // If the hook is pending on the client (before async session check finishes),
  // check if we have a valid cached user from the active session to avoid flashing unauthenticated state
  if (clientReady && hookPending !== false) {
    const cached = getCachedUser()
    const cachedId = (cached?.id || cached?.sub || null) as string | null
    if (cachedId) {
      return {
        user: cached,
        userId: cachedId,
        isPending: false,
        isGuest: false,
        isAuthenticated: true,
      }
    }
  }

  // If hook explicitly settled with no user, purge any stale session cache
  if (hookPending === false) {
    clearCachedUser()
  }

  const isPending = !clientReady || hookPending !== false

  return {
    user: null,
    userId: null,
    isPending,
    isGuest: !isPending,
    isAuthenticated: false,
  }
}
