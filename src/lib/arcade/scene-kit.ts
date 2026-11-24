/**
 * Pieces every arcade scene draws with: light shafts, bubbles, faceted rocks with per-face colour,
 * far ridges for parallax. Kept free of any one game's rules.
 */
import { BufferAttribute, BufferGeometry, CanvasTexture, Color, IcosahedronGeometry, Mesh, MeshBasicMaterial, Shape, ShapeGeometry } from 'three'

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

