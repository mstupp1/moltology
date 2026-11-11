import { useEffect, useMemo, useState, type CSSProperties, type RefObject } from 'react'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { readyStill3D, requestStill3D, type StillShot } from '@/lib/avatar3d-portrait-queue'
import { sceneStyle3D } from '@/lib/avatar3d-scene'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

export interface Still3D {
  /** The still, ready to use as an image `src`, or null until it is drawn. */
  url: string | null
  /** `loading` until the still is drawn; `unavailable` when this browser cannot draw 3D. */
  status: 'loading' | 'ready' | 'unavailable'
  /** The character's chosen scene colours, to sit behind the still. */
  scene: CSSProperties | undefined
}

/**
 * A 3D still of this character: its face by default, the whole figure, or a gear close-up.
 *
 * `frameRef` is the element the picture sits in. A still is only drawn once it is on screen, or
 * about to be, so a long list never draws pictures nobody scrolls to.
 */
export function useStill3D(
  config: LobsterAvatarConfig | null | undefined,
  px: number,
  frameRef: RefObject<Element | null>,
  shot: StillShot = 'portrait',
): Still3D {
  const support = useAvatar3D()
  // Callers often hand over a freshly parsed config each render, so compare by content.
  const key = config?.seed ? JSON.stringify(config) : null
  const [still, setStill] = useState<{ key: string; shot: StillShot; px: number; url: string } | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!key || !frame || support !== true) return
    const parsed = JSON.parse(key) as LobsterAvatarConfig
    if (readyStill3D(parsed, px, shot)) return
    let cancelled = false
    const stop = new AbortController()
    const draw = () => {
      void requestStill3D(parsed, px, shot, stop.signal).then((url) => {
        if (!cancelled && url) setStill({ key, shot, px, url })
      })
    }
    if (typeof IntersectionObserver === 'undefined') {
      draw()
      return () => {
        cancelled = true
        stop.abort()
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
      stop.abort()
      watcher.disconnect()
    }
  }, [key, px, shot, frameRef, support])

  const drawn = key && still?.key === key && still.shot === shot && still.px === px ? still.url : null
  // A still drawn earlier this visit shows on the first render, with no loader.
  const url = drawn ?? (key && support ? readyStill3D(JSON.parse(key) as LobsterAvatarConfig, px, shot) : null)
  return useMemo(() => {
    const scene = key ? sceneStyle3D(JSON.parse(key) as LobsterAvatarConfig) : undefined
    if (support === false) return { url: null, status: 'unavailable', scene }
    return { url, status: url ? 'ready' : 'loading', scene }
  }, [url, key, support])
}

/** The face still for a small avatar. */
export function usePortrait3D(config: LobsterAvatarConfig | null | undefined, px: number, frameRef: RefObject<Element | null>): Still3D {
  return useStill3D(config, px, frameRef, 'portrait')
}
