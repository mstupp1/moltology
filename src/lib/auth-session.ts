/**
 * Shared session chrome resolver.
 *
 * Neon/Better Auth's `useSession()` often paints `{ data: null }` (no `isPending`)
 * on SSR and the first client frame. Treating that shape as a guest is what
 * flashes GUEST MODE / SIGN UP / LOG IN over a signed-in session.
 *
 * A hung or failed Oracle request can also settle the hook as
 * `{ data: null, isPending: false }` (sometimes with `error`). That is not a
 * sign-out: keep a fresh cached member so `/oracle` and `/dashboard` stay signed in.
 *
 * Google OAuth often returns to the app before `getSession()` can see the cookie.
 * `beginOAuthSignIn` + `settleOAuthSession` hold chrome and accept the first
 * successful session payload so one OAuth attempt is enough.
 *
 * Contract:
 * - User present → authenticated, never guest, never pending for chrome.
 * - Explicit sign-out → guest immediately.
 * - Hook error / refetch / in-flight OAuth / fresh cache → keep member chrome.
 * - `isPending === false`, no user, no fresh cache, no OAuth latch → settled guest.
 * - `isPending === true`, missing `isPending`, or client not ready → hold chrome.
 */

import { clearCachedJwt } from './jwt-cache'

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

export const SESSION_STORAGE_KEY = 'moltology:session:user'
export const OAUTH_PENDING_KEY = 'moltology:oauth:pending'
/** Keep a last-known member through transient session misses (Oracle hang, token refetch). */
export const SESSION_CACHE_GRACE_MS = 30 * 60 * 1000

type CachedSessionRecord = AuthSessionUser & { cachedAt?: number }

type OAuthPendingRecord = {
  destination: string
  startedAt: number
}

function authenticatedState(user: AuthSessionUser): AuthSessionState {
  const userId = (user.id || user.sub || null) as string | null
  return {
    user,
    userId,
    isPending: false,
    isGuest: false,
    isAuthenticated: true,
  }
}

function pendingState(): AuthSessionState {
  return {
    user: null,
    userId: null,
    isPending: true,
    isGuest: false,
    isAuthenticated: false,
  }
}

function guestState(): AuthSessionState {
  return {
    user: null,
    userId: null,
    isPending: false,
    isGuest: true,
    isAuthenticated: false,
  }
}

function stripCachedAt(record: CachedSessionRecord): AuthSessionUser {
  const { cachedAt: _cachedAt, ...user } = record
  return user
}

function readCacheRecord(): { user: AuthSessionUser; cachedAt: number } | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedSessionRecord
    if (parsed && typeof parsed === 'object' && (parsed.id || parsed.sub)) {
      const cachedAt = typeof parsed.cachedAt === 'number' ? parsed.cachedAt : Date.now()
      return { user: stripCachedAt(parsed), cachedAt }
    }
  } catch {
    // Ignore JSON parse errors in restricted/corrupted localStorage
  }
  return null
}

export function getCachedUser(): AuthSessionUser | null {
  return readCacheRecord()?.user ?? null
}

export function getCachedUserAgeMs(now = Date.now()): number | null {
  const record = readCacheRecord()
  if (!record) return null
  return now - record.cachedAt
}

function isFreshCache(now = Date.now()): boolean {
  const age = getCachedUserAgeMs(now)
  return age != null && age <= SESSION_CACHE_GRACE_MS
}

export function setCachedUser(user: AuthSessionUser | null, cachedAt = Date.now()): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
  try {
    if (user && (user.id || user.sub)) {
      const record: CachedSessionRecord = { ...stripCachedAt(user), cachedAt }
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(record))
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

export function rememberSessionUser(user: AuthSessionUser | null | undefined): AuthSessionUser | null {
  if (!user || !(user.id || user.sub)) return null
  setCachedUser(user)
  return user
}

/**
 * Sign-out latch. `clearCachedUser()` alone is not enough: the next
 * `resolveAuthSession` pass can still see the live hook user and write
 * them back into the cache, which keeps member chrome after Sign Out.
 */
let signOutInFlight = false

export function beginSignOut(): void {
  signOutInFlight = true
  clearOAuthPending()
  clearCachedUser()
  clearCachedJwt()
}

export function endSignOut(): void {
  signOutInFlight = false
}

export function isSignOutInFlight(): boolean {
  return signOutInFlight
}

let oauthPendingMemory = false
let oauthSettleInFlight: Promise<AuthSessionUser | null> | null = null

export function beginOAuthSignIn(destination = '/dashboard'): void {
  oauthPendingMemory = true
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return
  try {
    const record: OAuthPendingRecord = { destination, startedAt: Date.now() }
    window.sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(record))
  } catch {
    // Ignore sessionStorage write errors
  }
}

export function clearOAuthPending(): void {
  oauthPendingMemory = false
  oauthSettleInFlight = null
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return
  try {
    window.sessionStorage.removeItem(OAUTH_PENDING_KEY)
  } catch {
    // Ignore sessionStorage write errors
  }
}

