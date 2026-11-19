/**
 * Stills for every small picture of a character: avatars, creator option cards and gear icons.
 * A page can show dozens of them, and a browser allows only a handful of live 3D canvases, so
 * one hidden stage draws each picture once and hands back an image. Results are kept, so the same
 * picture is never drawn twice.
 */
import type { Avatar3DLook } from './look'
import { withLoftDetail } from './loft'
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

/**
 * Gear icons turn the mannequin so the piece is in full view: claws are seen from the outside with
 * room for a held weapon, and a belt is seen closer than the body camera goes.
 */
const ICON_VIEW: Record<string, { yaw: number; zoom: number }> = {
  'claws-1': { yaw: 1.3, zoom: 1.15 },
  'claws-2': { yaw: -1.3, zoom: 1.15 },
  belt: { yaw: 0.35, zoom: 0.75 },
}

const KEEP = 160
const SUPERSAMPLE = 2

/** The picture on a canvas, smoothly scaled down to `px` square, as a WebP (PNG where WebP is unavailable). */
function downscale(source: HTMLCanvasElement, px: number): string {
  const out = document.createElement('canvas')
  out.width = out.height = px
  const ctx = out.getContext('2d')
  if (!ctx) return source.toDataURL('image/webp', 0.9)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, px, px)
  return out.toDataURL('image/webp', 0.9)
}
const cache = new Map<string, string>()
let studio: { stage: Stage; canvas: HTMLCanvasElement; detail: number } | null = null

/** What a still shows of a look: the idle temperament never does, and a portrait holds its pose. */
function shown(look: Avatar3DLook, shot: StillShot): Avatar3DLook {
  const { temperament: _idle, ...rest } = look
  return shot === 'portrait' ? { ...rest, pose: 'rest' } : rest
}

export function stillKey(look: Avatar3DLook, px: number, shot: StillShot = 'portrait'): string {
  return `${shot}|${px}|${JSON.stringify({ ...shown(look, shot), palette: look.palette.id })}`
}

export function cachedStill(look: Avatar3DLook, px: number, shot: StillShot = 'portrait'): string | undefined {
  return cache.get(stillKey(look, px, shot))
}

function stageFor(framing: 'portrait' | 'full', px: number): NonNullable<typeof studio> {
  if (!studio) {
    const canvas = document.createElement('canvas')
    let stage: Stage
    try {
      stage = createStage(canvas, {
        reducedMotion: true,
        preserveDrawingBuffer: true,
        pixelRatio: 1,
        framing,
        manual: true,
        // Soft cast shadows give small pictures their depth; one draw of them costs very little.
        quality: 'low',
        // A picture this small shows only the broad creases, so a quick bake is plenty.
        bake: { directions: 20, size: 256 },
        // Start again with a fresh canvas the next time a picture is asked for.
        onContextLost: () => {
          studio = null
        },
      })
    } catch (cause) {
      throw new Avatar3DUnavailable(cause)
    }
    studio = { stage, canvas, detail: 0 }
  }
  studio.stage.setFraming(framing)
  if (studio.canvas.width !== px || studio.canvas.height !== px) {
    studio.canvas.width = studio.canvas.height = px
    studio.stage.resize()
  }
  return studio
}

/** Draw a still. Synchronous and fairly heavy: call it from a queue, not a render. */
export function renderStill(look: Avatar3DLook, px: number, shot: StillShot = 'portrait'): string {
  const key = stillKey(look, px, shot)
  const hit = cache.get(key)
  if (hit) return hit
  // Drawn at twice the size and scaled down, which gives cleaner edges than antialiasing alone.
  const drawn = Math.min(px * SUPERSAMPLE, 512)
  const entry = stageFor(shot === 'portrait' ? 'portrait' : 'full', drawn)
  const { stage } = entry
  // A small picture cannot show fine tessellation, so it is built from coarser meshes: much quicker.
  // A look that differs from the last one only in colour is repainted, not rebuilt.
  const detail = px <= 128 ? 0.7 : 0.9
  withLoftDetail(detail, () => stage.setLook(shown(look, shot), entry.detail !== detail))
  entry.detail = detail
  const slot = shot.startsWith('gear:') ? shot.slice(5) : null
  const view = slot ? ICON_VIEW[slot] : undefined
  stage.focus(slot, view?.zoom)
  const close = slot ? stage.character()?.focusOf(slot) : null
  stage.setYaw(close ? (view?.yaw ?? close.yaw) : 0)
  stage.renderStill(0)
  const url = drawn === px ? stage.snapshot() : downscale(entry.canvas, px)
  cache.set(key, url)
  if (cache.size > KEEP) cache.delete(cache.keys().next().value as string)
  return url
}

/** A head-and-shoulders still. */
export function renderPortrait(look: Avatar3DLook, px: number): string {
  return renderStill(look, px, 'portrait')
}

export function disposePortraits(): void {
  studio?.stage.dispose()
  studio = null
  cache.clear()
}
