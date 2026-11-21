/**
 * Image textures for the shell: a tiling micro-surface (pores, granules, growth ridges) and the
 * hand-drawn marking masks. They are greyscale data, tinted in the shader with the member's own
 * colours, and sampled from each point's rest position (triplanar), so they need no UVs.
 *
 * Every texture starts as a neutral 1x1 placeholder and is swapped in when it arrives, so a live
 * stage never waits for it. Stills call `preloadTextures` first so the picture is final.
 * Files live in the asset bucket under textures/avatar3d/v<N>/ (made and published by
 * `npm run avatar:textures`).
 */
import { DataTexture, LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping, TextureLoader, type Texture } from 'three'
import type { ShellMarking } from '../avatar/traits'
import { getAssetUrl } from '../assets'

/** Markings drawn from an image mask instead of in the shader. */
export const TEXTURE_MARKINGS = ['lace', 'tide', 'camo'] as const satisfies readonly ShellMarking[]
export type TextureMarking = (typeof TEXTURE_MARKINGS)[number]

export const isTextureMarking = (m: ShellMarking | undefined): m is TextureMarking => (TEXTURE_MARKINGS as readonly string[]).includes(m ?? '')

/** Bump when a texture file changes, and publish the new set under the new folder. */
export const TEXTURE_VERSION = 1
export const TEXTURE_PREFIX = `textures/avatar3d/v${TEXTURE_VERSION}`

declare global {
  // Pages with no site to fetch from (the content renderer) hand the files in as data URLs.
  var __avatar3dTextures: Record<string, string> | undefined
}

function placeholder(r: number, g: number, b: number): DataTexture {
  const t = new DataTexture(new Uint8Array([r, g, b, 255]), 1, 1)
  t.needsUpdate = true
  return t
}

/** Flat surface: mid height, no slope. */
export const FLAT_DETAIL = placeholder(128, 128, 128)
/** No marking. */
export const NO_MARK = placeholder(0, 0, 0)

const cache = new Map<string, Texture>()
const loaded = new Set<string>()
const waiters = new Map<string, ((t: Texture) => void)[]>()
const pending = new Set<Promise<void>>()

function small(): boolean {
  if (typeof matchMedia !== 'function') return false
  return matchMedia('(max-width: 767px)').matches || matchMedia('(pointer: coarse)').matches
}

function source(name: string): string {
  const handed = globalThis.__avatar3dTextures?.[name]
  if (handed) return handed
  return getAssetUrl(`${TEXTURE_PREFIX}/${name}${small() ? '-sm' : ''}.webp`)
}

/**
 * The texture, or the placeholder until it has arrived. `onLoad` runs once the real one is in, for
 * whoever has to swap it in.
 */
function texture(name: string, fallback: Texture, onLoad?: (t: Texture) => void): Texture {
  const hit = cache.get(name)
  if (hit) {
    if (!loaded.has(name) && onLoad) waiters.get(name)?.push(onLoad)
    return hit
  }
  if (typeof document === 'undefined') return fallback
  cache.set(name, fallback)
  waiters.set(name, onLoad ? [onLoad] : [])
  const load = new TextureLoader()
    .loadAsync(source(name))
    .then((t) => {
      t.colorSpace = NoColorSpace
      t.wrapS = t.wrapT = RepeatWrapping
      t.minFilter = LinearMipmapLinearFilter
      t.anisotropy = 4
      cache.set(name, t)
      loaded.add(name)
      for (const swap of waiters.get(name) ?? []) swap(t)
      waiters.delete(name)
    })
    .catch(() => {
      // Missing or blocked: the shell keeps its coded surface.
    })
    .finally(() => pending.delete(load))
  pending.add(load)
  return fallback
}

/** Shared by every shell material, so the detail tile is swapped in once for all of them. */
export const detailUniform = { value: FLAT_DETAIL as Texture }
export const detailOnUniform = { value: 0 }

export function shellDetail(): void {
  if (detailOnUniform.value) return
  const t = texture('shell-detail', FLAT_DETAIL, (real) => {
    detailUniform.value = real
    detailOnUniform.value = 1
  })
  if (t !== FLAT_DETAIL) {
    detailUniform.value = t
    detailOnUniform.value = 1
  }
}

/** The mask for a marking; `onLoad` swaps it in when it arrives later. */
export function markingMask(marking: TextureMarking, onLoad: (t: Texture) => void): Texture {
  return texture(`marking-${marking}`, NO_MARK, onLoad)
}

/** Start loading what this look needs and wait until it is in (or has failed). */
export async function preloadTextures(look: { marking?: ShellMarking }): Promise<void> {
  shellDetail()
  if (isTextureMarking(look.marking)) markingMask(look.marking, () => undefined)
  await Promise.all([...pending])
}
