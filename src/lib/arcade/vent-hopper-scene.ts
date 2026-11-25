/**
 * Vent Hopper's picture: the player's own 3D character bouncing up a rock-walled vent shaft on
 * sponge pads, drifting pads, brittle plate coral and clam springs, past spiny urchins, with the
 * water lightening as it climbs toward the surface. Reads the sim state (vent-hopper-sim.ts) each
 * frame; owns nothing about the rules.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
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
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Material, Texture } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { buildCharacter, type Character3D } from '../avatar3d/character'
import { withLoftDetail } from '../avatar3d/loft'
import type { Avatar3DLook } from '../avatar3d/look'
import { bakedLightTexture } from '../avatar3d/stage-light'
import { FIELD_H, FIELD_W, HALF_W, HARDEST_AT, seededRandom, type HopperState, type Pad, type PadKind } from './vent-hopper-sim'
import { ROCK_COLORS, bubbleTexture, lumpy, rayTexture, tint, urchinGeometry } from './scene-kit'

export interface HopperSceneOptions {
  quality?: 'high' | 'low'
  /** Painted art (bucket URLs). Each is optional and loads in the background. */
  art?: { backdrop?: string; sponge?: string; coral?: string; rock?: string }
  reducedMotion?: boolean
  onContextLost?: () => void
}

export interface HopperScene {
  setLook: (look: Avatar3DLook) => void
  /** Draw the state as it is now. `dt` and `time` are seconds of real time, for idle motion. */
  draw: (state: HopperState, dt: number, time: number) => void
  /** Bounced off a pad of this kind. */
  bounce: (kind: PadKind) => void
  /** Brittle coral broke underfoot. */
  crack: () => void
  /** Touched an urchin. */
  hit: () => void
  /** The run is over. */
  fall: () => void
  /** A new run: back on the floor, ready to go. */
  reset: () => void
  resize: () => void
  dispose: () => void
}

/** How tall the climber is drawn, in field units (its hit box is a little shorter). */
const CLIMBER_HEIGHT = 1.15
/** Turned this far toward the way it steers, so the face still shows. */
const FACE_YAW = 0.55
/** Water from the deep floor of the vent to near the surface. */
const DEEP = new Color('#04121f')
const SHALLOW = new Color('#1c7aa0')
const FOG_DEEP = new Color('#071c2c')
const FOG_SHALLOW = new Color('#2a8db0')
/** Spacing and depth of the rocks lining the shaft. */
const WALL_STEP = 1.1
const WALL_ROCKS = 22

const SPONGE_COLORS = ['#f2b84b', '#f29b4b', '#e8c95a', '#f0a35e'].map((c) => new Color(c))
const DRIFT_COLORS = ['#3fc8b8', '#4fb0d8', '#47c79a'].map((c) => new Color(c))
const BRITTLE_COLOR = new Color('#f59ab5')

/** A puffy sponge cushion with a dimpled top, `w` across, its top at 0. */
function padGeometry(w: number, variant: number, colors: Color[]): BufferGeometry {
  const rand = seededRandom(Math.floor(variant * 1e9) + 11)
  const parts: BufferGeometry[] = []
  const body = lumpy(0.5, rand, 0.16)
  body.scale(w, 0.62, 0.95)
  body.translate(0, -0.28, 0)
  const color = colors[Math.floor(rand() * colors.length)]
  parts.push(tint(body.toNonIndexed(), color, rand, 0.1))
  body.dispose()
  // Pores: small dark dents on the top and front.
  const pore = color.clone().multiplyScalar(0.55)
  for (let i = 0; i < 9; i++) {
    const hole = new SphereGeometry(0.045 + rand() * 0.035, 6, 4)
    const a = rand() * Math.PI * 2
    const r = rand()
    hole.scale(1, 0.4, 1)
    hole.translate(Math.cos(a) * r * w * 0.4, -0.01, 0.1 + Math.sin(a) * r * 0.3)
    parts.push(tint(hole.toNonIndexed(), pore, rand, 0.05))
    hole.dispose()
  }
  const merged = mergeGeometries(parts)!
  for (const p of parts) p.dispose()
  merged.computeVertexNormals()
  return merged
}

