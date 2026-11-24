/**
 * Image textures for the shell: a tiling micro-surface (pores, granules, growth ridges) and the
 * hand-drawn marking masks. They are greyscale data, tinted in the shader with the member's own
 * colours, and sampled from each point's rest position (triplanar), so they need no UVs.
 *
 * Height tiles (the shell detail, gear surfaces and the engraving) are repacked on arrival with
 * their slope beside the height (see `withSlopes`), so the shader can light the bumps from the
 * surface itself rather than from neighbouring screen pixels, which made the detail crawl as the
 * character moved.
 *
 * Every texture starts as a neutral 1x1 placeholder and is swapped in when it arrives, so a live
 * stage never waits for it. Stills call `preloadTextures` first so the picture is final.
 * Files live in the asset bucket under textures/avatar3d/v<N>/ (made and published by
 * `npm run avatar:textures`).
 */
import { DataTexture, DataUtils, HalfFloatType, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping, RGBAFormat, TextureLoader, type Texture } from 'three'
import type { ShellMarking } from '../avatar/traits'
import { getAssetUrl } from '../assets'

/** Markings drawn from an image mask instead of in the shader. */
export const TEXTURE_MARKINGS = ['lace', 'tide', 'camo', 'scales', 'rosettes', 'flames', 'honeycomb', 'barnacles', 'ripple', 'constellation', 'marble'] as const satisfies readonly ShellMarking[]
export type TextureMarking = (typeof TEXTURE_MARKINGS)[number]

/** Gear surfaces with their own height tile (gear-<surface>.webp). */
export const GEAR_SURFACES = ['metal', 'cloth', 'leather', 'coral', 'bone', 'knit', 'denim', 'velvet', 'fleece', 'nylon'] as const
export type GearSurface = (typeof GEAR_SURFACES)[number]

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

/**
 * 1 for a packed height tile (its G and B channels hold the slope), 0 for anything else, which
 * then reads as flat. The shader multiplies the slope channels by it.
 */
export const slopeOn = (t: Texture): number => (t.userData?.sloped ? 1 : 0)

/** Height tiles: repacked with their slope when they arrive. */
const SLOPED = (name: string) => name === 'shell-detail' || name.startsWith('gear-')

/**
 * Repack a greyscale height tile as R = height, G and B = its slope across and up the tile (height
 * per whole tile). Each mip level gets the slope of its own, blurrier height, so bumps fade out
 * smoothly with distance instead of sparkling. Stored as half floats: the slopes that show at a
 * distance are tiny next to the texel-sharp ones up close, and 8 bits lost them to banding.
 */
export function withSlopes(image: CanvasImageSource & { width: number; height: number }): DataTexture | null {
  if (!image.width || !image.height) return null
  // A whole mip chain needs a power-of-two size.
  const size = 2 ** Math.floor(Math.log2(Math.min(image.width, image.height)))
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(image, 0, 0, size, size)
  return packSlopes(ctx.getImageData(0, 0, size, size).data, size)
}

/** One level: RGBA half floats from a square height grid, rows bottom first. */
function slopeLevel(height: Float32Array, n: number): Uint16Array {
  const out = new Uint16Array(n * n * 4)
  const one = DataUtils.toHalfFloat(1)
  for (let y = 0; y < n; y++) {
    const up = ((y + 1) % n) * n
    const down = ((y - 1 + n) % n) * n
    for (let x = 0; x < n; x++) {
      const i = y * n + x
      // Height change per whole tile: the step between neighbours times texels per tile.
      const du = ((height[y * n + ((x + 1) % n)] - height[y * n + ((x - 1 + n) % n)]) / 2) * n
      const dv = ((height[up + x] - height[down + x]) / 2) * n
      out[i * 4] = DataUtils.toHalfFloat(height[i])
      out[i * 4 + 1] = DataUtils.toHalfFloat(du)
      out[i * 4 + 2] = DataUtils.toHalfFloat(dv)
      out[i * 4 + 3] = one
    }
  }
  return out
}

/** `withSlopes` on raw RGBA rows of a square power-of-two tile (top row first), split out for tests. */
export function packSlopes(src: Uint8ClampedArray | Uint8Array, size: number): DataTexture {
  // Rows bottom first, as an image texture is drawn (flipY), so the tile sits where it did before.
  let height = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) height[y * size + x] = src[((size - 1 - y) * size + x) * 4] / 255
  const mipmaps: { data: Uint16Array; width: number; height: number }[] = []
  for (let n = size; n >= 1; n /= 2) {
    mipmaps.push({ data: slopeLevel(height, n), width: n, height: n })
    if (n === 1) break
    const half = n / 2
    const next = new Float32Array(half * half)
    for (let y = 0; y < half; y++)
      for (let x = 0; x < half; x++) {
        const a = 2 * y * n + 2 * x
        next[y * half + x] = (height[a] + height[a + 1] + height[a + n] + height[a + n + 1]) / 4
      }
    height = next
  }
  const t = new DataTexture(mipmaps[0].data, size, size, RGBAFormat, HalfFloatType)
  t.mipmaps = mipmaps as unknown as DataTexture['mipmaps']
  t.colorSpace = NoColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.magFilter = LinearFilter
  t.minFilter = LinearMipmapLinearFilter
  t.generateMipmaps = false
  t.anisotropy = 4
  t.userData.sloped = true
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
    .then((loadedTexture) => {
      let t: Texture = loadedTexture
      if (SLOPED(name)) {
        const packed = withSlopes(loadedTexture.image as CanvasImageSource & { width: number; height: number })
        if (packed) {
          loadedTexture.dispose()
          t = packed
        }
      }
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
/** 1 once the detail tile in use is a packed one (see `slopeOn`). */
export const detailSlopeUniform = { value: 0 }

export function shellDetail(): void {
  if (detailOnUniform.value) return
  const t = texture('shell-detail', FLAT_DETAIL, (real) => {
    detailUniform.value = real
    detailSlopeUniform.value = slopeOn(real)
    detailOnUniform.value = 1
  })
  if (t !== FLAT_DETAIL) {
    detailUniform.value = t
    detailSlopeUniform.value = slopeOn(t)
    detailOnUniform.value = 1
  }
}

/** The mask for a marking; `onLoad` swaps it in when it arrives later. */
export function markingMask(marking: TextureMarking, onLoad: (t: Texture) => void): Texture {
  return texture(`marking-${marking}`, NO_MARK, onLoad)
}

/** A gear material's height tile; `onLoad` swaps it in when it arrives later. */
export function gearTile(surface: GearSurface, onLoad: (t: Texture) => void): Texture {
  return texture(`gear-${surface}`, FLAT_DETAIL, onLoad)
}

/** The engraving shown on rare and better gear. */
export function engravingMask(onLoad: (t: Texture) => void): Texture {
  return texture('gear-engraving', NO_MARK, onLoad)
}

/** Start loading what this look needs and wait until it is in (or has failed). */
export async function preloadTextures(look: { marking?: ShellMarking; equipment?: object; accessory?: string }): Promise<void> {
  shellDetail()
  if (isTextureMarking(look.marking)) markingMask(look.marking, () => undefined)
  // Gear: every surface, since one piece can use several (they are small and cached).
  const wearsGear = (look.equipment && Object.values(look.equipment).some(Boolean)) || (look.accessory && look.accessory !== 'none')
  if (wearsGear) {
    for (const surface of GEAR_SURFACES) gearTile(surface, () => undefined)
    engravingMask(() => undefined)
  }
  await Promise.all([...pending])
}
