/**
 * Google One Tap rules: where the prompt may show, when it already showed this
 * visit, and whether a returning member may be signed in without a click.
 * Pure helpers plus small storage wrappers so GoogleOneTap stays thin.
 */

/** Hosts registered as Authorized JavaScript origins on the Google OAuth client. */
export const ONE_TAP_HOSTS = ['moltology.org', 'www.moltology.org', 'localhost'] as const

/** Wait after the page settles so the prompt never competes with the hero. */
export const ONE_TAP_DELAY_MS = 3500

/** Set on sign-out: the next prompt asks instead of signing back in silently. */
const SIGNED_OUT_KEY = 'moltology:one-tap:signed-out'
/** Set once the automatic prompt ran in this tab, so page changes don't re-open it. */
const SHOWN_KEY = 'moltology:one-tap:shown'

const PUBLIC_PREFIXES = ['/news', '/blog', '/forum', '/what-is-moltology', '/org', '/moltmaxxing', '/store']
const PUBLIC_EXACT = new Set(['/', '/landing'])
/** Store steps where a popup would get in the way of paying or reading an order. */
const BLOCKED_SEGMENTS = new Set(['checkout', 'success', 'status', 'cancel'])

function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] || '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

/**
 * Signed-out public pages where One Tap shows on its own. The quiz is not
 * listed: it asks only once the result is on screen (see requestOneTap).
 */
export function isOneTapAutoPath(pathname: string): boolean {
  const path = normalizePath(pathname)
  if (PUBLIC_EXACT.has(path)) return true
  if (!PUBLIC_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) return false
  const segments = path.split('/')
  return !segments.some((segment) => BLOCKED_SEGMENTS.has(segment))
}

/** The quiz page may ask after a result, never mid-quiz. */
export function isOneTapQuizPath(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), '/moltmax')
}

export function isOneTapHost(hostname: string): boolean {
  return (ONE_TAP_HOSTS as readonly string[]).includes(hostname.toLowerCase())
}

function readStorage(storage: 'local' | 'session', key: string): string | null {
  try {
    const store = storage === 'local' ? window.localStorage : window.sessionStorage
    return store.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(storage: 'local' | 'session', key: string, value: string | null): void {
  try {
    const store = storage === 'local' ? window.localStorage : window.sessionStorage
    if (value === null) store.removeItem(key)
    else store.setItem(key, value)
  } catch {
    // Private mode or blocked storage: One Tap still works, just without memory.
  }
}

/** Remember an explicit sign-out so auto sign-in does not undo it. */
export function markOneTapSignedOut(): void {
  if (typeof window === 'undefined') return
  writeStorage('local', SIGNED_OUT_KEY, '1')
  try {
    window.google?.accounts?.id?.disableAutoSelect?.()
  } catch {
    // Script not loaded yet; the flag above still turns auto-select off.
  }
}

export function clearOneTapSignedOut(): void {
  if (typeof window === 'undefined') return
  writeStorage('local', SIGNED_OUT_KEY, null)
}

/** Returning members are signed in automatically unless they signed out here. */
export function oneTapAutoSelectAllowed(): boolean {
  if (typeof window === 'undefined') return false
  return readStorage('local', SIGNED_OUT_KEY) !== '1'
}

export function hasShownOneTapThisVisit(): boolean {
  if (typeof window === 'undefined') return true
  return readStorage('session', SHOWN_KEY) === '1'
}

export function markOneTapShownThisVisit(): void {
  if (typeof window === 'undefined') return
  writeStorage('session', SHOWN_KEY, '1')
}

/** A fresh account (made by this One Tap) gets a welcome instead of "signed in". */
export function isFreshAccount(createdAt: unknown, now = Date.now()): boolean {
  if (createdAt == null) return false
  const created = new Date(createdAt as string | number | Date).getTime()
  if (!Number.isFinite(created)) return false
  return now - created < 2 * 60 * 1000
}

/**
 * Where a One Tap sign-in lands. The quiz keeps its result on screen (it gets
 * saved to the account). Otherwise new accounts and homepage sign-ins go to
 * the dashboard (onboarding starts there); anywhere else the member stays put.
 */
export function oneTapLanding({ path, fresh }: { path: string; fresh: boolean }): '/dashboard' | null {
  const normalized = normalizePath(path)
  if (isOneTapQuizPath(normalized)) return null
  if (fresh || PUBLIC_EXACT.has(normalized)) return '/dashboard'
  return null
}

type OneTapRequest = { context: 'signin' | 'signup' }
type OneTapListener = (request: OneTapRequest) => void
const listeners = new Set<OneTapListener>()

/** Pages ask for a prompt at a good moment (the quiz result). GoogleOneTap answers. */
export function requestOneTap(request: OneTapRequest): void {
  for (const listener of listeners) listener(request)
}

export function onOneTapRequest(listener: OneTapListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          cancel?: () => void
          disableAutoSelect?: () => void
        }
      }
    }
  }
}
