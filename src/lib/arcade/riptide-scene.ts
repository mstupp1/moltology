/**
 * Riptide's picture: the player's own 3D character swimming a reef current past columns of rock,
 * reef and old pipe, over a scrolling seabed with light from the surface. Reads the sim state
 * (riptide-sim.ts) each frame; owns nothing about the rules.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Material, Object3D, Texture } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { buildCharacter, type Character3D } from '../avatar3d/character'
import { withLoftDetail } from '../avatar3d/loft'
import type { Avatar3DLook } from '../avatar3d/look'
import { bakedLightTexture } from '../avatar3d/stage-light'
import {
  COLUMN_W,
  FIELD_H,
  FIELD_W,
  FLOOR_Y,
  PLAYER_X,
  START_Y,
  seededRandom,
  type Column,
  type RiptideState,
} from './riptide-sim'

export interface RiptideSceneOptions {
  quality?: 'high' | 'low'
  /**
   * Painted art (bucket URLs). Each is optional and loads in the background; until it arrives the
   * scene uses its own flat colours and drawn ridges.
   */
  art?: { backdrop?: string; rock?: string; sand?: string; rust?: string }
  reducedMotion?: boolean
  onContextLost?: () => void
}

export interface RiptideScene {
  /** Put this character in the water (rebuilds it). */
  setLook: (look: Avatar3DLook) => void
  /** Draw the state as it is now. `dt` and `time` are seconds of real time, for idle motion. */
  draw: (state: RiptideState, dt: number, time: number) => void
  /** A kick: a burst of bubbles and a claw snap. */
  kick: () => void
  /** The run ended against something. */
  crash: () => void
  /** A gap cleared. */
  point: () => void
  resize: () => void
  dispose: () => void
}

/** How tall the swimmer is drawn, in field units. */
const SWIMMER_HEIGHT = 1.6
/** Turned three quarters toward the way it swims, so the face still shows. */
const SWIM_YAW = 0.85
const WATER_TOP = new Color('#1a6a8a')
const WATER_BOTTOM = new Color('#04131f')
const FOG = new Color('#0a3248')
const Z_AXIS = new Vector3(0, 0, 1)

function waterTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, `#${WATER_TOP.getHexString()}`)
  g.addColorStop(0.45, '#0c3d58')
  g.addColorStop(1, `#${WATER_BOTTOM.getHexString()}`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function rayTexture(): CanvasTexture {
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

function bubbleTexture(): CanvasTexture {
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

/** Paint every vertex of a geometry one colour, nudged a little for a hand-made look. */
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

function lumpy(radius: number, rand: () => number, roughness = 0.22): BufferGeometry {
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

const ROCK_COLORS = ['#3b4a55', '#46525a', '#38434f', '#4d5560'].map((c) => new Color(c))
const MOSS = new Color('#2f6b5a')
const CORAL_COLORS = ['#ff6f61', '#ff9f43', '#f78fb3', '#c56cf0', '#ffd166'].map((c) => new Color(c))
const RUST = new Color('#8a4a2a')
const VERDIGRIS = new Color('#3f8f80')

interface ColumnMaterials {
  rock: MeshStandardMaterial
  coral: MeshStandardMaterial
  pipe: MeshStandardMaterial
}

/**
 * One half of a column, running from the gap edge (y = 0 here) out along `dir` (1 up, -1 down) for
 * `length`. Returns meshes grouped by material.
 */
function buildHalf(column: Column, dir: 1 | -1, length: number, materials: ColumnMaterials): Object3D[] {
  const rand = seededRandom(Math.floor(column.variant * 1e9) + (dir > 0 ? 7 : 13))
  const rockParts: BufferGeometry[] = []
  const coralParts: BufferGeometry[] = []
  const pipeParts: BufferGeometry[] = []
  const half = COLUMN_W / 2

  if (column.kind === 'pipe') {
    const body = new CylinderGeometry(half * 0.82, half * 0.82, length, 14, 1, true)
    body.translate(0, (dir * length) / 2, 0)
    pipeParts.push(tint(body, RUST, rand, 0.12))
    // A flange at the mouth and one or two joints further on.
    const flange = new CylinderGeometry(half * 1.02, half * 1.02, 0.32, 16)
    flange.translate(0, dir * 0.16, 0)
    pipeParts.push(tint(flange, RUST.clone().multiplyScalar(0.85), rand, 0.1))
    const lip = new TorusGeometry(half * 0.78, 0.06, 6, 18)
    lip.rotateX(Math.PI / 2)
    pipeParts.push(tint(lip, RUST.clone().multiplyScalar(0.6), rand, 0.05))
    for (let at = 2.4 + rand() * 0.8; at < length - 0.5; at += 3 + rand()) {
      const joint = new CylinderGeometry(half * 0.95, half * 0.95, 0.2, 14)
      joint.translate(0, dir * at, 0)
      pipeParts.push(tint(joint, VERDIGRIS, rand, 0.12))
    }
    // Barnacles and green crust near the mouth.
    for (let i = 0; i < 9; i++) {
      const a = rand() * Math.PI * 2
      const y = dir * (0.4 + rand() * 2.2)
      const b = new SphereGeometry(0.07 + rand() * 0.07, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2)
      b.rotateZ(-Math.PI / 2)
      b.rotateY(a)
      b.translate(Math.cos(a) * half * 0.82, y, -Math.sin(a) * half * 0.82)
      coralParts.push(tint(b, new Color('#d9d2c0'), rand, 0.1))
    }
  } else {
    // Piled boulders, a big one at the gap and smaller ones wedged around it as the pile runs off
    // the field, so it reads as one rock face rather than a stack of beads.
    const color = ROCK_COLORS[Math.floor(rand() * ROCK_COLORS.length)]
    let at = 0.4
    let i = 0
    while (at < length + 0.6) {
      const r = half * (0.85 + rand() * 0.4) * (i === 0 ? 0.95 : 1)
      const blob = lumpy(r, rand, 0.28)
      blob.scale(1 + rand() * 0.15, 0.7 + rand() * 0.35, 0.85 + rand() * 0.2)
      blob.rotateY(rand() * Math.PI)
      blob.rotateZ((rand() - 0.5) * 0.6)
      blob.translate((rand() - 0.5) * 0.3, dir * at, (rand() - 0.5) * 0.2)
      const mossy = i < 2 && rand() < 0.5
      rockParts.push(tint(blob, mossy ? color.clone().lerp(MOSS, 0.45) : color, rand, 0.14))
      // A smaller stone tucked into the side now and then.
      if (i > 0 && rand() < 0.55) {
        const side = rand() < 0.5 ? -1 : 1
        const small = lumpy(r * (0.45 + rand() * 0.2), rand, 0.3)
        small.translate(side * half * (0.55 + rand() * 0.2), dir * (at - r * 0.4), (rand() - 0.3) * 0.4)
        rockParts.push(tint(small, color.clone().multiplyScalar(0.9), rand, 0.14))
      }
      at += r * (0.95 + rand() * 0.3)
      i++
    }
    if (column.kind === 'reef') {
      // Branching coral and a few round sponges growing from the boulder at the gap.
      const coral = CORAL_COLORS[Math.floor(rand() * CORAL_COLORS.length)]
      const branches = 4 + Math.floor(rand() * 3)
      for (let b = 0; b < branches; b++) {
        const h = 0.35 + rand() * 0.35
        const stem = new CylinderGeometry(0.045, 0.075, h, 5)
        stem.translate(0, h / 2, 0)
        stem.rotateZ((rand() - 0.5) * 1.1)
        stem.rotateX((rand() - 0.5) * 0.9)
        const tip = new SphereGeometry(0.075, 6, 4)
        tip.translate(0, h, 0)
        const piece = mergeGeometries([stem.toNonIndexed(), tip.toNonIndexed()])!
        stem.dispose()
        tip.dispose()
        // Coral grows from the boulder's face out into the gap.
        const x = (rand() - 0.5) * half * 1.3
        const z = (rand() - 0.2) * half * 0.9
        if (dir > 0) piece.rotateZ(Math.PI)
        piece.translate(x, dir * 0.1, z)
        coralParts.push(tint(piece, coral, rand, 0.1))
      }
      for (let s = 0; s < 3; s++) {
        const sponge = new SphereGeometry(0.1 + rand() * 0.08, 8, 6)
        sponge.translate((rand() - 0.5) * half * 1.4, dir * (0.05 + rand() * 0.5), half * 0.55)
        coralParts.push(tint(sponge, CORAL_COLORS[Math.floor(rand() * CORAL_COLORS.length)], rand, 0.06))
      }
    }
  }

  const meshes: Object3D[] = []
  const add = (parts: BufferGeometry[], material: Material) => {
    if (!parts.length) return
    const prepared = parts.map((p) => (p.index ? p.toNonIndexed() : p))
    const merged = mergeGeometries(prepared)
    for (const p of parts) p.dispose()
    if (!merged) return
    merged.computeVertexNormals()
    meshes.push(new Mesh(merged, material))
  }
  add(rockParts, materials.rock)
  add(coralParts, materials.coral)
  add(pipeParts, materials.pipe)
  return meshes
}

function buildColumn(column: Column, materials: ColumnMaterials): Group {
  const group = new Group()
  const top = column.gapY + column.gap / 2
  const bottom = column.gapY - column.gap / 2
  // The upper half runs from the gap up past the surface, the lower one down into the sand.
  const upper = new Group()
  upper.add(...buildHalf(column, 1, FIELD_H + 2 - top, materials))
  upper.position.y = top
  const lower = new Group()
  lower.add(...buildHalf(column, -1, bottom + 1, materials))
  lower.position.y = bottom
  group.add(upper, lower)
  return group
}

function freeGroup(node: Object3D) {
  node.removeFromParent()
  node.traverse((child) => {
    const mesh = child as Mesh
    if (mesh.isMesh) mesh.geometry.dispose()
  })
}

/** A ridge of far rocks for the parallax layers. */
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

function seabedTile(width: number, rand: () => number, material: Material): Mesh {
  // Deep enough that its near edge is out of shot.
  const geo = new PlaneGeometry(width, 20, 48, 10)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, 4)
  const pos = geo.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    // Gentle dunes, matching at the tile edges so tiles join without a seam.
    const dune = Math.sin((x / width) * Math.PI * 4) * 0.12 + Math.sin((x / width) * Math.PI * 10 + 1) * 0.05
    pos.setY(i, dune + (z < -1 ? (rand() - 0.5) * 0.15 : 0))
  }
  geo.computeVertexNormals()
  const mesh = new Mesh(geo, material)
  mesh.position.y = FLOOR_Y - 0.05
  return mesh
}

export function createRiptideScene(canvas: HTMLCanvasElement, options: RiptideSceneOptions = {}): RiptideScene {
  const low = options.quality === 'low'
  const renderer = new WebGLRenderer({ canvas, antialias: !low, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  const water = waterTexture()
  scene.background = water
  scene.fog = new Fog(FOG, 22, 44)
  const pmrem = new PMREMGenerator(renderer)
  const baked = bakedLightTexture('cinematic')
  const env = pmrem.fromEquirectangular(baked)
  baked.dispose()
  pmrem.dispose()
  scene.environment = env.texture

  const camera = new PerspectiveCamera(30, FIELD_W / FIELD_H, 0.1, 80)
  const distance = FIELD_H / 2 / Math.tan((15 * Math.PI) / 180)
  camera.position.set(0, FIELD_H / 2, distance)
  camera.lookAt(0, FIELD_H / 2, 0)

  // Sunlight from the surface, a little ahead of the swimmer, and a cool fill from the water.
  const sun = new DirectionalLight(0xe8fbff, 2.4)
  sun.position.set(-3, 14, 8)
  scene.add(sun, new HemisphereLight(0x7fd6ff, 0x0b2233, 0.9))

  const materials: ColumnMaterials = {
    rock: new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }),
    coral: new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7, metalness: 0, side: DoubleSide }),
    pipe: new MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.35 }),
  }

  // Far layers drift slower than the current, for depth.
  const rand = seededRandom(20261124)
  const far = new Group()
  const farTiles = [0, 1].map(() => ridge(30, 4.5, rand, new Color('#0b2a3c'), -16))
  const mid = new Group()
  const midTiles = [0, 1].map(() => ridge(30, 3.2, rand, new Color('#0d3346'), -8))
  for (const t of farTiles) far.add(t)
  for (const t of midTiles) mid.add(t)
  scene.add(far, mid)

  const sand = new MeshStandardMaterial({ color: '#6c5d45', roughness: 1, flatShading: true })
  const bedTiles = [0, 1].map(() => seabedTile(24, rand, sand))
  // Pebbles and weed on the sand, carried with each tile.
  for (const tile of bedTiles) {
    for (let i = 0; i < 10; i++) {
      const pebble = new Mesh(tint(lumpy(0.12 + rand() * 0.22, rand, 0.3), ROCK_COLORS[i % 4], rand), materials.rock)
      pebble.position.set((rand() - 0.5) * 24, 0.05, (rand() - 0.5) * 3 - 0.5)
      tile.add(pebble)
    }
  }
  scene.add(...bedTiles)

  // Kelp swaying behind the play field.
  const kelpMaterial = new MeshStandardMaterial({ color: '#1f5a45', roughness: 0.9, side: DoubleSide, transparent: true, opacity: 0.7 })
  const kelp: { mesh: Mesh; base: Float32Array; x: number; phase: number }[] = []
  const kelpGroup = new Group()
  for (let i = 0; i < 9; i++) {
    const h = 2.5 + rand() * 4.5
    const geo = new PlaneGeometry(0.3, h, 1, 10)
    geo.translate(0, h / 2, 0)
    // A blade: wide at the base, tapering to a point.
    const blade = geo.getAttribute('position')
    for (let v = 0; v < blade.count; v++) blade.setX(v, blade.getX(v) * (1 - (blade.getY(v) / h) * 0.85))
    const mesh = new Mesh(geo, kelpMaterial)
    const x = (i / 9) * 24 - 12 + rand()
    mesh.position.set(x, FLOOR_Y - 0.1, -3.5 - rand() * 3)
    kelpGroup.add(mesh)
    kelp.push({ mesh, base: Float32Array.from(geo.getAttribute('position').array as Float32Array), x, phase: rand() * 6 })
  }
  scene.add(kelpGroup)

  // Light shafts from the surface.
  const rayTex = rayTexture()
  const rays: Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const ray = new Mesh(
      new PlaneGeometry(1.2 + rand() * 1.4, 18),
      new MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0.07 + rand() * 0.05, blending: AdditiveBlending, depthWrite: false, fog: false }),
    )
    ray.position.set(-6 + i * 3 + rand(), FIELD_H - 4, -6)
    ray.rotation.z = 0.25
    rays.push(ray)
    scene.add(ray)
  }

  // Drifting bubbles, and bursts from the swimmer on each kick.
  const bubbleTex = bubbleTexture()
  const DRIFT = low ? 28 : 48
  const BURST = 24
  const bubbleGeo = new BufferGeometry()
  const bubblePos = new Float32Array((DRIFT + BURST) * 3)
  const bubbleVel = new Float32Array(DRIFT + BURST)
  const burstLife = new Float32Array(BURST)
  for (let i = 0; i < DRIFT; i++) {
    bubblePos.set([(rand() - 0.5) * 14, rand() * FIELD_H, -1 - rand() * 4], i * 3)
    bubbleVel[i] = 0.4 + rand() * 0.8
  }
  for (let i = DRIFT; i < DRIFT + BURST; i++) bubblePos.set([0, -50, 0], i * 3)
  bubbleGeo.setAttribute('position', new BufferAttribute(bubblePos, 3))
  const bubbles = new Points(
    bubbleGeo,
    new PointsMaterial({ map: bubbleTex, size: 0.22, transparent: true, depthWrite: false, opacity: 0.8, fog: false }),
  )
  scene.add(bubbles)
  let burstNext = 0

  // Painted art, swapped in as it arrives.
  const loaded: Texture[] = []
  let backdrop: Mesh | null = null
  let disposed = false
  const loader = new TextureLoader()
  const load = (url: string | undefined, apply: (texture: Texture) => void) => {
    if (!url) return
    loader.load(url, (texture) => {
      if (disposed) {
        texture.dispose()
        return
      }
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
      loaded.push(texture)
      apply(texture)
    })
  }
  const tile = (texture: Texture, repeat: number) => {
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(repeat, repeat)
  }
  load(options.art?.rock, (t) => {
    tile(t, 1)
    materials.rock.map = t
    // The vertex colours are dark slate, made for an untextured rock; lift them so the painted
    // stone shows its own colour and they only vary it rock to rock.
    materials.rock.color.setScalar(3.4)
    materials.rock.needsUpdate = true
  })
  load(options.art?.rust, (t) => {
    tile(t, 1)
    materials.pipe.map = t
    materials.pipe.color.setScalar(2.2)
    materials.pipe.needsUpdate = true
  })
  load(options.art?.sand, (t) => {
    tile(t, 4)
    sand.map = t
    sand.color.set('#d8c9aa')
    sand.needsUpdate = true
  })
  load(options.art?.backdrop, (t) => {
    t.wrapS = RepeatWrapping
    // Far enough back to sit behind everything; the plane is sized to fill any window.
    const plane = new Mesh(new PlaneGeometry(64, 32), new MeshBasicMaterial({ map: t, fog: false, depthWrite: false }))
    // Its reef line sits just above where the sand meets the water from this camera.
    plane.position.set(0, 12, -30)
    plane.renderOrder = -2
    t.repeat.set(1, 1)
    backdrop = plane
    scene.add(plane)
    // The painting has its own ridges; the drawn ones would only flatten it.
    far.visible = false
    mid.visible = false
  })

  let character: Character3D | null = null
  let scale = 1
  const swimmer = new Group()
  swimmer.rotation.y = SWIM_YAW
  scene.add(swimmer)

  const columns = new Map<number, Group>()
  let tilt = 0
  let shake = 0
  let lastPhase: RiptideState['phase'] = 'ready'
  let restPose = false

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  const onLost = (event: Event) => {
    event.preventDefault()
    options.onContextLost?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)

  const wrap = (tiles: Object3D[], width: number, offset: number) => {
    const shift = ((offset % width) + width) % width
    tiles[0].position.x = -shift
    tiles[1].position.x = -shift + width
  }

  return {
    setLook(look) {
      if (character) {
        character.root.removeFromParent()
        character.dispose()
      }
      const built = low ? withLoftDetail(0.8, () => buildCharacter({ ...look, pose: 'ready' })) : buildCharacter({ ...look, pose: 'ready' })
      character = built
      scale = SWIMMER_HEIGHT / built.height
      built.root.scale.setScalar(scale)
      // Lift it so the field point (its middle) sits where the sim puts the swimmer.
      built.root.position.y = (-built.height * scale) / 2
      built.root.traverse((node) => {
        const material = (node as Mesh).material as Material | Material[] | undefined
        for (const m of Array.isArray(material) ? material : material ? [material] : []) m.dithering = true
      })
      swimmer.add(built.root)
      built.bake(renderer, low ? { directions: 24, size: 384 } : undefined)
      restPose = false
    },
    draw(state, dt, time) {
      // Columns: build new ones, move them, free the ones swept away.
      const live = new Set<number>()
      for (const column of state.columns) {
        live.add(column.id)
        let group = columns.get(column.id)
        if (!group) {
          group = buildColumn(column, materials)
          columns.set(column.id, group)
          scene.add(group)
        }
        group.position.x = column.x
      }
      for (const [id, group] of columns) {
        if (!live.has(id)) {
          freeGroup(group)
          columns.delete(id)
        }
      }

      // The current scrolls the seabed and kelp at full speed, the ridges slower.
      wrap(bedTiles, 24, state.distance)
      wrap(midTiles, 30, state.distance * 0.4)
      wrap(farTiles, 30, state.distance * 0.15)
      if (backdrop) ((backdrop.material as MeshBasicMaterial).map as Texture).offset.x = (state.distance * 0.006) % 1
      for (const k of kelp) {
        let x = k.x - state.distance
        x = ((((x + 12) % 24) + 24) % 24) - 12
        k.mesh.position.x = x
        if (!options.reducedMotion) {
          const pos = k.mesh.geometry.getAttribute('position') as BufferAttribute
          for (let i = 0; i < pos.count; i++) {
            const y = k.base[i * 3 + 1]
            pos.setX(i, k.base[i * 3] + Math.sin(time * 1.3 + k.phase + y * 0.6) * 0.12 * y * 0.3)
          }
          pos.needsUpdate = true
        }
      }
      for (const [i, ray] of rays.entries()) {
        ray.rotation.z = 0.25 + Math.sin(time * 0.3 + i) * 0.04
      }

      // Bubbles rise and wrap; bursts fade out.
      const pos = bubbleGeo.getAttribute('position') as BufferAttribute
      for (let i = 0; i < DRIFT; i++) {
        let y = pos.getY(i) + bubbleVel[i] * dt
        let x = pos.getX(i) - (state.phase === 'playing' ? state.speed * dt * 0.6 : 0)
        if (y > FIELD_H + 0.5) y = -0.5
        if (x < -8) x += 16
        pos.setXY(i, x, y)
      }
      for (let b = 0; b < BURST; b++) {
        const i = DRIFT + b
        if (burstLife[b] <= 0) continue
        burstLife[b] -= dt
        pos.setXY(i, pos.getX(i) - (state.phase === 'playing' ? state.speed * dt : 0) - dt * 0.3, pos.getY(i) + bubbleVel[i] * dt)
        if (burstLife[b] <= 0) pos.setY(i, -50)
      }
      pos.needsUpdate = true

      // The swimmer: bobs while waiting, noses up on a kick and down as it sinks.
      const bob = state.phase === 'ready' && !options.reducedMotion ? Math.sin(time * 2.2) * 0.22 : 0
      swimmer.position.set(PLAYER_X, (state.phase === 'ready' ? START_Y : state.y) + bob, 0)
      const want = state.phase === 'ready' ? Math.sin(time * 2.2) * 0.08 : Math.max(-0.55, Math.min(0.4, state.vy * 0.05))
      tilt += (want - tilt) * Math.min(1, dt * 10)
      // Turned to face the way it swims, the body leans about its own forward axis.
      swimmer.rotation.set(0, SWIM_YAW, 0)
      swimmer.rotateOnWorldAxis(Z_AXIS, tilt)
      if (state.phase === 'dead' && lastPhase !== 'dead') shake = 0.35
      if (state.phase === 'dead' && state.vy === 0 && !restPose && character) {
        character.setPose('shrug')
        restPose = true
      }
      if (state.phase !== 'dead' && restPose && character) {
        character.setPose('ready')
        restPose = false
      }
      lastPhase = state.phase
      character?.update(dt, time, !options.reducedMotion)

      // A short shake when the run ends.
      if (shake > 0 && !options.reducedMotion) {
        shake = Math.max(0, shake - dt)
        const s = shake * 0.35
        camera.position.set(Math.sin(time * 70) * s, FIELD_H / 2 + Math.cos(time * 63) * s, distance)
      } else camera.position.set(0, FIELD_H / 2, distance)
      camera.lookAt(camera.position.x, FIELD_H / 2, 0)

      renderer.render(scene, camera)
    },
    kick() {
      character?.react('snap')
      if (options.reducedMotion) return
      const pos = bubbleGeo.getAttribute('position') as BufferAttribute
      for (let n = 0; n < 5; n++) {
        const b = burstNext
        burstNext = (burstNext + 1) % BURST
        burstLife[b] = 0.8 + Math.random() * 0.5
        bubbleVel[DRIFT + b] = 0.8 + Math.random() * 1.2
        pos.setXYZ(DRIFT + b, swimmer.position.x - 0.35 + (Math.random() - 0.5) * 0.3, swimmer.position.y - 0.3 + Math.random() * 0.3, 0.6)
      }
    },
    crash() {
      character?.react('poke')
    },
    point() {
      // Nothing to show yet beyond the score itself.
    },
    resize,
    dispose() {
      disposed = true
      for (const t of loaded) t.dispose()
      canvas.removeEventListener('webglcontextlost', onLost)
      for (const group of columns.values()) freeGroup(group)
      columns.clear()
      character?.dispose()
      scene.traverse((node) => {
        const mesh = node as Mesh
        if (mesh.isMesh || (node as Points).isPoints) {
          mesh.geometry?.dispose()
          const material = mesh.material as Material | Material[]
          for (const m of Array.isArray(material) ? material : [material]) m?.dispose()
        }
      })
      for (const m of Object.values(materials)) m.dispose()
      water.dispose()
      rayTex.dispose()
      bubbleTex.dispose()
      env.dispose()
      renderer.dispose()
    },
  }
}

