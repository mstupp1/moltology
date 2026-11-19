/**
 * Baked studio light. The soft lights around the character (sky and floor bounce, the blue fill,
 * the cyan rim and the pink kicker) are painted once into one small environment picture instead
 * of being lit live, so every pixel of the character works out one direct light (the key, which
 * casts the shadow) instead of five. The picture is built on the CPU from a captured studio room
 * plus a soft lobe for each light, then prefiltered once by three's PMREM.
 *
 * Each lobe carries the same total light as the directional light it stands for, so diffuse
 * shading matches; highlights from it are softer, like a large softbox.
 */
import { DataTexture, DataUtils, EquirectangularReflectionMapping, HalfFloatType, LinearFilter, LinearSRGBColorSpace, RGBAFormat, Color, Vector3 } from 'three'
import { ROOM_ENV, ROOM_ENV_RGBE } from './room-env'

export type StageLighting = 'studio' | 'cinematic'

interface Lobe {
  /** Where the light comes from (towards the light). */
  from: [number, number, number]
  color: number
  /** The directional light's intensity it replaces. */
  intensity: number
  /** Higher is a tighter lobe (12 is about 25 degrees across). */
  sharpness: number
}

interface LightRecipe {
  /** How much of the captured room shows (what scene.environmentIntensity was). */
  room: number
  sky: number
  ground: number
  hemi: number
  lobes: Lobe[]
}

/** The same lights stage.ts used to light live, minus the key. */
export const LIGHT_RECIPES: Record<StageLighting, LightRecipe> = {
  studio: {
    room: 0.28,
    sky: 0xfff1e6,
    ground: 0x5a3038,
    hemi: 0.4,
    lobes: [
      { from: [-3.2, 1.6, 2.4], color: 0xa9c9ff, intensity: 0.5, sharpness: 6 },
      { from: [-1.8, 2.6, -3.6], color: 0xc8ecff, intensity: 1.9, sharpness: 12 },
    ],
  },
  cinematic: {
    room: 0.2,
    sky: 0xfff1e6,
    ground: 0x0b2a36,
    hemi: 0.22,
    lobes: [
      { from: [-3.2, 1.6, 2.4], color: 0x7fb8ff, intensity: 0.28, sharpness: 6 },
      { from: [-3.4, 2.2, -1.6], color: 0x48dcff, intensity: 8, sharpness: 12 },
      { from: [3.4, 1.4, -1.4], color: 0xff8fc4, intensity: 3.2, sharpness: 12 },
    ],
  },
}

const WIDTH = 256
const HEIGHT = 128

let room: Float32Array | null = null

/** The captured room as linear radiance, RGB per texel. */
function roomRadiance(): Float32Array {
  if (room) return room
  const bytes = Uint8Array.from(atob(ROOM_ENV_RGBE), (c) => c.charCodeAt(0))
  room = new Float32Array(ROOM_ENV.width * ROOM_ENV.height * 3)
  for (let i = 0; i < ROOM_ENV.width * ROOM_ENV.height; i++) {
    const e = bytes[i * 4 + 3]
    const s = e ? Math.pow(2, e - 128) / 255 : 0
    room[i * 3] = bytes[i * 4] * s
    room[i * 3 + 1] = bytes[i * 4 + 1] * s
    room[i * 3 + 2] = bytes[i * 4 + 2] * s
  }
  return room
}

/** The room's radiance in a direction, blended between its texels. */
function sampleRoom(u: number, v: number, out: number[]): void {
  const data = roomRadiance()
  const w = ROOM_ENV.width
  const h = ROOM_ENV.height
  const x = (((u * w - 0.5) % w) + w) % w
  const y = Math.min(Math.max(v * h - 0.5, 0), h - 1)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = (x0 + 1) % w
  const y1 = Math.min(y0 + 1, h - 1)
  const fx = x - x0
  const fy = y - y0
  for (let c = 0; c < 3; c++) {
    const a = data[(y0 * w + x0) * 3 + c] * (1 - fx) + data[(y0 * w + x1) * 3 + c] * fx
    const b = data[(y1 * w + x0) * 3 + c] * (1 - fx) + data[(y1 * w + x1) * 3 + c] * fx
    out[c] = a * (1 - fy) + b * fy
  }
}

const built = new Map<StageLighting, Uint16Array>()

/**
 * The baked light as an equirectangular half-float picture (256x128, laid out the way three
 * reads equirectangular maps). The pixels are made once per lighting and shared by every stage.
 */
export function bakedLightTexture(lighting: StageLighting): DataTexture {
  let data = built.get(lighting)
  if (!data) {
    const recipe = LIGHT_RECIPES[lighting]
    const sky = new Color(recipe.sky)
    const ground = new Color(recipe.ground)
    const lobes = recipe.lobes.map((l) => ({
      dir: new Vector3(...l.from).normalize(),
      // Peak radiance of a lobe whose total over the sphere is the light's intensity.
      rgb: new Color(l.color).multiplyScalar((l.intensity * l.sharpness) / (2 * Math.PI * (1 - Math.exp(-2 * l.sharpness)))),
      sharpness: l.sharpness,
    }))
    data = new Uint16Array(WIDTH * HEIGHT * 4)
    const px = [0, 0, 0]
    const d = new Vector3()
    for (let y = 0; y < HEIGHT; y++) {
      const v = (y + 0.5) / HEIGHT
      const theta = (v - 0.5) * Math.PI
      for (let x = 0; x < WIDTH; x++) {
        const u = (x + 0.5) / WIDTH
        // three's equirect lookup: u = atan(z, x) / 2pi + 0.5, v = asin(y) / pi + 0.5.
        const phi = (u - 0.5) * 2 * Math.PI
        d.set(Math.cos(theta) * Math.cos(phi), Math.sin(theta), Math.cos(theta) * Math.sin(phi))
        // The room was captured with u = atan(z, x) / 2pi from +x.
        sampleRoom((phi / (2 * Math.PI) + 1) % 1, v, px)
        // A hemisphere light as radiance with the same irradiance: the mid colour everywhere,
        // plus the sky-ground difference growing towards up (a cosine-weighted gather of a
        // linear gradient comes out at 2/3 of it, hence the 0.75).
        const hemi = (sky: number, ground: number) => Math.max(0, (sky + ground) / 2 + 0.75 * (sky - ground) * d.y) * (recipe.hemi / Math.PI)
        let r = px[0] * recipe.room + hemi(sky.r, ground.r)
        let g = px[1] * recipe.room + hemi(sky.g, ground.g)
        let b = px[2] * recipe.room + hemi(sky.b, ground.b)
        for (const l of lobes) {
          const k = Math.exp(l.sharpness * (d.dot(l.dir) - 1))
          r += l.rgb.r * k
          g += l.rgb.g * k
          b += l.rgb.b * k
        }
        const i = (y * WIDTH + x) * 4
        data[i] = DataUtils.toHalfFloat(r)
        data[i + 1] = DataUtils.toHalfFloat(g)
        data[i + 2] = DataUtils.toHalfFloat(b)
        data[i + 3] = DataUtils.toHalfFloat(1)
      }
    }
    built.set(lighting, data)
  }
  const texture = new DataTexture(data, WIDTH, HEIGHT, RGBAFormat, HalfFloatType)
  texture.mapping = EquirectangularReflectionMapping
  texture.colorSpace = LinearSRGBColorSpace
  texture.magFilter = texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}
