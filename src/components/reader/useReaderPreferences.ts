import { useCallback, useEffect, useState } from 'react'
import { PAPER_PALETTES, PaperReaderTheme, READER_FONT_SIZE } from '@/lib/paper-palette'

function clampFontSize(size: number): number {
  return Math.min(READER_FONT_SIZE.max, Math.max(READER_FONT_SIZE.min, Math.round(size)))
}

export interface ReaderPreferences {
  theme: PaperReaderTheme
  setTheme: (theme: PaperReaderTheme) => void
  fontSize: number
  setFontSize: (size: number) => void
}

/**
 * Shared sheet theme + type scale state for document readers. The codex reader
 * is deliberately locked to its parchment theme; this hook powers readers that
 * expose the controls, such as the journal. Preferences persist to localStorage
 * and hydrate after mount so SSR always renders the defaults.
 */
export function useReaderPreferences(storageKey = 'moltology_reader_prefs'): ReaderPreferences {
  const [theme, setThemeState] = useState<PaperReaderTheme>('paper')
  const [fontSize, setFontSizeState] = useState<number>(READER_FONT_SIZE.default)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw) as { theme?: string; fontSize?: number }
        if (saved.theme && saved.theme in PAPER_PALETTES) {
          setThemeState(saved.theme as PaperReaderTheme)
        }
        if (typeof saved.fontSize === 'number') {
          setFontSizeState(clampFontSize(saved.fontSize))
        }
      }
    } catch {
      // Corrupt or unavailable storage: keep the defaults.
    }
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ theme, fontSize }))
    } catch {
      // Storage may be blocked; preferences simply do not persist.
    }
  }, [theme, fontSize, hydrated, storageKey])

  const setTheme = useCallback((next: PaperReaderTheme) => setThemeState(next), [])
  const setFontSize = useCallback((next: number) => setFontSizeState(clampFontSize(next)), [])

  return { theme, setTheme, fontSize, setFontSize }
}
