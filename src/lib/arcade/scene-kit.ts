/**
 * Pieces every arcade scene draws with: light shafts, bubbles, faceted rocks with per-face colour,
 * far ridges for parallax. Kept free of any one game's rules.
 */
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { seededRandom } from './riptide-sim'

const UP = new Vector3(0, 1, 0)

export const ROCK_COLORS = ['#3b4a55', '#46525a', '#38434f', '#4d5560'].map((c) => new Color(c))
export const CORAL_COLORS = ['#ff6f61', '#ff9f43', '#f78fb3', '#c56cf0', '#ffd166'].map((c) => new Color(c))

export function rayTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const across = ctx.createLinearGradient(0, 0, 64, 0)
  across.addColorStop(0, 'rgba(255,255,255,0)')
  across.addColorStop(0.5, 'rgba(255,255,255,1)')
  across.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = across
  ctx.fillRect(0, 0, 64, 256)
  ctx.globalCompositeOperation = 'destination-in'
  const down = ctx.createLinearGradient(0, 0, 0, 256)
  down.addColorStop(0, 'rgba(0,0,0,1)')
  down.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = down
  ctx.fillRect(0, 0, 64, 256)
  return new CanvasTexture(canvas)
}

export function bubbleTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(26, 24, 2, 32, 32, 30)
  g.addColorStop(0, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.35, 'rgba(200,240,255,0.25)')
  g.addColorStop(0.85, 'rgba(200,240,255,0.5)')
  g.addColorStop(1, 'rgba(200,240,255,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(32, 32, 30, 0, Math.PI * 2)
  ctx.fill()
  return new CanvasTexture(canvas)
}

export /** Paint every vertex of a geometry one colour, nudged a little for a hand-made look. */
function tint(geometry: BufferGeometry, color: Color, rand: () => number, spread = 0.08): BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  const count = g.getAttribute('position').count
  const colors = new Float32Array(count * 3)
  const c = new Color()
  // One colour per face so the facets read.
  for (let i = 0; i < count; i += 3) {
    const k = 1 + (rand() - 0.5) * spread * 2
    c.copy(color).multiplyScalar(k)
    for (let j = 0; j < 3 && i + j < count; j++) colors.set([c.r, c.g, c.b], (i + j) * 3)
  }
  g.setAttribute('color', new BufferAttribute(colors, 3))
  if (g !== geometry) geometry.dispose()
  return g
}

