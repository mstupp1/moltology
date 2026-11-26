/**
 * Current Runner's picture: the player's own 3D character running the seafloor past urchins,
 * coral and jellyfish, with sand, kelp and far ridges scrolling at their own speeds and light from
 * the surface. Reads the sim state (current-runner-sim.ts) each frame; owns nothing about the rules.
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
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Material, Object3D, Texture } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { buildCharacter, type Character3D } from '../avatar3d/character'
import { withLoftDetail } from '../avatar3d/loft'
import type { Avatar3DLook } from '../avatar3d/look'
import { bakedLightTexture } from '../avatar3d/stage-light'
import { FIELD_H, FIELD_W, PLAYER_X, SPEED_MAX, SPEED_START, seededRandom, type Obstacle, type RunnerState } from './current-runner-sim'
import { CORAL_COLORS, ROCK_COLORS, bubbleTexture, createBestMarker, lumpy, rayTexture, ridge, tint, urchinGeometry } from './scene-kit'

export interface RunnerSceneOptions {
  quality?: 'high' | 'low'
  /** Painted art (bucket URLs). Each is optional and loads in the background. */
  art?: { backdrop?: string; sand?: string; rock?: string }
  reducedMotion?: boolean
  onContextLost?: () => void
}

export interface RunnerScene {
  setLook: (look: Avatar3DLook) => void
  /** Draw the state as it is now. `dt` and `time` are seconds of real time, for idle motion. */
  draw: (state: RunnerState, dt: number, time: number) => void
  jump: () => void
  land: () => void
  crash: () => void
  /** A new run: back on its feet, ready to go. */
  reset: () => void
  /** The player's best so far, in metres: a gold post stands on the sand there. */
  setBest: (best: number) => void
  resize: () => void
  dispose: () => void
}

/** How tall the runner is drawn, in field units (its hit box is PLAYER_H). */
const RUNNER_HEIGHT = 1.55
/** Turned most of the way toward where it runs, so the face still shows. */
const RUN_YAW = 1.05
/** On a screen narrower than the field, how much sand still shows behind the runner. */
const BEHIND_ON_PHONE = 1.1
/** The view's lowest point below the sand, when the screen is no taller than the field. */
const VIEW_BELOW = 1.2
/** How far back the sand reaches (its far edge), in field units. */
const SAND_FAR = 6
const FOG = new Color('#0a3248')
const Z_AXIS = new Vector3(0, 0, 1)

function waterTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#1d7394')
  g.addColorStop(0.5, '#0c3d58')
  g.addColorStop(1, '#05182a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Branching coral on a small rock, about `height` tall. */
function coralGeometry(height: number, variant: number): BufferGeometry {
  const rand = seededRandom(Math.floor(variant * 1e9) + 5)
  const parts: BufferGeometry[] = []
  const base = lumpy(0.3, rand, 0.3)
  base.scale(1.1, 0.55, 0.9)
  base.translate(0, 0.08, 0)
  parts.push(tint(base.toNonIndexed(), ROCK_COLORS[Math.floor(rand() * ROCK_COLORS.length)], rand, 0.14))
  base.dispose()
  const color = CORAL_COLORS[Math.floor(rand() * CORAL_COLORS.length)]
  const grow = (x: number, y: number, len: number, lean: number, depth: number) => {
    const stem = new CylinderGeometry(0.035 + 0.02 * depth, 0.05 + 0.025 * depth, len, 6)
    stem.translate(0, len / 2, 0)
    stem.rotateZ(lean)
    stem.rotateY(rand() * Math.PI)
    stem.translate(x, y, 0)
    parts.push(tint(stem.toNonIndexed(), color, rand, 0.1))
    stem.dispose()
    const tx = x - Math.sin(lean) * len
    const ty = y + Math.cos(lean) * len
    if (depth > 0) {
      grow(tx, ty, len * 0.62, lean + 0.45 + rand() * 0.2, depth - 1)
      grow(tx, ty, len * 0.62, lean - 0.45 - rand() * 0.2, depth - 1)
    } else {
      const tip = new SphereGeometry(0.06, 6, 4)
      tip.translate(tx, ty, 0)
      parts.push(tint(tip.toNonIndexed(), color.clone().multiplyScalar(1.2), rand, 0.06))
      tip.dispose()
    }
  }
  grow(0, 0.12, height * 0.42, (rand() - 0.5) * 0.2, 2)
  const merged = mergeGeometries(parts)!
  for (const p of parts) p.dispose()
  merged.computeVertexNormals()
  return merged
}

interface Jelly {
  group: Group
  bell: Mesh
  tentacles: Mesh
  base: Float32Array
}

function buildJelly(materials: { bell: Material; tentacle: Material }, variant: number): Jelly {
  const group = new Group()
  const bellGeo = new SphereGeometry(0.4, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)
  bellGeo.scale(1, 0.85, 1)
  const bell = new Mesh(bellGeo, materials.bell)
  bell.position.y = 0.35
  group.add(bell)
  // Tentacles: thin ribbons hanging from the rim that sway.
  const rand = seededRandom(Math.floor(variant * 1e9) + 3)
  const ribbons: BufferGeometry[] = []
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rand() * 0.3
    const len = 0.45 + rand() * 0.3
    const ribbon = new PlaneGeometry(0.05, len, 1, 6)
    ribbon.translate(0, -len / 2, 0)
    ribbon.rotateY(a)
    ribbon.translate(Math.cos(a) * 0.26, 0.36, Math.sin(a) * 0.26)
    ribbons.push(ribbon)
  }
  const tentGeo = mergeGeometries(ribbons)!
  for (const r of ribbons) r.dispose()
  const tentacles = new Mesh(tentGeo, materials.tentacle)
  group.add(tentacles)
  return { group, bell, tentacles, base: Float32Array.from(tentGeo.getAttribute('position').array as Float32Array) }
}

function shadowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31)
  g.addColorStop(0, 'rgba(10,20,25,0.9)')
  g.addColorStop(1, 'rgba(10,20,25,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new CanvasTexture(canvas)
}

function seabedTile(width: number, rand: () => number, material: Material): Mesh {
  const geo = new PlaneGeometry(width, 40, 48, 10)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, 14)
  const pos = geo.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    // Flat where the runner runs; gentle dunes behind it, matching at the tile edges.
    const behind = Math.max(0, Math.min(1, (-z - 0.8) / 2))
    const dune = (Math.sin((x / width) * Math.PI * 4) * 0.2 + Math.sin((x / width) * Math.PI * 10 + 1) * 0.08) * behind
    pos.setY(i, dune + (z < -2 ? (rand() - 0.5) * 0.12 : 0))
  }
  geo.computeVertexNormals()
  return new Mesh(geo, material)
}

