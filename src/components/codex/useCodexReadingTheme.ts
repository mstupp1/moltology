import { useCallback, useSyncExternalStore } from 'react'

/** Light paper or dark page for the scripture sheet. */
export type CodexReadingTheme = 'light' | 'dark'

/** The reader's own choice on this browser. Unset means follow the device setting. */
export const CODEX_READING_THEME_KEY = 'moltology:codex:reading-theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'
const listeners = new Set<() => void>()
// Used when storage is blocked, so the toggle still works for this visit.
let memoryChoice: CodexReadingTheme | null = null

function readSaved(): CodexReadingTheme | null {
  try {
    const value = window.localStorage.getItem(CODEX_READING_THEME_KEY)
    return value === 'light' || value === 'dark' ? value : memoryChoice
  } catch {
    return memoryChoice
  }
}

function deviceTheme(): CodexReadingTheme {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null
  const onStorage = (event: StorageEvent) => {
    if (event.key === CODEX_READING_THEME_KEY) onChange()
  }
  media?.addEventListener?.('change', onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(onChange)
    media?.removeEventListener?.('change', onChange)
    window.removeEventListener('storage', onStorage)
  }
}

// Snapshot is "saved:effective" so a change to either re-renders.
function getSnapshot(): string {
  const saved = readSaved()
  return `${saved ?? 'auto'}:${saved ?? deviceTheme()}`
}

function getServerSnapshot(): string {
  return 'auto:light'
}

export interface CodexReadingThemeState {
  /** Value for the sheet's data-reading-theme. "auto" lets CSS follow the device without a flash. */
  attribute: 'auto' | CodexReadingTheme
  /** What the reader sees now. */
  theme: CodexReadingTheme
  toggle: () => void
}

export function useCodexReadingTheme(): CodexReadingThemeState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [attribute, theme] = snapshot.split(':') as [CodexReadingThemeState['attribute'], CodexReadingTheme]

  const toggle = useCallback(() => {
    const next: CodexReadingTheme = getSnapshot().endsWith(':dark') ? 'light' : 'dark'
    memoryChoice = next
    try {
      window.localStorage.setItem(CODEX_READING_THEME_KEY, next)
    } catch {
      // Blocked storage: the choice lasts for this visit only.
    }
    listeners.forEach((listener) => listener())
  }, [])

  return { attribute, theme, toggle }
}