export function lumpy(radius: number, rand: () => number, roughness = 0.22): BufferGeometry {
  const geo = new IcosahedronGeometry(radius, 1)
  const pos = geo.getAttribute('position')
  // Push each corner in or out; shared corners move together because the solid is indexed per face
  // only after this, so the surface stays closed.
  const moved = new Map<string, number>()
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`
    let k = moved.get(key)
    if (k === undefined) {
      k = 1 + (rand() - 0.5) * roughness * 2
      moved.set(key, k)
    }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k)
  }
  geo.computeVertexNormals()
  return geo
}

export /** A ridge of far rocks for the parallax layers. */
function ridge(width: number, height: number, rand: () => number, color: Color, z: number): Mesh {
  const shape = new Shape()
  shape.moveTo(-width / 2, -2)
  let x = -width / 2
  while (x < width / 2) {
    shape.lineTo(x, height * (0.35 + rand() * 0.65))
    x += 0.8 + rand() * 1.6
  }
  shape.lineTo(width / 2, height * 0.5)
  shape.lineTo(width / 2, -2)
  shape.closePath()
  const mesh = new Mesh(new ShapeGeometry(shape), new MeshBasicMaterial({ color, fog: true }))
  mesh.position.z = z
  return mesh
}


/**
 * A sea urchin: a dark round test bristling with long spines, built once and reused. On the sand
 * (`full` false) only the upper part has spines and it sits with its base at 0; floating (`full`)
 * it is spined all round and centred on 0.
 */
export function urchinGeometry({ full = false }: { full?: boolean } = {}): BufferGeometry {
  const rand = seededRandom(31)
  const parts: BufferGeometry[] = []
  const body = new SphereGeometry(0.2, 12, 8)
  body.scale(1, full ? 1 : 0.82, 1)
  parts.push(tint(body.toNonIndexed(), new Color('#3a1f4a'), rand, 0.12))
  body.dispose()
  const spine = new Color('#5b2d6e')
  const n = full ? 72 : 46
  const reach = full ? 2 : 1.25
  for (let i = 0; i < n; i++) {
    // Spread evenly over the ball (on the sand, over its upper part only).
    const y = 1 - (i / (n - 1)) * reach
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const a = i * 2.399963
    const dir = new Vector3(Math.cos(a) * r, full ? y : Math.max(-0.25, y), Math.sin(a) * r).normalize()
    const len = 0.26 + rand() * 0.14
    const cone = new ConeGeometry(0.022, len, 4)
    cone.translate(0, len / 2 + 0.14, 0)
    cone.applyQuaternion(new Quaternion().setFromUnitVectors(UP, dir))
    parts.push(tint(cone.toNonIndexed(), spine.clone().lerp(new Color('#c26bd8'), rand() * 0.35), rand, 0.1))
    cone.dispose()
  }
  const merged = mergeGeometries(parts)!
  for (const p of parts) p.dispose()
  if (!full) merged.translate(0, 0.17, 0)
  merged.computeVertexNormals()
  return merged
}

/** A canvas texture holding one short line of text, redrawn with `set`. */
export function labelTexture({ color = 'rgba(220,245,255,0.85)', align = 'left' }: { color?: string; align?: 'left' | 'center' } = {}): {
  texture: CanvasTexture
  set: (text: string) => void
} {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return {
    texture,
    set(text) {
      ctx.clearRect(0, 0, 256, 64)
      ctx.font = '600 34px Inter, system-ui, sans-serif'
      ctx.fillStyle = color
      ctx.textBaseline = 'middle'
      ctx.textAlign = align
      ctx.fillText(text, align === 'center' ? 128 : 8, 34)
      texture.needsUpdate = true
    },
  }
}

/** A soft glow across a strip's width, bright in the middle: for beams and lines. */
function glowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 4
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 64, 0)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.5, 'rgba(255,255,255,1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 4)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export const BEST_COLOR = '#ffd166'

export interface BestMarker {
  group: Group
  /** The player just went past it: a flare, then it fades away. */
  pass: () => void
  /** Back to full for a new run. */
  reset: () => void
  update: (dt: number, time: number) => void
  dispose: () => void
}

/**
 * Where the player's best score lies in the world: a gold beam (`post`, standing up from y = 0, or
 * `line`, lying across from the middle) of `length`, with a "Best" tag at its top (post) or right
 * end (line), or beside the post's middle with `tagBeside`.
 */
export function createBestMarker(kind: 'post' | 'line', length: number, { tagBeside = false }: { tagBeside?: boolean } = {}): BestMarker {
  const group = new Group()
  const glow = glowTexture()
  // Plain (not additive) blending so it stays gold over blue water rather than washing to white.
  const beamMaterial = new MeshBasicMaterial({ map: glow, color: BEST_COLOR, transparent: true, opacity: 0.55, depthWrite: false, fog: false })
  const beam = new Mesh(new PlaneGeometry(0.3, length), beamMaterial)
  if (kind === 'post') beam.position.y = length / 2
  else beam.rotation.z = Math.PI / 2
  const label = labelTexture({ color: BEST_COLOR, align: 'center' })
  label.set('Best')
  const tagMaterial = new MeshBasicMaterial({ map: label.texture, transparent: true, depthWrite: false, fog: false })
  const tag = new Mesh(new PlaneGeometry(1.4, 0.35), tagMaterial)
  // A post's tag sits on top, or beside its middle when something may cover the top.
  if (kind === 'post') tag.position.set(tagBeside ? 0.85 : 0, tagBeside ? length / 2 : length + 0.3, 0.3)
  // Lying across: the tag sits a little in from the right end, clear of anything lining the sides.
  else tag.position.set(length / 2 - 1.6, 0.28, 0.4)
  group.add(beam, tag)
  let passedAt = -1
  let since = 0
  return {
    group,
    pass() {
      if (passedAt < 0) passedAt = 0
    },
    reset() {
      passedAt = -1
      since = 0
      beam.scale.set(1, 1, 1)
      beamMaterial.opacity = 0.55
      tagMaterial.opacity = 1
    },
    update(dt, time) {
      if (passedAt < 0) {
        beamMaterial.opacity = 0.5 + 0.15 * Math.sin(time * 3)
        return
      }
      since += dt
      const t = Math.min(1, since / 0.6)
      beamMaterial.opacity = 0.9 * (1 - t)
      tagMaterial.opacity = 1 - t
      // The beam's own x is its thickness, whichever way it lies.
      beam.scale.set(1 + 1.2 * t, 1, 1)
    },
    dispose() {
      beam.geometry.dispose()
      tag.geometry.dispose()
      beamMaterial.dispose()
      tagMaterial.dispose()
      glow.dispose()
      label.texture.dispose()
    },
  }
}