export function createRunnerScene(canvas: HTMLCanvasElement, options: RunnerSceneOptions = {}): RunnerScene {
  const low = options.quality === 'low'
  const renderer = new WebGLRenderer({ canvas, antialias: !low, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  const water = waterTexture()
  scene.background = water
  scene.fog = new Fog(FOG, 20, 50)
  const pmrem = new PMREMGenerator(renderer)
  const baked = bakedLightTexture('cinematic')
  const env = pmrem.fromEquirectangular(baked)
  baked.dispose()
  pmrem.dispose()
  scene.environment = env.texture

  const camera = new PerspectiveCamera(30, FIELD_W / FIELD_H, 0.1, 90)
  const HALF_FOV = Math.tan((15 * Math.PI) / 180)
  let distance = FIELD_H / 2 / HALF_FOV
  let centerY = FIELD_H / 2 - VIEW_BELOW
  let centerX = 0

  const sun = new DirectionalLight(0xe8fbff, 2.3)
  sun.position.set(-4, 12, 9)
  scene.add(sun, new HemisphereLight(0x7fd6ff, 0x1b2a2a, 0.95))

  const rockMaterial = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 })
  const coralMaterial = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7, metalness: 0 })
  const urchinMaterial = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55, metalness: 0.05 })
  const jellyMaterials = {
    bell: new MeshStandardMaterial({
      color: '#f29bd8',
      emissive: '#b8459a',
      emissiveIntensity: 0.55,
      roughness: 0.25,
      transparent: true,
      opacity: 0.78,
      side: DoubleSide,
      depthWrite: false,
    }),
    tentacle: new MeshBasicMaterial({ color: '#f7b9e6', transparent: true, opacity: 0.55, side: DoubleSide, depthWrite: false }),
  }
  // Soft contact shadows under the runner and each obstacle, so heights read at a glance.
  const shadowTex = shadowTexture()
  const shadowMaterial = new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55, fog: false })
  const shadowGeo = new PlaneGeometry(1, 1)
  shadowGeo.rotateX(-Math.PI / 2)
  const blob = (width: number, opacity = 1) => {
    const material = opacity === 1 ? shadowMaterial : shadowMaterial.clone()
    if (opacity !== 1) material.opacity = 0.55 * opacity
    const mesh = new Mesh(shadowGeo, material)
    mesh.scale.set(width, 1, width * 0.45)
    mesh.position.y = 0.015
    mesh.renderOrder = 1
    return mesh
  }
  const runnerShadow = blob(1.1)
  scene.add(runnerShadow)
  const urchinGeo = urchinGeometry()
  const coralGeos = [0.13, 0.47, 0.81].map((v) => coralGeometry(1.15, v))

  const rand = seededRandom(20261124)
  const far = new Group()
  const farTiles = [0, 1].map(() => ridge(34, 3.5, rand, new Color('#0b2a3c'), -18))
  const mid = new Group()
  const midTiles = [0, 1].map(() => ridge(34, 2.4, rand, new Color('#0e3448'), -9))
  for (const t of farTiles) far.add(t)
  for (const t of midTiles) mid.add(t)
  scene.add(far, mid)

  const sand = new MeshStandardMaterial({ color: '#7a6a4f', roughness: 1, flatShading: true })
  const bedTiles = [0, 1].map(() => seabedTile(26, rand, sand))
  // A few sandy pebbles well behind the running line, so nothing reads as an obstacle that is not one.
  const pebbleColor = new Color('#8a7c62')
  for (const tile of bedTiles) {
    for (let i = 0; i < 10; i++) {
      const pebble = new Mesh(tint(lumpy(0.06 + rand() * 0.1, rand, 0.3), pebbleColor, rand, 0.2), rockMaterial)
      pebble.position.set((rand() - 0.5) * 26, 0.01, -2.6 - rand() * 3)
      tile.add(pebble)
    }
  }
  scene.add(...bedTiles)

  // Kelp swaying behind the running line, drifting past a little slower than the sand.
  const kelpMaterial = new MeshStandardMaterial({ color: '#1f5a45', roughness: 0.9, side: DoubleSide, transparent: true, opacity: 0.75 })
  const kelp: { mesh: Mesh; base: Float32Array; x: number; phase: number }[] = []
  for (let i = 0; i < 10; i++) {
    const h = 2 + rand() * 3.5
    const geo = new PlaneGeometry(0.32, h, 1, 10)
    geo.translate(0, h / 2, 0)
    const blade = geo.getAttribute('position')
    for (let v = 0; v < blade.count; v++) blade.setX(v, blade.getX(v) * (1 - (blade.getY(v) / h) * 0.85))
    const mesh = new Mesh(geo, kelpMaterial)
    const x = (i / 10) * 30 - 15 + rand()
    mesh.position.set(x, -0.05, -3.5 - rand() * 3)
    scene.add(mesh)
    kelp.push({ mesh, base: Float32Array.from(blade.array as Float32Array), x, phase: rand() * 6 })
  }

  const rayTex = rayTexture()
  const rays: Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const ray = new Mesh(
      new PlaneGeometry(1.4 + rand() * 1.4, 16),
      new MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0.06 + rand() * 0.05, blending: AdditiveBlending, depthWrite: false, fog: false }),
    )
    ray.position.set(-8 + i * 4 + rand(), 8, -6)
    ray.rotation.z = 0.25
    rays.push(ray)
    scene.add(ray)
  }

  // Drifting bubbles, and sand kicked up on each landing.
  const bubbleTex = bubbleTexture()
  const DRIFT = low ? 26 : 44
  const bubbleGeo = new BufferGeometry()
  const bubblePos = new Float32Array(DRIFT * 3)
  const bubbleVel = new Float32Array(DRIFT)
  for (let i = 0; i < DRIFT; i++) {
    bubblePos.set([(rand() - 0.5) * 22, rand() * 10, -1 - rand() * 4], i * 3)
    bubbleVel[i] = 0.4 + rand() * 0.8
  }
  bubbleGeo.setAttribute('position', new BufferAttribute(bubblePos, 3))
  const bubbles = new Points(bubbleGeo, new PointsMaterial({ map: bubbleTex, size: 0.2, transparent: true, depthWrite: false, opacity: 0.75, fog: false }))
  scene.add(bubbles)

  const PUFF = 18
  const puffGeo = new BufferGeometry()
  const puffPos = new Float32Array(PUFF * 3).fill(-50)
  const puffVel = new Float32Array(PUFF * 2)
  const puffLife = new Float32Array(PUFF)
  puffGeo.setAttribute('position', new BufferAttribute(puffPos, 3))
  const puffMaterial = new PointsMaterial({ color: '#c9b893', size: 0.1, transparent: true, opacity: 0.8, depthWrite: false })
  scene.add(new Points(puffGeo, puffMaterial))
  const kickSand = (count: number, spread: number) => {
    if (options.reducedMotion) return
    let made = 0
    for (let i = 0; i < PUFF && made < count; i++) {
      if (puffLife[i] > 0) continue
      puffLife[i] = 0.35 + Math.random() * 0.25
      puffPos.set([PLAYER_X + (Math.random() - 0.5) * 0.4, 0.05, 0.2 + (Math.random() - 0.5) * 0.4], i * 3)
      puffVel[i * 2] = -(0.5 + Math.random() * spread)
      puffVel[i * 2 + 1] = 0.8 + Math.random() * 1.2
      made++
    }
  }

  // A gold post on the sand at the player's best distance.
  const bestMarker = createBestMarker('post', 3.2)
  bestMarker.group.visible = false
  bestMarker.group.position.z = -0.6
  scene.add(bestMarker.group)
  let best = 0
  let footfall = 0

  // Streaks of current rushing past once the run gets fast.
  const STREAKS = low ? 10 : 18
  const streakGeo = new PlaneGeometry(1, 0.025)
  const streakMaterial = new MeshBasicMaterial({ color: '#d9f6ff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, fog: false })
  const streaks = Array.from({ length: STREAKS }, (_, i) => {
    const mesh = new Mesh(streakGeo, streakMaterial)
    mesh.position.set(-10 + (i / STREAKS) * 20 + Math.random() * 2, 0.4 + Math.random() * 4.6, -0.5 - Math.random() * 3)
    mesh.scale.x = 0.8 + Math.random() * 1.6
    scene.add(mesh)
    return { mesh, rate: 1.4 + Math.random() * 0.8 }
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
  load(options.art?.sand, (t) => {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(5, 8)
    sand.map = t
    sand.color.set('#d8c9aa')
    sand.needsUpdate = true
  })
  load(options.art?.rock, (t) => {
    t.wrapS = t.wrapT = RepeatWrapping
    rockMaterial.map = t
    rockMaterial.color.setScalar(3.2)
    rockMaterial.needsUpdate = true
  })
  load(options.art?.backdrop, (t) => {
    t.wrapS = RepeatWrapping
    // Dimmed a little so the painting stays behind the play pieces.
    const plane = new Mesh(new PlaneGeometry(96, 32), new MeshBasicMaterial({ map: t, color: new Color(0.82, 0.82, 0.82), fog: false, depthWrite: false }))
    plane.renderOrder = -2
    backdrop = plane
    placeBackdrop()
    scene.add(plane)
    // The painting has its own reef and arches; the drawn ridges would only flatten it.
    far.visible = false
    mid.visible = false
  })

  let character: Character3D | null = null
  const runner = new Group()
  runner.rotation.y = RUN_YAW
  scene.add(runner)
  let running = false
  let knock = 0

  const obstacles = new Map<number, { node: Object3D; jelly?: Jelly }>()
  let shake = 0

  const buildObstacle = (o: Obstacle) => {
    const group = new Group()
    let jelly: Jelly | undefined
    if (o.kind === 'urchin' || o.kind === 'urchins') {
      for (let i = 0; i < o.count; i++) {
        const mesh = new Mesh(urchinGeo, urchinMaterial)
        const s = 1.25 + ((o.variant * 7 + i * 0.37) % 1) * 0.25
        mesh.scale.setScalar(s)
        mesh.rotation.y = o.variant * 6 + i
        mesh.position.x = (i - (o.count - 1) / 2) * (o.w / o.count)
        group.add(mesh)
      }
    } else if (o.kind === 'coral') {
      group.add(new Mesh(coralGeos[Math.floor(o.variant * coralGeos.length)], coralMaterial))
    } else {
      jelly = buildJelly(jellyMaterials, o.variant)
      group.add(jelly.group)
    }
    group.position.y = o.y
    // Its shadow sits on the sand, fainter under a floating jelly.
    const shadow = blob(o.w + 0.25, o.y > 0 ? 0.5 : 1)
    shadow.position.y = 0.015 - o.y
    group.add(shadow)
    scene.add(group)
    obstacles.set(o.id, { node: group, jelly })
  }

  function placeBackdrop() {
    if (!backdrop) return
    // Far behind and sized to fill the view at any camera distance. The painting's horizon (a
    // quarter of the way up) sits a little above where the far edge of the sand meets the water.
    const back = 34
    const k = (distance + back) / (FIELD_H / 2 / HALF_FOV + back)
    const sandEdge = centerY - (centerY * (distance + back)) / (distance + SAND_FAR)
    backdrop.scale.set(k, k, 1)
    backdrop.position.set(0, sandEdge + 1.5 * k + 8 * k, -back)
  }

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // The whole field always shows, so no one sees further ahead. On a tall screen the camera backs
    // off until the width fits and keeps the sand in the lower third, showing more water above.
    // A tall phone is short of width, so it gives up a little of the sand behind the runner (never
    // any of the way ahead) for a bigger runner, and keeps the sand low with water and art above.
    const narrow = camera.aspect < FIELD_W / FIELD_H
    const left = narrow ? PLAYER_X - BEHIND_ON_PHONE : -FIELD_W / 2
    const viewW = FIELD_W / 2 - left
    centerX = narrow ? (FIELD_W / 2 + left) / 2 : 0
    const viewH = Math.max(FIELD_H, viewW / camera.aspect)
    distance = viewH / 2 / HALF_FOV
    centerY = Math.max(FIELD_H / 2 - VIEW_BELOW, viewH * (narrow ? 0.26 : 0.17))
    if (scene.fog instanceof Fog) {
      scene.fog.near = distance + 4
      scene.fog.far = distance + 34
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
      built.root.scale.setScalar(RUNNER_HEIGHT / built.height)
      built.root.traverse((node) => {
        const material = (node as Mesh).material as Material | Material[] | undefined
        for (const m of Array.isArray(material) ? material : material ? [material] : []) m.dithering = true
      })
      runner.add(built.root)
      built.bake(renderer, low ? { directions: 24, size: 384 } : undefined)
      running = false
    },
    draw(state, dt, time) {
      // Obstacles: build new ones, move them, free the ones left behind.
      const live = new Set<number>()
      for (const o of state.obstacles) {
        live.add(o.id)
        if (!obstacles.has(o.id)) buildObstacle(o)
        const entry = obstacles.get(o.id)!
        entry.node.position.x = o.x
        if (entry.jelly && !options.reducedMotion) {
          // Bells pulse and tentacles trail; the hit box stays put.
          const pulse = Math.sin(time * 4 + o.variant * 9)
          entry.jelly.bell.scale.set(1 + 0.06 * pulse, 1 - 0.08 * pulse, 1 + 0.06 * pulse)
          entry.jelly.group.position.y = 0.04 * Math.sin(time * 2 + o.variant * 5)
          const pos = entry.jelly.tentacles.geometry.getAttribute('position') as BufferAttribute
          for (let i = 0; i < pos.count; i++) {
            const y = entry.jelly.base[i * 3 + 1]
            const hang = Math.max(0, 0.36 - y)
            pos.setX(i, entry.jelly.base[i * 3] + Math.sin(time * 5 + y * 6 + o.variant * 4) * 0.08 * hang + hang * 0.15)
          }
          pos.needsUpdate = true
        }
      }
      for (const [id, entry] of obstacles) {
        if (live.has(id)) continue
        entry.node.removeFromParent()
        if (entry.jelly) {
          entry.jelly.bell.geometry.dispose()
          entry.jelly.tentacles.geometry.dispose()
        }
        entry.node.traverse((n) => {
          const m = (n as Mesh).material
          if (m && m !== shadowMaterial && (n as Mesh).geometry === shadowGeo) (m as Material).dispose()
        })
        obstacles.delete(id)
      }

      wrap(bedTiles, 26, state.distance)
      wrap(midTiles, 34, state.distance * 0.35)
      wrap(farTiles, 34, state.distance * 0.12)
      if (backdrop) ((backdrop.material as MeshBasicMaterial).map as Texture).offset.x = (state.distance * 0.004) % 1
      for (const k of kelp) {
        let x = k.x - state.distance * 0.8
        x = ((((x + 15) % 30) + 30) % 30) - 15
        k.mesh.position.x = x
        if (!options.reducedMotion) {
          const pos = k.mesh.geometry.getAttribute('position') as BufferAttribute
          for (let i = 0; i < pos.count; i++) {
            const y = k.base[i * 3 + 1]
            pos.setX(i, k.base[i * 3] + Math.sin(time * 1.3 + k.phase + y * 0.6) * 0.04 * y)
          }
          pos.needsUpdate = true
        }
      }
      for (const [i, ray] of rays.entries()) ray.rotation.z = 0.25 + Math.sin(time * 0.3 + i) * 0.04

      const playing = state.phase === 'playing'
      const bpos = bubbleGeo.getAttribute('position') as BufferAttribute
      for (let i = 0; i < DRIFT; i++) {
        let y = bpos.getY(i) + bubbleVel[i] * dt
        let x = bpos.getX(i) - (playing ? state.speed * dt * 0.5 : 0)
        if (y > 11) y = -0.5
        if (x < -11) x += 22
        bpos.setXY(i, x, y)
      }
      bpos.needsUpdate = true
      for (let i = 0; i < PUFF; i++) {
        if (puffLife[i] <= 0) continue
        puffLife[i] -= dt
        puffVel[i * 2 + 1] -= 4 * dt
        puffPos[i * 3] += puffVel[i * 2] * dt - (playing ? state.speed * dt * 0.3 : 0)
        puffPos[i * 3 + 1] = Math.max(0, puffPos[i * 3 + 1] + puffVel[i * 2 + 1] * dt)
        if (puffLife[i] <= 0) puffPos[i * 3 + 1] = -50
      }
      ;(puffGeo.getAttribute('position') as BufferAttribute).needsUpdate = true

      // The best post rides the sand; it flares as the runner passes it.
      const toBest = best - state.distance
      bestMarker.group.visible = best > 0 && toBest > -FIELD_W && toBest < FIELD_W
      bestMarker.group.position.x = PLAYER_X + toBest
      if (state.phase === 'ready') bestMarker.reset()
      else if (best > 0 && toBest <= 0) bestMarker.pass()
      bestMarker.update(dt, time)

      // Fast current: streaks rush past, brighter the faster it goes.
      const rush = playing && !options.reducedMotion ? Math.max(0, (state.speed - 8) / (SPEED_MAX - 8)) : 0
      streakMaterial.opacity += (rush * 0.25 - streakMaterial.opacity) * Math.min(1, dt * 3)
      for (const st of streaks) {
        st.mesh.visible = streakMaterial.opacity > 0.01
        if (!st.mesh.visible) continue
        st.mesh.position.x -= state.speed * st.rate * dt
        if (st.mesh.position.x < -11) {
          st.mesh.position.x = 11 + Math.random() * 3
          st.mesh.position.y = 0.4 + Math.random() * 4.6
        }
      }

      // Sand kicks up from the runner's feet as it runs, more often the faster it goes.
      if (playing && state.grounded && !state.ducking) {
        footfall -= dt * (state.speed / SPEED_START)
        if (footfall <= 0) {
          footfall = 0.16
          kickSand(1, 0.5 + state.speed * 0.04)
        }
      }

      // The runner: waits at the ready, runs faster as the current picks up, ducks, leaps.
      if (character) {
        if (playing && !running) {
          running = true
          character.setRun(true, 1)
        }
        if (playing) character.setRun(true, 1 + (state.speed - SPEED_START) / (SPEED_MAX - SPEED_START))
        character.setDuck(playing && state.ducking)
        character.update(dt, time, !options.reducedMotion)
      }
      // Knocked back on a crash: it tips over backwards while in the air and sits up once down.
      const wantKnock = state.phase === 'dead' ? (state.grounded ? 0.18 : 0.7) : 0
      knock += (wantKnock - knock) * Math.min(1, dt * (state.phase === 'dead' && !state.grounded ? 14 : 6))
      runner.position.set(PLAYER_X - knock * 0.25, state.y, 0)
      runner.rotation.set(0, RUN_YAW, 0)
      runner.rotateOnWorldAxis(Z_AXIS, knock)
      // Squashed a touch when ducked, for a clearer silhouette.
      runner.scale.set(1, state.ducking ? 0.82 : 1, 1)
      // The shadow stays on the sand and shrinks as the runner rises.
      const lift = Math.max(0, 1 - state.y / 3)
      runnerShadow.position.set(runner.position.x, 0.015, 0)
      runnerShadow.scale.set(1.1 * (0.5 + 0.5 * lift), 1, 0.5 * (0.5 + 0.5 * lift))

      if (shake > 0 && !options.reducedMotion) {
        shake = Math.max(0, shake - dt)
        const s = shake * 0.3
        camera.position.set(centerX + Math.sin(time * 70) * s, centerY + Math.cos(time * 63) * s, distance)
      } else camera.position.set(centerX, centerY, distance)
      camera.lookAt(camera.position.x, centerY, 0)
      renderer.render(scene, camera)
    },
    jump() {
      character?.leap()
      kickSand(4, 0.6)
    },
    land() {
      character?.land()
      kickSand(7, 1.2)
    },
    crash() {
      character?.tumble()
      running = false
      shake = 0.3
      kickSand(10, 1.5)
    },
    setBest(next) {
      best = next
    },
    reset() {
      running = false
      knock = 0
      character?.setRun(false)
      character?.setDuck(false)
      character?.setPose('rest')
    },
    resize,
    dispose() {
      disposed = true
      for (const t of loaded) t.dispose()
      canvas.removeEventListener('webglcontextlost', onLost)
      character?.dispose()
      for (const entry of obstacles.values()) {
        if (entry.jelly) {
          entry.jelly.bell.geometry.dispose()
          entry.jelly.tentacles.geometry.dispose()
        }
      }
      scene.traverse((node) => {
        const mesh = node as Mesh
        if ((mesh.isMesh || (node as Points).isPoints) && mesh.geometry !== urchinGeo && mesh.geometry !== shadowGeo && !coralGeos.includes(mesh.geometry)) {
          mesh.geometry?.dispose()
          const material = mesh.material as Material | Material[]
          for (const m of Array.isArray(material) ? material : [material]) m?.dispose()
        }
      })
      bestMarker.dispose()
      streakGeo.dispose()
      streakMaterial.dispose()
      urchinGeo.dispose()
      shadowGeo.dispose()
      shadowTex.dispose()
      for (const g of coralGeos) g.dispose()
      for (const m of [rockMaterial, coralMaterial, urchinMaterial, jellyMaterials.bell, jellyMaterials.tentacle, sand, kelpMaterial, puffMaterial]) m.dispose()
      water.dispose()
      rayTex.dispose()
      bubbleTex.dispose()
      env.dispose()
      renderer.dispose()
    },
  }
}
