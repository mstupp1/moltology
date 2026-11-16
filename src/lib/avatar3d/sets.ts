/**
 * Sets for scripted animation: a floor and a few simple pieces in front of a painted backdrop, so
 * characters stand on something, cast shadows onto it, and the camera has depth to move past.
 * Everything is built from primitives in code, like the characters. Pieces stay behind and to the
 * sides of where the cast stands (x within about ±1.3, z near 0), never in front of them.
 */
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  CircleGeometry,
  SRGBColorSpace,
  type Object3D,
} from 'three'

export const SET_NAMES = ['codex-study', 'reef-office', 'open-water'] as const
export type SetName = (typeof SET_NAMES)[number]

export interface BuiltSet {
  root: Group
  /** Gentle motion (kelp sway, lamp flicker) at time t in seconds. */
  update: (t: number) => void
}

/** A floor disc whose colour fades out at the edge, so it melts into the painted backdrop. */
function floor(color: string, radius = 3.2): Mesh {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = new Color(color)
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, `rgba(${rgb},1)`)
  g.addColorStop(0.55, `rgba(${rgb},0.85)`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const mesh = new Mesh(new CircleGeometry(radius, 48), new MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.95, depthWrite: false }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.0005
  mesh.receiveShadow = true
  mesh.renderOrder = -2
  return mesh
}

const mat = (color: string, roughness = 0.7, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })

