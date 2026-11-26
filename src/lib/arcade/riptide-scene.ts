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
import { CORAL_COLORS, ROCK_COLORS, bubbleTexture, createBestMarker, lumpy, rayTexture, ridge, tint } from './scene-kit'
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
  /** The player's best so far: a gold marker stands in the gap that would beat it. */
  setBest: (best: number) => void
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

const MOSS = new Color('#2f6b5a')
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

interface ColumnNode {
  group: Group
  upper: Group
  lower: Group
  glow: Mesh
}

function buildColumn(column: Column, materials: ColumnMaterials, glowMaterial: Material, glowGeo: BufferGeometry): ColumnNode {
  const group = new Group()
  // Long enough to stay off the field at either end of a drifting gap's swing.
  const top = column.baseY - column.drift + column.gap / 2
  const bottom = column.baseY + column.drift - column.gap / 2
  // The upper half runs from the gap up past the surface, the lower one down into the sand.
  const upper = new Group()
  upper.add(...buildHalf(column, 1, FIELD_H + 2 - top, materials))
  const lower = new Group()
  lower.add(...buildHalf(column, -1, bottom + 1, materials))
  // A soft glow in the opening, so the way through reads at a glance against dark rock.
  const glow = new Mesh(glowGeo, glowMaterial)
  glow.position.z = -0.4
  glow.renderOrder = 1
  group.add(upper, lower, glow)
  return { group, upper, lower, glow }
}