/** A thin, faceted plate of coral, `w` across, its top at 0, in two halves that can fall apart. */
function plateHalves(w: number, variant: number): [BufferGeometry, BufferGeometry] {
  const rand = seededRandom(Math.floor(variant * 1e9) + 17)
  const half = (side: 1 | -1) => {
    const g = lumpy(0.5, rand, 0.2)
    g.scale(w / 2, 0.28, 0.9)
    g.translate((side * w) / 4, -0.12, 0)
    return tint(g.toNonIndexed(), BRITTLE_COLOR.clone().multiplyScalar(0.9 + rand() * 0.15), rand, 0.12)
  }
  return [half(-1), half(1)]
}

/** A clam: a ribbed lower shell holding a pearl, and a lid hinged at the back. */
function clamParts(variant: number) {
  const rand = seededRandom(Math.floor(variant * 1e9) + 23)
  const shell = (flip: boolean) => {
    const g = new SphereGeometry(0.55, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2)
    g.scale(1, flip ? 0.45 : 0.35, 0.8)
    if (!flip) g.rotateX(Math.PI)
    const pos = g.getAttribute('position')
    // Ribs fanning out from the hinge.
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const a = Math.atan2(x, z + 0.4)
      const k = 1 + 0.06 * Math.cos(a * 18)
      pos.setXYZ(i, x * k, pos.getY(i) * k, z * k)
    }
    g.computeVertexNormals()
    return tint(g.toNonIndexed(), new Color(flip ? '#c9b6e8' : '#b39ddb').multiplyScalar(0.9 + rand() * 0.2), rand, 0.08)
  }
  const lower = shell(false)
  lower.translate(0, 0, 0)
  const lid = shell(true)
  // Hinged at the back edge.
  lid.translate(0, 0, 0.44)
  return { lower, lid }
}

function labelTexture(): {
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
      ctx.fillStyle = 'rgba(220,245,255,0.85)'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 8, 34)
      texture.needsUpdate = true
    },
  }
}

