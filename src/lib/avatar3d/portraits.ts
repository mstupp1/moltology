/**
 * Stills for every small picture of a character: avatars, creator option cards and gear icons.
 * A page can show dozens of them, and a browser allows only a handful of live 3D canvases, so
 * two hidden stages (one framed on the face, one on the whole figure) draw each picture once and
 * hand back an image. Results are kept, so the same picture is never drawn twice.
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

/**
 * What a still shows: the head and shoulders, the whole figure, or a close-up on one gear slot
 * (`gear:head`, `gear:claws-1`, ...), turned the way the creator camera turns to show it.
 */
export type StillShot = 'portrait' | 'full' | `gear:${string}`

const KEEP = 160
const cache = new Map<string, string>()
const stages = new Map<'portrait' | 'full', { stage: Stage; canvas: HTMLCanvasElement }>()

export function stillKey(look: Avatar3DLook, px: number, shot: StillShot = 'portrait'): string {
  // A portrait holds its pose, so the same face in another stance is the same picture.
  const held = shot === 'portrait' ? { ...look, pose: 'rest' } : look
  return `${shot}|${px}|${JSON.stringify({ ...held, palette: look.palette.id })}`
}

export function cachedStill(look: Avatar3DLook, px: number, shot: StillShot = 'portrait'): string | undefined {
  return cache.get(stillKey(look, px, shot))
}

function stageFor(framing: 'portrait' | 'full', px: number): Stage {
  let entry = stages.get(framing)
  if (!entry) {
    const canvas = document.createElement('canvas')
    let stage: Stage
    try {
      stage = createStage(canvas, {
        reducedMotion: true,
        preserveDrawingBuffer: true,
        pixelRatio: 1,
        framing,
        manual: true,
        // Start again with a fresh canvas the next time a picture is asked for.
        onContextLost: () => {
          stages.delete(framing)
        },
      })
    } catch (cause) {
      throw new Avatar3DUnavailable(cause)
    }
    entry = { stage, canvas }
    stages.set(framing, entry)
  }
  if (entry.canvas.width !== px || entry.canvas.height !== px) {
    entry.canvas.width = entry.canvas.height = px
    entry.stage.resize()
  }
  return entry.stage
}

/** Draw a still. Synchronous and fairly heavy: call it from a queue, not a render. */
export function renderStill(look: Avatar3DLook, px: number, shot: StillShot = 'portrait'): string {
  const key = stillKey(look, px, shot)
  const hit = cache.get(key)
  if (hit) return hit
  const stage = stageFor(shot === 'portrait' ? 'portrait' : 'full', px)
  stage.setLook(shot === 'portrait' ? { ...look, pose: 'rest' } : look)
  const slot = shot.startsWith('gear:') ? shot.slice(5) : null
  stage.focus(slot)
  const close = slot ? stage.character()?.focusOf(slot) : null
  stage.setYaw(close ? close.yaw : 0)
  stage.renderStill(0)
  const url = stage.snapshot()
  cache.set(key, url)
  if (cache.size > KEEP) cache.delete(cache.keys().next().value as string)
  return url
}

/** A head-and-shoulders still. */
export function renderPortrait(look: Avatar3DLook, px: number): string {
  return renderStill(look, px, 'portrait')
}

export function disposePortraits(): void {
  for (const { stage } of stages.values()) stage.dispose()
  stages.clear()
  cache.clear()
}
