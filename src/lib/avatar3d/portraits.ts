/**
 * Still portraits for small avatars. A page can show dozens of faces, and a browser allows only
 * a handful of live 3D canvases, so one hidden stage draws each face once and hands back an
 * image. Results are kept, so the same character is never drawn twice.
 */
import type { Avatar3DLook } from './look'
import { createStage, type Stage } from './stage'

/** This browser would not start 3D at all, as opposed to one character failing to draw. */
export class Avatar3DUnavailable extends Error {
  constructor(cause: unknown) {
    super('3D is not available in this browser', { cause })
    this.name = 'Avatar3DUnavailable'
  }
}

const KEEP = 80
const cache = new Map<string, string>()
let stage: Stage | null = null
let canvas: HTMLCanvasElement | null = null

export function portraitKey(look: Avatar3DLook, px: number): string {
  // A portrait holds its pose, so the same face in another stance is the same picture.
  return `${px}|${JSON.stringify({ ...look, pose: 'rest', palette: look.palette.id })}`
}

export function cachedPortrait(look: Avatar3DLook, px: number): string | undefined {
  return cache.get(portraitKey(look, px))
}

/** Draw a head-and-shoulders still. Synchronous and fairly heavy: call it from a queue, not a render. */
export function renderPortrait(look: Avatar3DLook, px: number): string {
  const key = portraitKey(look, px)
  const hit = cache.get(key)
  if (hit) return hit
  if (!canvas || !stage) {
    const next = document.createElement('canvas')
    try {
      stage = createStage(next, {
        reducedMotion: true,
        preserveDrawingBuffer: true,
        pixelRatio: 1,
        framing: 'portrait',
        manual: true,
        // Start again with a fresh canvas the next time a face is asked for.
        onContextLost: () => {
          stage = null
          canvas = null
        },
      })
    } catch (cause) {
      throw new Avatar3DUnavailable(cause)
    }
    canvas = next
  }
  if (canvas.width !== px || canvas.height !== px) {
    canvas.width = canvas.height = px
    stage.resize()
  }
  stage.setLook({ ...look, pose: 'rest' })
  stage.renderStill(0)
  const url = stage.snapshot()
  cache.set(key, url)
  if (cache.size > KEEP) cache.delete(cache.keys().next().value as string)
  return url
}

export function disposePortraits(): void {
  stage?.dispose()
  stage = null
  canvas = null
  cache.clear()
}