function piece(geometry: ConstructorParameters<typeof Mesh>[0], material: MeshStandardMaterial, x: number, y: number, z: number): Mesh {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** A strand of kelp: stacked, tapering segments that sway from the root. */
function kelp(x: number, z: number, height: number, phase: number): { node: Group; sway: (t: number) => void } {
  const node = new Group()
  node.position.set(x, 0, z)
  const green = mat('#2f6b3a', 0.8)
  const segments: Group[] = []
  let parent: Object3D = node
  const n = 6
  for (let i = 0; i < n; i++) {
    const joint = new Group()
    joint.position.y = i === 0 ? 0 : height / n
    const r = 0.05 * (1 - i / (n + 1))
    const stem = new Mesh(new CylinderGeometry(r * 0.8, r, height / n, 8), green)
    stem.position.y = height / n / 2
    stem.castShadow = true
    const leaf = new Mesh(new SphereGeometry(0.09, 8, 6), green)
    leaf.scale.set(0.5, 1.6, 0.18)
    leaf.position.set(i % 2 ? 0.07 : -0.07, height / n / 2, 0)
    leaf.rotation.z = i % 2 ? -0.5 : 0.5
    joint.add(stem, leaf)
    parent.add(joint)
    parent = joint
    segments.push(joint)
  }
  return {
    node,
    sway: (t) => segments.forEach((s, i) => (s.rotation.z = Math.sin(t * 0.9 + phase + i * 0.5) * 0.06 * (i + 1) * 0.5)),
  }
}

function rock(x: number, z: number, size: number, color = '#5b6670'): Mesh {
  const mesh = piece(new DodecahedronGeometry(size, 0), mat(color, 0.95), x, size * 0.45, z)
  mesh.scale.set(1.3, 0.75, 1)
  mesh.rotation.y = x * 2.1
  return mesh
}

function desk(x: number, z: number, top: string, legs: string): Group {
  const g = new Group()
  g.position.set(x, 0, z)
  const wood = mat(top, 0.6)
  g.add(piece(new BoxGeometry(1.5, 0.08, 0.7), wood, 0, 0.78, 0))
  const legMat = mat(legs, 0.7)
  for (const [lx, lz] of [[-0.68, -0.28], [0.68, -0.28], [-0.68, 0.28], [0.68, 0.28]]) g.add(piece(new BoxGeometry(0.07, 0.78, 0.07), legMat, lx, 0.39, lz))
  return g
}

function books(x: number, y: number, z: number): Group {
  const g = new Group()
  const colors = ['#7a2e2a', '#2f4f6e', '#6b5a2a', '#3d5c3a']
  colors.forEach((c, i) => {
    const b = piece(new BoxGeometry(0.42 - i * 0.03, 0.07, 0.3), mat(c, 0.8), x + (i % 2) * 0.02, y + 0.035 + i * 0.072, z)
    b.rotation.y = (i - 1.5) * 0.12
    g.add(b)
  })
  return g
}

/** A desk lamp with a warm light of its own. */
function lamp(x: number, y: number, z: number): { node: Group; light: PointLight } {
  const g = new Group()
  g.position.set(x, y, z)
  const brass = mat('#b08a3e', 0.35, 0.6)
  g.add(piece(new CylinderGeometry(0.12, 0.14, 0.04, 20), brass, 0, 0.02, 0))
  g.add(piece(new CylinderGeometry(0.018, 0.018, 0.5, 8), brass, 0, 0.27, 0))
  const shade = piece(new ConeGeometry(0.17, 0.18, 24, 1, true), mat('#2d5a3d', 0.5), 0, 0.55, 0)
  g.add(shade)
  const bulb = new Mesh(new SphereGeometry(0.05, 12, 8), new MeshStandardMaterial({ color: '#fff1c8', emissive: '#ffd27a', emissiveIntensity: 2.5 }))
  bulb.position.y = 0.5
  g.add(bulb)
  const light = new PointLight('#ffc874', 2.2, 4.5, 1.6)
  light.position.set(0, 0.48, 0.05)
  g.add(light)
  return { node: g, light }
}

export function buildSet(name: SetName): BuiltSet {
  const root = new Group()
  const sways: ((t: number) => void)[] = []
  let flicker: PointLight | null = null
  if (name === 'codex-study') {
    root.add(floor('#5a3f2c'))
    // A round rug under the cast.
    const rug = new Mesh(new CircleGeometry(1.5, 48), mat('#6e2f2b', 0.95))
    rug.rotation.x = -Math.PI / 2
    rug.position.y = 0.001
    rug.receiveShadow = true
    root.add(rug)
    const d = desk(1.15, -1.8, '#6b4429', '#4a2e1b')
    root.add(d)
    root.add(books(0.85, 0.82, -1.75))
    const l = lamp(1.5, 0.82, -1.85)
    root.add(l.node)
    flicker = l.light
    root.add(books(-1.25, 0, -1.3))
    root.add(books(-1.0, 0, -1.7))
  } else if (name === 'reef-office') {
    root.add(floor('#3b6f74'))
    root.add(desk(-1.85, -1.5, '#d9d2c3', '#8c8f93'))
    const screen = piece(new BoxGeometry(0.6, 0.38, 0.04), new MeshStandardMaterial({ color: '#0f2733', emissive: '#2bb6d6', emissiveIntensity: 0.45 }), -1.85, 1.08, -1.6)
    root.add(screen)
    for (const [x, z, h, p] of [[1.7, -1.3, 1.6, 0], [2.0, -1.0, 1.2, 1.3], [1.45, -1.7, 1.9, 2.2]] as const) {
      const k = kelp(x, z, h, p)
      root.add(k.node)
      sways.push(k.sway)
    }
    root.add(rock(1.5, -0.9, 0.18, '#c96f5a'))
    root.add(rock(-1.4, -0.9, 0.14, '#e0a15e'))
  } else {
    root.add(floor('#8a7a5c'))
    for (const [x, z, s] of [[-1.7, -1.1, 0.42], [1.8, -1.4, 0.55], [2.2, -0.6, 0.22], [-2.2, -0.5, 0.25]] as const) root.add(rock(x, z, s))
    for (const [x, z, h, p] of [[-1.5, -1.6, 2.2, 0.4], [-1.95, -1.3, 1.6, 1.7], [1.55, -1.9, 2.4, 2.9], [2.05, -1.7, 1.7, 0.9]] as const) {
      const k = kelp(x, z, h, p)
      root.add(k.node)
      sways.push(k.sway)
    }
  }
  return {
    root,
    update(t) {
      for (const sway of sways) sway(t)
      if (flicker) flicker.intensity = 2.2 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 2.1) * 0.05
    },
  }
}
