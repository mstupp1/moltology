// After a deploy, a tab still running the previous build can ask for a code-split chunk whose
// hashed file no longer exists. Reloading once fetches the new HTML and its new chunk names.

const RELOAD_KEY = 'moltology:stale-chunk-reload'
/** A second failure inside this window means a reload did not help, so stop and show the card. */
const RELOAD_WINDOW_MS = 30_000

let reloadStarted = false

/** True once this page has started a stale-chunk reload. */
export function isStaleChunkReloadPending() {
  return reloadStarted
}

const STALE_CHUNK_PATTERNS = [
  /failed to fetch dynamically imported module/i, // Chrome, Edge
  /error loading dynamically imported module/i, // Firefox
  /importing a module script failed/i, // Safari
  /unable to preload css/i, // Vite preload helper
  /is not a valid javascript mime type/i, // HTML served in place of a missing chunk
]

export function isStaleChunkError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  if (!message) return false
  return STALE_CHUNK_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Reloads the page unless it already reloaded for a stale chunk in the last 30 seconds.
 * Returns true when a reload was started. Without sessionStorage it never reloads, so a
 * blocked store cannot cause a reload loop.
 */
export function reloadForStaleChunk(now = Date.now()): boolean {
  if (typeof window === 'undefined') return false
  if (reloadStarted) return true
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0)
    if (last && now - last < RELOAD_WINDOW_MS) return false
    window.sessionStorage.setItem(RELOAD_KEY, String(now))
  } catch {
    return false
  }
  reloadStarted = true
  window.location.reload()
  return true
}