export function createHopperScene(canvas: HTMLCanvasElement, options: HopperSceneOptions = {}): HopperScene {
  const low = options.quality === 'low'
  const renderer = new WebGLRenderer({ canvas, antialias: !low, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  const water = DEEP.clone()
  scene.background = water
  const fog = new Fog(FOG_DEEP.clone(), 20, 60)
  scene.fog = fog
  const pmrem = new PMREMGenerator(renderer)
  const baked = bakedLightTexture('cinematic')
  const env = pmrem.fromEquirectangular(baked)
  baked.dispose()
  pmrem.dispose()
  scene.environment = env.texture

  const camera = new PerspectiveCamera(30, FIELD_W / FIELD_H, 0.1, 120)
  const HALF_FOV = Math.tan((15 * Math.PI) / 180)
  let viewH = FIELD_H
  let distance = viewH / 2 / HALF_FOV

  const sun = new DirectionalLight(0xe8fbff, 2.2)
  sun.position.set(-3, 12, 9)
  scene.add(sun, new HemisphereLight(0x7fd6ff, 0x1b2a2a, 0.95))

  const rockMaterial = new MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.95,
    metalness: 0,
  })
  const spongeMaterial = new MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.85,
    metalness: 0,
  })
  // Drifting pads stay untextured so their colour reads apart from the plain sponges.
  const driftMaterial = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7, metalness: 0 })
  const coralMaterial = new MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.6,
    metalness: 0,
    transparent: true,
  })
  const shellMaterial = new MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.35,
    metalness: 0.1,
    side: DoubleSide,
  })
  const pearlMaterial = new MeshStandardMaterial({
    color: '#fff6ee',
    emissive: '#ffd9f2',
    emissiveIntensity: 0.5,
    roughness: 0.15,
    metalness: 0.2,
  })
  const urchinMaterial = new MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.55,
    metalness: 0.05,
  })
  const urchinGeo = urchinGeometry({ full: true })
  const pearlGeo = new SphereGeometry(0.13, 14, 10)

  const rand = seededRandom(20261125)

  // The vent shaft: rocks lining both sides, recycled as the climb goes on.
  const wallGeos = [0, 1, 2, 3].map((i) => tint(lumpy(0.6, rand, 0.3), ROCK_COLORS[i], rand, 0.14))
  const wall: { mesh: Mesh; side: 1 | -1; slot: number; jitter: number }[] = []
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < WALL_ROCKS; i++) {
      const mesh = new Mesh(wallGeos[Math.floor(rand() * wallGeos.length)], rockMaterial)
      const s = 0.9 + rand() * 0.8
      mesh.scale.set(s * 1.3, s, s)
      mesh.rotation.set(rand() * 3, rand() * 3, rand() * 3)
      scene.add(mesh)
      wall.push({ mesh, side, slot: i, jitter: rand() })
    }
  }

  // The vent floor at the start: sand, and a few chimneys breathing bubbles.
  const sand = new MeshStandardMaterial({
    color: '#3b3a35',
    roughness: 1,
    flatShading: true,
  })
  const floorGeo = new PlaneGeometry(FIELD_W + 1.6, 5, 16, 5)
  floorGeo.rotateX(-Math.PI / 2)
  floorGeo.translate(0, 0, -1.9)
  {
    const pos = floorGeo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getZ(i) < -1 ? (rand() - 0.3) * 0.25 : 0)
    floorGeo.computeVertexNormals()
  }
  const floor = new Group()
  floor.add(new Mesh(floorGeo, sand))
  // The bank under the sand's front edge, so a tall phone never sees past the floor.
  const bank = new Mesh(new PlaneGeometry(FIELD_W + 1.6, 12), new MeshBasicMaterial({ color: '#08141c' }))
  bank.position.set(0, -6, 0.6)
  floor.add(bank)
  scene.add(floor)
  const chimneys = new Group()
  for (const [x, h] of [
    [-3, 1.8],
    [2.4, 2.6],
    [3.6, 1.3],
  ] as const) {
    const g = lumpy(0.5, rand, 0.25)
    g.scale(0.7, h, 0.7)
    g.translate(x, h * 0.4, -4)
    chimneys.add(new Mesh(tint(g.toNonIndexed(), ROCK_COLORS[1].clone().multiplyScalar(0.55), rand, 0.2), rockMaterial))
    g.dispose()
  }
  scene.add(chimneys)

  const rayTex = rayTexture()
  const rays: Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const ray = new Mesh(
      new PlaneGeometry(1.4 + rand() * 1.2, 22),
      new MeshBasicMaterial({
        map: rayTex,
        transparent: true,
        opacity: 0.05,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    )
    ray.rotation.z = 0.18
    rays.push(ray)
    scene.add(ray)
  }

  // Bubbles rising on the vent current, kept around the view; and a burst under each bounce.
  const bubbleTex = bubbleTexture()
  const DRIFT = low ? 30 : 54
  const bubbleGeo = new BufferGeometry()
  const bubblePos = new Float32Array(DRIFT * 3)
  const bubbleVel = new Float32Array(DRIFT)
  for (let i = 0; i < DRIFT; i++) {
    bubblePos.set([(rand() - 0.5) * (FIELD_W + 2), rand() * 24, -0.5 - rand() * 3], i * 3)
    bubbleVel[i] = 0.6 + rand() * 1.2
  }
  bubbleGeo.setAttribute('position', new BufferAttribute(bubblePos, 3))
  const bubbleMaterial = new PointsMaterial({
    map: bubbleTex,
    size: 0.2,
    transparent: true,
    depthWrite: false,
    opacity: 0.7,
    fog: false,
  })
  scene.add(new Points(bubbleGeo, bubbleMaterial))

  const BURST = 24
  const burstGeo = new BufferGeometry()
  const burstPos = new Float32Array(BURST * 3).fill(-999)
  const burstVel = new Float32Array(BURST * 2)
  const burstLife = new Float32Array(BURST)
  burstGeo.setAttribute('position', new BufferAttribute(burstPos, 3))
  const burstMaterial = new PointsMaterial({
    map: bubbleTex,
    size: 0.16,
    transparent: true,
    depthWrite: false,
    opacity: 0.9,
    fog: false,
  })
  scene.add(new Points(burstGeo, burstMaterial))
  let feet = new Vector3()
  const burst = (count: number, spread: number) => {
    if (options.reducedMotion) return
    let made = 0
    for (let i = 0; i < BURST && made < count; i++) {
      if (burstLife[i] > 0) continue
      burstLife[i] = 0.4 + Math.random() * 0.3
      burstPos.set([feet.x + (Math.random() - 0.5) * 0.5, feet.y - 0.05, 0.3], i * 3)
      burstVel[i * 2] = (Math.random() - 0.5) * spread
      burstVel[i * 2 + 1] = -0.6 - Math.random() * 1.2
      made++
    }
  }

  // Height markers every 100 m: a faint line across the shaft and its number.
  const markers = [0, 1].map(() => {
    const label = labelTexture()
    const group = new Group()
    const line = new Mesh(
      new PlaneGeometry(FIELD_W, 0.03),
      new MeshBasicMaterial({
        color: '#bdefff',
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        fog: false,
      }),
    )
    const text = new Mesh(
      new PlaneGeometry(1.6, 0.4),
      new MeshBasicMaterial({
        map: label.texture,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    )
    text.position.set(-HALF_W + 0.85, 0.24, 0)
    group.add(line, text)
    group.position.z = -0.8
    scene.add(group)
    return { group, label, value: -1 }
  })

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
  load(options.art?.sponge, (t) => {
    t.wrapS = t.wrapT = RepeatWrapping
    spongeMaterial.map = t
    spongeMaterial.color.setScalar(2.2)
    spongeMaterial.needsUpdate = true
  })
  load(options.art?.coral, (t) => {
    t.wrapS = t.wrapT = RepeatWrapping
    coralMaterial.map = t
    coralMaterial.color.setScalar(1.6)
    coralMaterial.needsUpdate = true
  })
  load(options.art?.rock, (t) => {
    t.wrapS = t.wrapT = RepeatWrapping
    rockMaterial.map = t
    rockMaterial.color.setScalar(3.2)
    rockMaterial.needsUpdate = true
  })
  load(options.art?.backdrop, (t) => {
    t.wrapS = t.wrapT = RepeatWrapping
    const plane = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        map: t,
        transparent: true,
        opacity: 0.9,
        fog: false,
        depthWrite: false,
      }),
    )
    plane.renderOrder = -2
    backdrop = plane
    scene.add(plane)
  })

  // The climber.
  let character: Character3D | null = null
  const climber = new Group()
  scene.add(climber)
  let yaw = 0
  let spin = 0
  let wobble = 0
  let falling = false

  // Pads, built as they come into view and freed once they leave it.
  type PadNode = {
    group: Group
    geos: BufferGeometry[]
    halves?: Mesh[]
    lid?: Mesh
    brokeAt?: number
    openAt?: number
  }
  const pads = new Map<number, PadNode>()
  const urchins = new Map<number, Mesh>()
  let shake = 0

  const buildPad = (p: Pad): PadNode | null => {
    if (p.kind === 'floor') return null
    const group = new Group()
    const node: PadNode = { group, geos: [] }
    if (p.kind === 'sponge' || p.kind === 'drift') {
      const geo = padGeometry(p.w, p.variant, p.kind === 'drift' ? DRIFT_COLORS : SPONGE_COLORS)
      node.geos.push(geo)
      group.add(new Mesh(geo, p.kind === 'drift' ? driftMaterial : spongeMaterial))
    } else if (p.kind === 'brittle') {
      const [a, b] = plateHalves(p.w, p.variant)
      node.geos.push(a, b)
      node.halves = [new Mesh(a, coralMaterial.clone()), new Mesh(b, coralMaterial.clone())]
      group.add(...node.halves)
    } else {
      const { lower, lid } = clamParts(p.variant)
      node.geos.push(lower, lid)
      const lowerMesh = new Mesh(lower, shellMaterial)
      lowerMesh.position.y = -0.05
      const lidMesh = new Mesh(lid, shellMaterial)
      lidMesh.position.set(0, -0.05, -0.44)
      node.lid = lidMesh
      const pearl = new Mesh(pearlGeo, pearlMaterial)
      pearl.position.set(0, -0.02, 0.05)
      group.add(lowerMesh, lidMesh, pearl)
    }
    scene.add(group)
    pads.set(p.id, node)
    return node
  }

  const freePad = (id: number, node: PadNode) => {
    node.group.removeFromParent()
    for (const g of node.geos) g.dispose()
    for (const h of node.halves ?? []) (h.material as Material).dispose()
    pads.delete(id)
  }

  function placeBackdrop(camY: number) {
    if (!backdrop) return
    // Far behind and sized to fill the view, sliding slowly as the climb goes on.
    const back = 30
    const k = (distance + back) / distance
    const h = viewH * k * 1.05
    const w = Math.max(FIELD_W * k * 2.2, h * (camera.aspect || 1))
    backdrop.scale.set(w, h, 1)
    backdrop.position.set(0, camY + FIELD_H - viewH / 2, -back)
    const map = (backdrop.material as MeshBasicMaterial).map as Texture
    map.repeat.set(w / h, 1)
    map.offset.set(0.5 - w / h / 2, camY * 0.0025)
  }

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // The whole field shows: a wide screen fits its height (the component dims what lies either
    // side), a tall phone fits its width and shows a little more water below.
    viewH = Math.max(FIELD_H, FIELD_W / camera.aspect)
    distance = viewH / 2 / HALF_FOV
    fog.near = distance + 3
    fog.far = distance + 45
  }
  resize()

  const onLost = (event: Event) => {
    event.preventDefault()
    options.onContextLost?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)

  return {
    setLook(look) {
      if (character) {
        character.root.removeFromParent()
        character.dispose()
      }
      const built = low ? withLoftDetail(0.8, () => buildCharacter({ ...look, pose: 'rest' })) : buildCharacter({ ...look, pose: 'rest' })
      character = built
      built.root.scale.setScalar(CLIMBER_HEIGHT / built.height)
      built.root.traverse((node) => {
        const material = (node as Mesh).material as Material | Material[] | undefined
        for (const m of Array.isArray(material) ? material : material ? [material] : []) m.dithering = true
      })
      climber.add(built.root)
      built.bake(renderer, low ? { directions: 24, size: 384 } : undefined)
    },
    draw(state, dt, time) {
      const camY = state.camY
      const viewBottom = camY + FIELD_H - viewH
      const centerY = viewBottom + viewH / 2

      // The water lightens toward the surface.
      const up = Math.min(1, Math.max(0, camY / (HARDEST_AT * 1.4)))
      water.copy(DEEP).lerp(SHALLOW, up)
      fog.color.copy(FOG_DEEP).lerp(FOG_SHALLOW, up)
      for (const ray of rays) (ray.material as MeshBasicMaterial).opacity = 0.04 + 0.08 * up
      // The painting darkens with depth too.
      if (backdrop) (backdrop.material as MeshBasicMaterial).color.setScalar(0.3 + 0.7 * up)

      // Pads: build new ones, move them, crack and open them, free the ones left behind.
      const live = new Set<number>()
      for (const p of state.pads) {
        live.add(p.id)
        let node = pads.get(p.id)
        if (!node) {
          if (p.kind === 'floor') continue
          node = buildPad(p) ?? undefined
          if (!node) continue
        }
        node.group.position.set(p.x, p.y, 0)
        if (p.kind === 'drift' && !options.reducedMotion) node.group.rotation.z = Math.sin(time * 2 + p.variant * 9) * 0.04
        if (node.halves) {
          if (p.broken && node.brokeAt === undefined) node.brokeAt = time
          if (node.brokeAt !== undefined) {
            // The halves split, tip away from each other and sink as they fade.
            const t = time - node.brokeAt
            node.halves.forEach((h, i) => {
              const s = i === 0 ? -1 : 1
              h.position.set(s * t * 0.8, -t * t * 6, 0)
              h.rotation.z = -s * t * 2.2
              ;(h.material as MeshStandardMaterial).opacity = Math.max(0, 1 - t * 1.6)
            })
          }
        }
        if (node.lid) {
          // Clams breathe a little, and snap wide open when bounced on.
          const opened = node.openAt === undefined ? 0 : Math.max(0, 1 - (time - node.openAt) / 0.5)
          const idle = options.reducedMotion ? 0.15 : 0.12 + 0.06 * Math.sin(time * 2.5 + p.variant * 7)
          node.lid.rotation.x = -(idle + 0.9 * Math.sin(opened * Math.PI * 0.5))
        }
      }
      for (const [id, node] of pads) if (!live.has(id)) freePad(id, node)

      // Urchins turn slowly as they drift.
      const liveUrchins = new Set<number>()
      for (const u of state.urchins) {
        liveUrchins.add(u.id)
        let mesh = urchins.get(u.id)
        if (!mesh) {
          mesh = new Mesh(urchinGeo, urchinMaterial)
          mesh.scale.setScalar((u.r / 0.34) * 1.25)
          scene.add(mesh)
          urchins.set(u.id, mesh)
        }
        mesh.position.set(u.x, u.y + (options.reducedMotion ? 0 : Math.sin(time * 1.6 + u.variant * 8) * 0.04), 0)
        mesh.rotation.set(time * 0.3 + u.variant * 5, time * 0.5 * Math.sign(u.vx), 0)
      }
      for (const [id, mesh] of urchins) {
        if (liveUrchins.has(id)) continue
        mesh.removeFromParent()
        urchins.delete(id)
      }

      // The shaft walls: each rock keeps its slot as the view climbs.
      const span = WALL_ROCKS * WALL_STEP
      for (const r of wall) {
        let y = r.slot * WALL_STEP + r.jitter * 0.4
        y = viewBottom - 2 + ((((y - (viewBottom - 2)) % span) + span) % span)
        r.mesh.position.set(r.side * (HALF_W + 0.55 + r.jitter * 0.5), y, -0.6 - r.jitter * 0.8)
      }
      floor.visible = chimneys.visible = viewBottom < 3
      for (const [i, ray] of rays.entries()) {
        ray.position.set(-3.5 + i * 2.6, centerY + 6, -5)
        ray.rotation.z = 0.18 + Math.sin(time * 0.3 + i) * 0.04
      }

      // Markers at the next hundreds in view.
      const firstHundred = Math.max(1, Math.ceil(viewBottom / 100))
      markers.forEach((m, i) => {
        const value = (firstHundred + i) * 100
        m.group.visible = value < viewBottom + viewH + 1
        if (m.value !== value) {
          m.value = value
          m.label.set(`${value} m`)
        }
        m.group.position.y = value
      })

      // Bubbles rise through the view and come back round below it.
      const bpos = bubbleGeo.getAttribute('position') as BufferAttribute
      for (let i = 0; i < DRIFT; i++) {
        let y = bpos.getY(i) + bubbleVel[i] * dt
        if (y > viewBottom + viewH + 1) y = viewBottom - 1 - Math.random() * 2
        if (y < viewBottom - 3) y = viewBottom - 1 + Math.random() * viewH
        bpos.setY(i, y)
      }
      bpos.needsUpdate = true
      for (let i = 0; i < BURST; i++) {
        if (burstLife[i] <= 0) continue
        burstLife[i] -= dt
        burstVel[i * 2 + 1] += 3.2 * dt
        burstPos[i * 3] += burstVel[i * 2] * dt
        burstPos[i * 3 + 1] += burstVel[i * 2 + 1] * dt
        if (burstLife[i] <= 0) burstPos[i * 3 + 1] = -999
      }
      ;(burstGeo.getAttribute('position') as BufferAttribute).needsUpdate = true

      // The climber: turned toward where it steers, spun by clams, flailing when it drops away.
      const wantFall = state.phase === 'dead' || (state.vy < -11 && state.knocked === 0)
      if (character) {
        if (wantFall !== falling) {
          falling = wantFall
          character.setFall(falling)
        }
        character.update(dt, time, !options.reducedMotion)
      }
      const turn = Math.max(-1, Math.min(1, state.vx / 6))
      yaw += (turn * FACE_YAW - yaw) * Math.min(1, dt * 8)
      if (spin > 0) spin = Math.max(0, spin - dt * Math.PI * 2 * 1.6)
      wobble += ((state.knocked > 0 ? 1 : 0) - wobble) * Math.min(1, dt * 10)
      climber.position.set(state.x, state.y, 0.25)
      climber.rotation.set(0, yaw + spin, wobble * Math.sin(time * 30) * 0.35)
      feet = climber.position

      // The camera follows the sim's view, with a shake on a knock.
      if (backdrop) placeBackdrop(camY)
      let cx = 0
      let cy = centerY
      if (shake > 0 && !options.reducedMotion) {
        shake = Math.max(0, shake - dt)
        cx = Math.sin(time * 70) * shake * 0.3
        cy += Math.cos(time * 63) * shake * 0.3
      }
      camera.position.set(cx, cy, distance)
      camera.lookAt(cx, cy, 0)
      renderer.render(scene, camera)
    },
    bounce(kind) {
      if (kind === 'clam') {
        character?.bounce(2.4)
        if (!options.reducedMotion) spin = Math.PI * 2
        burst(10, 2.2)
      } else {
        character?.bounce(kind === 'floor' ? 1.2 : 1)
        burst(5, 1.2)
      }
      // Open the clam that was bounced on (the one right under the feet).
      if (kind === 'clam') {
        for (const node of pads.values()) {
          if (!node.lid) continue
          const p = node.group.position
          if (Math.abs(p.y - feet.y) < 0.05 && Math.abs(p.x - feet.x) < 1.2) node.openAt = performance.now() / 1000
        }
      }
    },
    crack() {
      burst(8, 2)
    },
    hit() {
      character?.tumble()
      shake = 0.25
    },
    fall() {
      falling = true
      character?.setFall(true)
    },
    reset() {
      spin = 0
      wobble = 0
      yaw = 0
      falling = false
      for (const [id, node] of pads) freePad(id, node)
      for (const mesh of urchins.values()) mesh.removeFromParent()
      urchins.clear()
      character?.setFall(false)
      character?.setPose('rest')
    },
    resize,
    dispose() {
      disposed = true
      for (const t of loaded) t.dispose()
      canvas.removeEventListener('webglcontextlost', onLost)
      character?.dispose()
      for (const [id, node] of pads) freePad(id, node)
      for (const m of markers) m.label.texture.dispose()
      scene.traverse((node) => {
        const mesh = node as Mesh
        if (!(mesh.isMesh || (node as Points).isPoints)) return
        if (mesh.geometry !== urchinGeo && mesh.geometry !== pearlGeo && !wallGeos.includes(mesh.geometry)) mesh.geometry?.dispose()
        const material = mesh.material as Material | Material[]
        for (const m of Array.isArray(material) ? material : [material]) m?.dispose()
      })
      urchinGeo.dispose()
      pearlGeo.dispose()
      for (const g of wallGeos) g.dispose()
      for (const m of [rockMaterial, spongeMaterial, driftMaterial, coralMaterial, shellMaterial, pearlMaterial, urchinMaterial, sand, bubbleMaterial, burstMaterial]) m.dispose()
      rayTex.dispose()
      bubbleTex.dispose()
      env.dispose()
      renderer.dispose()
    },
  }
}