/** Light in a gap: bright in the middle, fading smoothly to nothing on every side. */
function gapGlowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(32, 64)
  for (let y = 0; y < 64; y++) {
    const v = Math.pow(Math.sin((Math.PI * (y + 0.5)) / 64), 0.8)
    for (let x = 0; x < 32; x++) {
      const u = 1 - Math.abs((x + 0.5) / 16 - 1)
      const i = (y * 32 + x) * 4
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255
      image.data[i + 3] = Math.round(255 * u * u * v)
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function freeGroup(node: Object3D) {
  node.removeFromParent()
  node.traverse((child) => {
    const mesh = child as Mesh
    if (mesh.isMesh) mesh.geometry.dispose()
  })
}

function seabedTile(width: number, rand: () => number, material: Material): Mesh {
  // Deep enough that its near edge is out of shot.
  const geo = new PlaneGeometry(width, 70, 48, 14)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, 29)
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
  // The camera always takes in the whole field: on a tall screen it backs off until the field's
  // width fits (showing more water above and sand below, never more of the way ahead); on a wide one
  // the field's height fits and the page dims what lies beyond its sides.
  const HALF_FOV = Math.tan((15 * Math.PI) / 180)
  let distance = FIELD_H / 2 / HALF_FOV
  camera.position.set(0, FIELD_H / 2, distance)
  camera.lookAt(0, FIELD_H / 2, 0)

  // Sunlight from the surface, a little ahead of the swimmer, and a cool fill from the water.
  const sun = new DirectionalLight(0xe8fbff, 2.4)
  sun.position.set(-3, 14, 8)
  // A cool light from behind and above picks out the rock edges against the dark water.
  const rim = new DirectionalLight(0x9fe8ff, 1.4)
  rim.position.set(4, 10, -6)
  scene.add(sun, rim, new HemisphereLight(0x7fd6ff, 0x0b2233, 1.1))

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
    materials.rock.color.setScalar(4.2)
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
    placeBackdrop()
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

  const columns = new Map<number, ColumnNode>()
  const glowTex = gapGlowTexture()
  const glowGeo = new PlaneGeometry(COLUMN_W * 1.6, 1)
  const glowMaterial = new MeshBasicMaterial({ map: glowTex, color: '#7fe3ff', transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false, fog: false })

  // A gold marker in the gap that would beat the player's best.
  const bestMarker = createBestMarker('post', 2.6, { tagBeside: true })
  bestMarker.group.visible = false
  scene.add(bestMarker.group)
  let best = 0

  // A ring of light washing back off the swimmer each time a gap is cleared.
  const RINGS = 3
  const ringGeo = new TorusGeometry(0.5, 0.045, 6, 28)
  const rings = Array.from({ length: RINGS }, () => {
    const mesh = new Mesh(ringGeo, new MeshBasicMaterial({ color: '#bff3ff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, fog: false }))
    mesh.rotation.y = Math.PI / 2 - 0.35
    mesh.visible = false
    scene.add(mesh)
    return { mesh, life: 0 }
  })
  let ringNext = 0
  let tilt = 0
  let shake = 0
  let lastPhase: RiptideState['phase'] = 'ready'
  let restPose = false

  /** Keep the painted reef line just above where the sand meets the water, at any camera distance. */
  function placeBackdrop() {
    if (!backdrop) return
    const back = 30
    const k = (distance + back) / (FIELD_H / 2 / HALF_FOV + back)
    // Height on the backdrop where the far edge of the sand (6 back, 5 below the camera) lines up.
    const horizon = FIELD_H / 2 - ((FIELD_H / 2 - FLOOR_Y) * (distance + back)) / (distance + 6)
    backdrop.scale.set(k * 1.2, k, 1)
    backdrop.position.y = horizon - 1 + 16 * k
  }

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const halfHeight = Math.max(FIELD_H, FIELD_W / camera.aspect) / 2
    distance = halfHeight / HALF_FOV
    if (scene.fog instanceof Fog) {
      scene.fog.near = distance
      scene.fog.far = distance + 22
    }
    placeBackdrop()
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
      const built = low ? withLoftDetail(0.8, () => buildCharacter({ ...look, pose: 'rest' })) : buildCharacter({ ...look, pose: 'rest' })
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
      built.setSwim(true)
      built.bake(renderer, low ? { directions: 24, size: 384 } : undefined)
      restPose = false
    },
    draw(state, dt, time) {
      // Columns: build new ones, move them, free the ones swept away.
      const live = new Set<number>()
      let marked = false
      for (const column of state.columns) {
        live.add(column.id)
        let node = columns.get(column.id)
        if (!node) {
          node = buildColumn(column, materials, glowMaterial, glowGeo)
          columns.set(column.id, node)
          scene.add(node.group)
        }
        node.group.position.x = column.x
        node.upper.position.y = column.gapY + column.gap / 2
        node.lower.position.y = column.gapY - column.gap / 2
        node.glow.position.y = column.gapY
        node.glow.scale.y = column.gap
        if (best > 0 && column.id === best + 1) {
          marked = true
          bestMarker.group.position.set(column.x, column.gapY - 1.3, -0.2)
          if (column.passed) bestMarker.pass()
        }
      }
      for (const [id, node] of columns) {
        if (!live.has(id)) {
          // The glow's shape is shared by every column; only the rock is freed.
          node.glow.removeFromParent()
          freeGroup(node.group)
          columns.delete(id)
        }
      }
      if (state.phase === 'ready') bestMarker.reset()
      bestMarker.group.visible = marked
      bestMarker.update(dt, time)
      for (const ring of rings) {
        if (ring.life <= 0) continue
        ring.life = Math.max(0, ring.life - dt)
        const t = 1 - ring.life / 0.5
        ring.mesh.scale.setScalar(0.8 + t * 1.6)
        ring.mesh.position.x -= state.speed * dt * 0.5
        ;(ring.mesh.material as MeshBasicMaterial).opacity = 0.7 * (1 - t)
        ring.mesh.visible = ring.life > 0
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
      // Settled on the sand after a crash, it stands on it rather than sitting in it.
      const y = state.phase === 'ready' ? START_Y + bob : restPose ? FLOOR_Y + SWIMMER_HEIGHT / 2 : state.y
      swimmer.position.set(PLAYER_X, swimmer.position.y + (y - swimmer.position.y) * (restPose ? Math.min(1, dt * 8) : 1), 0)
      const want = state.phase === 'ready' ? Math.sin(time * 2.2) * 0.08 : restPose ? 0 : Math.max(-0.55, Math.min(0.4, state.vy * 0.05))
      tilt += (want - tilt) * Math.min(1, dt * 10)
      // Turned to face the way it swims, the body leans about its own forward axis.
      swimmer.rotation.set(0, SWIM_YAW, 0)
      swimmer.rotateOnWorldAxis(Z_AXIS, tilt)
      if (state.phase === 'dead' && lastPhase !== 'dead') shake = 0.35
      // Down on the sand it stops swimming, stands and shrugs it off; a new run puts it back in the water.
      if (state.phase === 'dead' && state.vy === 0 && !restPose && character) {
        character.setSwim(false)
        character.setPose('shrug')
        restPose = true
      }
      if (state.phase !== 'dead' && restPose && character) {
        character.setPose('rest')
        character.setSwim(true)
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
      character?.stroke()
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
      if (options.reducedMotion) return
      const ring = rings[ringNext]
      ringNext = (ringNext + 1) % RINGS
      ring.life = 0.5
      ring.mesh.position.set(swimmer.position.x + 0.2, swimmer.position.y, 0.2)
      ring.mesh.visible = true
    },
    setBest(next) {
      best = next
    },
    resize,
    dispose() {
      disposed = true
      for (const t of loaded) t.dispose()
      canvas.removeEventListener('webglcontextlost', onLost)
      for (const node of columns.values()) {
        node.glow.removeFromParent()
        freeGroup(node.group)
      }
      columns.clear()
      bestMarker.dispose()
      glowGeo.dispose()
      glowTex.dispose()
      ringGeo.dispose()
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