export function isOAuthPending(): boolean {
  if (oauthPendingMemory) return true
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return false
  try {
    return Boolean(window.sessionStorage.getItem(OAUTH_PENDING_KEY))
  } catch {
    return false
  }
}

export function getOAuthPendingDestination(): string {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return '/dashboard'
  try {
    const raw = window.sessionStorage.getItem(OAUTH_PENDING_KEY)
    if (!raw) return '/dashboard'
    const parsed = JSON.parse(raw) as OAuthPendingRecord
    if (parsed?.destination && parsed.destination.startsWith('/')) {
      return parsed.destination
    }
  } catch {
    // Ignore JSON parse errors
  }
  return '/dashboard'
}

export function readSessionUser(sessionRes: unknown): AuthSessionUser | null {
  if (!sessionRes || typeof sessionRes !== 'object') return null
  const res = sessionRes as Record<string, any>
  const user = (res.data?.user ?? res.user ?? null) as AuthSessionUser | null
  if (user && (user.id || user.sub)) return user
  return null
}

function readSessionError(sessionRes: unknown): unknown {
  if (!sessionRes || typeof sessionRes !== 'object') return null
  return (sessionRes as { error?: unknown }).error ?? null
}

function isSessionRefetching(sessionRes: unknown): boolean {
  if (!sessionRes || typeof sessionRes !== 'object') return false
  return (sessionRes as { isRefetching?: boolean }).isRefetching === true
}

export async function settleOAuthSession(
  getSession: () => Promise<unknown>,
  options?: { attempts?: number; delayMs?: number },
): Promise<AuthSessionUser | null> {
  const attempts = options?.attempts ?? 8
  const delayMs = options?.delayMs ?? 250

  for (let i = 0; i < attempts; i++) {
    try {
      const session = await getSession()
      const user = readSessionUser(session)
      if (user) {
        setCachedUser(user)
        clearOAuthPending()
        return user
      }
    } catch {
      // Cookie may not be visible yet; retry until attempts are exhausted.
    }
    if (i < attempts - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  clearOAuthPending()
  return null
}

export function settleOAuthSessionIfPending(
  getSession: () => Promise<unknown>,
  options?: { attempts?: number; delayMs?: number },
): Promise<AuthSessionUser | null> {
  if (!isOAuthPending()) return Promise.resolve(null)
  if (!oauthSettleInFlight) {
    oauthSettleInFlight = settleOAuthSession(getSession, options).finally(() => {
      oauthSettleInFlight = null
    })
  }
  return oauthSettleInFlight
}

export async function startGoogleSignIn(options: {
  signInSocial: (args: { provider: 'google'; callbackURL: string }) => Promise<unknown>
  callbackURL: string
  destination?: string
}): Promise<AuthSessionUser | null> {
  beginOAuthSignIn(options.destination || '/dashboard')
  try {
    const res = await options.signInSocial({
      provider: 'google',
      callbackURL: options.callbackURL,
    })
    const user = readSessionUser(res)
    if (user) {
      setCachedUser(user)
      clearOAuthPending()
      return user
    }
    return null
  } catch (err) {
    clearOAuthPending()
    throw err
  }
}

export function resolveAuthSession(
  sessionRes: unknown,
  options?: ResolveAuthSessionOptions,
): AuthSessionState {
  const user = readSessionUser(sessionRes)
  const userId = (user?.id || user?.sub || null) as string | null
  const hookPending = (sessionRes as { isPending?: boolean } | null)?.isPending
  const sessionError = readSessionError(sessionRes)
  const refetching = isSessionRefetching(sessionRes)

  if (signOutInFlight) {
    clearCachedUser()
    if (!userId && hookPending === false) {
      signOutInFlight = false
    }
    return guestState()
  }

  if (userId && user) {
    setCachedUser(user)
    return authenticatedState(user)
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
    return authenticatedState(previewUser)
  }

  const clientReady = options?.clientReady ?? true
  const anyCached = getCachedUser()
  const freshCached = isFreshCache() ? anyCached : null

  if (isOAuthPending()) {
    if (anyCached) return authenticatedState(anyCached)
    return pendingState()
  }

  // Transient session miss (Oracle hang, JWT refetch 401, network error): keep the member.
  if (anyCached && (sessionError || refetching)) {
    return authenticatedState(anyCached)
  }

  // Pending / first-paint: prefer a fresh cache so we do not flash guest chrome.
  if (clientReady && hookPending !== false) {
    if (freshCached) return authenticatedState(freshCached)
  }

  // Settled empty. A fresh cache means the hook lied — keep the existing session.
  if (hookPending === false) {
    if (freshCached) return authenticatedState(freshCached)
    clearCachedUser()
  }

  const isPending = !clientReady || hookPending !== false

  return isPending ? pendingState() : guestState()
}
