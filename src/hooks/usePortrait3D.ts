import { useEffect, useMemo, useState, type CSSProperties, type RefObject } from 'react'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { requestPortrait3D } from '@/lib/avatar3d-portrait-queue'
import { LOBSTER_BACKGROUND_THEME_MAP, resolveAvatarTraits, type LobsterAvatarConfig } from '@/lib/lobster-avatar'

export interface Portrait3D {
  /** The 3D still, ready to use as an image `src`. */
  url: string
  /** The character's chosen scene colours, to sit behind the still as they do behind the 2D one. */
  scene: CSSProperties | undefined
}

/**
 * A 3D still of this character's face for viewers who see characters in 3D, or null. Null means
 * "show the 2D portrait": the viewer is not in 3D, the still is not drawn yet, or 3D cannot run.
 *
 * `frameRef` is the element the face sits in. A face is only drawn once it is on screen, or
 * about to be, so a long list never draws faces nobody scrolls to.
 */
export function usePortrait3D(
  config: LobsterAvatarConfig | null | undefined,
  px: number,
  frameRef: RefObject<Element | null>,
): Portrait3D | null {
  const in3D = useAvatar3D() && Boolean(config?.seed)
  // Callers often hand over a freshly parsed config each render, so compare by content.
  const key = in3D && config ? JSON.stringify(config) : null
  const [still, setStill] = useState<{ key: string; url: string } | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!key || !frame) return
    let cancelled = false
    const draw = () => {
      void requestPortrait3D(JSON.parse(key) as LobsterAvatarConfig, px).then((url) => {
        if (!cancelled && url) setStill({ key, url })
      })
    }
    if (typeof IntersectionObserver === 'undefined') {
      draw()
      return () => {
        cancelled = true
      }
    }
    const watcher = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        watcher.disconnect()
        draw()
      },
      { rootMargin: '200px' },
    )
    watcher.observe(frame)
    return () => {
      cancelled = true
      watcher.disconnect()
    }
  }, [key, px, frameRef])

  const url = key && still?.key === key ? still.url : null
  return useMemo(() => {
    if (!url || !key) return null
    const theme = LOBSTER_BACKGROUND_THEME_MAP[resolveAvatarTraits(JSON.parse(key) as LobsterAvatarConfig).backgroundTheme]
    const scene = theme
      ? { background: `radial-gradient(circle at 50% 42%, ${theme.glowColor} 0%, transparent 62%), linear-gradient(180deg, ${theme.topColor}, ${theme.bottomColor})` }
      : undefined
    return { url, scene }
  }, [url, key])
}
