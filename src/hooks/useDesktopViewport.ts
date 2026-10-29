import { useEffect, useState } from 'react'

// Matches the HUD's Tailwind md layout breakpoint.
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

export function useDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  return isDesktop
}
