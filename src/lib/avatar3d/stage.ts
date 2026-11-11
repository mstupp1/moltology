/**
 * The stage a character stands on: renderer, studio lighting, soft ground shadow and
 * drag-to-turn. Framework free, so the creator, portraits and tests can all drive it.
 */
import {
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  VSMShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { AvatarPose } from '../avatar/traits'
import { buildCharacter, type Character3D } from './character'
import type { Avatar3DLook } from './look'

export interface StageOptions {
  /** Hold still: no breathing, blinking or drift. */
  reducedMotion?: boolean
  /** Starting turn in radians (0 faces the viewer). */
  yaw?: number
  /** Let the visitor drag to turn the character. */
  interactive?: boolean
  /** Keep the drawing buffer so the canvas can be saved as an image. */
  preserveDrawingBuffer?: boolean
  pixelRatio?: number
  /** `portrait` closes in on the head; the default takes in the whole figure. */
  framing?: 'full' | 'portrait'
  /** Draw only when asked (`renderStill`), with no animation loop. */
  manual?: boolean
}

export interface Stage {
  setLook: (look: Avatar3DLook) => void
  setPose: (pose: AvatarPose, immediate?: boolean) => void
  setYaw: (yaw: number) => void
  /** Slow automatic turntable, in radians per second (0 stops it). */
  setSpin: (speed: number) => void
  resize: () => void
  /** Draw one frame now, at a fixed time. Used for stills. */
  renderStill: (time?: number) => void
  character: () => Character3D | null
  /** The current frame as a PNG data URL. Needs `preserveDrawingBuffer`. */
  snapshot: () => string
  dispose: () => void
}

function contactShadowTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(0,0,0,0.55)')
  g.addColorStop(0.45, 'rgba(0,0,0,0.28)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

export function createStage(canvas: HTMLCanvasElement, options: StageOptions = {}): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: options.preserveDrawingBuffer })
  renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = VSMShadowMap
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04)
  scene.environment = env.texture
  scene.environmentIntensity = 0.28

  const camera = new PerspectiveCamera(26, 1, 0.1, 50)

  const hemi = new HemisphereLight(0xfff1e6, 0x5a3038, 0.4)
  const key = new DirectionalLight(0xfff4e8, 3.2)
  key.position.set(2.2, 3.4, 4.4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = key.shadow.camera.bottom = -1.7
  key.shadow.camera.right = key.shadow.camera.top = 1.7
  key.shadow.camera.near = 1
  key.shadow.camera.far = 12
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.012
  key.shadow.radius = 7
  key.shadow.blurSamples = 16
  key.target.position.set(0, 1, 0)
  const fill = new DirectionalLight(0xa9c9ff, 0.5)
  fill.position.set(-3.2, 1.6, 2.4)
  const rim = new DirectionalLight(0xc8ecff, 1.9)
  rim.position.set(-1.8, 2.6, -3.6)
  scene.add(hemi, key, key.target, fill, rim)

  const ground = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ opacity: 0.26 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  const blobTexture = contactShadowTexture()
  const blob = new Mesh(new PlaneGeometry(1.9, 1.3), new MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false, opacity: 0.7 }))
  blob.rotation.x = -Math.PI / 2
  blob.position.y = 0.002
  scene.add(ground, blob)

  let character: Character3D | null = null
  let yaw = options.yaw ?? 0
  let spin = 0
  let velocity = 0
  let dragging = false
  let lastX = 0
  let disposed = false
  let raf = 0
  let last = 0
  let clock = 0

  const frame = () => {
    const w = canvas.clientWidth || canvas.width
    const h = canvas.clientHeight || canvas.height
    camera.aspect = w / Math.max(h, 1)
    if (options.framing === 'portrait') {
      const { y, size } = character?.portrait ?? { y: 1.5, size: 1.2 }
      const dist = (size / 2 / Math.tan((camera.fov * Math.PI) / 360) / Math.min(camera.aspect, 1)) * 1.02
      // Straight on, so the head sits where the frame puts it.
      camera.position.set(0, y + 0.02, dist)
      camera.lookAt(0, y, 0)
      camera.updateProjectionMatrix()
      return
    }
    // Fit the whole figure, antennae and claws included, whatever the canvas shape.
    const tall = (character?.height ?? 1.8) + 0.62
    const wide = 2.3
    const vfov = (camera.fov * Math.PI) / 180
    const distTall = tall / 2 / Math.tan(vfov / 2)
    const distWide = wide / 2 / (Math.tan(vfov / 2) * camera.aspect)
    const dist = Math.max(distTall, distWide) * 1.06
    const centre = tall / 2 - 0.06
    camera.position.set(0, centre + 0.18, dist)
    camera.lookAt(0, centre, 0)
    camera.updateProjectionMatrix()
  }

  const resize = () => {
    // A canvas that is not on the page has no layout size, so it keeps the size it was given.
    const w = canvas.clientWidth || canvas.width
    const h = canvas.clientHeight || canvas.height
    if (w && h) renderer.setSize(w, h, false)
    frame()
  }

  const draw = (dt: number, time: number) => {
    if (character) {
      character.root.rotation.y = yaw
      character.update(dt, time, !options.reducedMotion)
    }
    renderer.render(scene, camera)
  }

  const tick = (now: number) => {
    if (disposed) return
    raf = requestAnimationFrame(tick)
    const dt = Math.min((now - last) / 1000 || 0, 0.05)
    last = now
    clock += dt
    if (!dragging) {
      yaw += (spin + velocity) * dt
      velocity *= Math.exp(-dt * 3)
    }
    draw(dt, clock)
  }

  const onDown = (e: PointerEvent) => {
    dragging = true
    lastX = e.clientX
    velocity = 0
    canvas.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    lastX = e.clientX
    yaw += dx * 0.01
    velocity = dx * 0.6
  }
  const onUp = () => {
    dragging = false
  }
  if (options.interactive) {
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.style.touchAction = 'pan-y'
    canvas.style.cursor = 'grab'
  }

  resize()
  if (!options.manual) raf = requestAnimationFrame(tick)

  return {
    setLook(look) {
      character?.dispose()
      character = buildCharacter(look)
      scene.add(character.root)
      frame()
    },
    setPose: (pose, immediate) => character?.setPose(pose, immediate),
    setYaw: (value) => {
      yaw = value
    },
    setSpin: (speed) => {
      spin = speed
    },
    resize,
    renderStill(time = 0) {
      if (character) character.setPose(character.look.pose, true)
      draw(0, time)
    },
    character: () => character,
    snapshot: () => canvas.toDataURL('image/png'),
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      character?.dispose()
      env.dispose()
      pmrem.dispose()
      room.dispose()
      blobTexture.dispose()
      ground.geometry.dispose()
      ;(ground.material as ShadowMaterial).dispose()
      blob.geometry.dispose()
      ;(blob.material as MeshBasicMaterial).dispose()
      renderer.dispose()
    },
  }
}
