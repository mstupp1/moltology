import { useEffect, type RefObject } from 'react'

/** Scrolling this far down a page takes the scene to its deepest point. */
export const SCENE_DIVE_DISTANCE = 1800

export interface SceneDiveFrame {
  /** 0 at the top of the page, 1 at full depth. */
  progress: number
  transform: string
  depthOpacity: number
}

/**
 * The scene sinks as the page scrolls: it slides up so the surface leaves the top of
 * the screen, zooms in slightly, and darkens. The zoom always covers the slide, so no
 * edge of the painting ever shows.
 */
export function sceneDiveFrame(scrollTop: number): SceneDiveFrame {
  const progress = Math.min(1, Math.max(0, scrollTop / SCENE_DIVE_DISTANCE))
  const shift = progress * 9
  const scale = 1 + progress * 0.22
  return {
    progress,
    transform: progress === 0 ? '' : `translate3d(0, -${shift.toFixed(3)}%, 0) scale(${scale.toFixed(4)})`,
    depthOpacity: Number((progress * 0.75).toFixed(3)),
  }
}

/**
 * Ties the scene's depth to the scroll position of the page. Writes styles directly
 * (no React state), at most once per animation frame, and only while scrolling.
 */
export function useSceneDive(
  scrollRef: RefObject<HTMLElement | null>,
  sceneRef: RefObject<HTMLElement | null>,
  depthRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  resetKey?: string
) {
  useEffect(() => {
    const scroller = scrollRef.current
    const scene = sceneRef.current
    const depth = depthRef.current
    if (!scroller || !scene || !depth) return

    const apply = () => {
      const frame = sceneDiveFrame(enabled ? scroller.scrollTop : 0)
      scene.style.transform = frame.transform
      depth.style.opacity = String(frame.depthOpacity)
    }
    apply()
    if (!enabled) return

    let queued = 0
    const onScroll = () => {
      if (queued) return
      queued = requestAnimationFrame(() => {
        queued = 0
        apply()
      })
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      if (queued) cancelAnimationFrame(queued)
    }
  }, [scrollRef, sceneRef, depthRef, enabled, resetKey])
}
