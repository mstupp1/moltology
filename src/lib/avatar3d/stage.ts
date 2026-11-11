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
  Vector3,
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
  /** Cast soft shadows (default true). Small stills skip them: they barely show and cost the most. */
  shadows?: boolean
  /** The browser took the 3D context away (too many canvases, or the graphics driver reset). */
  onContextLost?: () => void
}

export interface Stage {
  setLook: (look: Avatar3DLook) => void
  setPose: (pose: AvatarPose, immediate?: boolean) => void
  setYaw: (yaw: number) => void
  /** Slow automatic turntable, in radians per second (0 stops it). */
  setSpin: (speed: number) => void
  /**
   * Glide the camera in on one gear slot and turn the character to show it, or back out to the
   * whole figure with null. Dragging still turns the character while it is framed.
   */
  /** Close in on a gear slot (null for the whole figure). `zoom` above 1 stands further back. */
  focus: (slot: string | null, zoom?: number) => void
  resize: () => void
  /** Stop drawing while the character is off screen, and pick up again when it is back. */
  setActive: (active: boolean) => void
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
  renderer.shadowMap.enabled = options.shadows ?? true
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
  // Where the camera sits to take in the whole figure, and where it is now on its way there.
  const home = { position: new Vector3(0, 1.2, 6), look: new Vector3(0, 1, 0) }
  const eye = new Vector3()
  const aim = new Vector3()
  let started = false
  let focused: string | null = null
  let focusZoom = 1
  let focusYaw: number | null = null
  const place = (position: Vector3, look: Vector3) => {
    eye.copy(position)
    aim.copy(look)
    camera.position.copy(eye)
    camera.lookAt(aim)
  }
  const wantPosition = new Vector3()
  const wantLook = new Vector3()
  /** Where the camera wants to be this frame: home, or close on the focused slot as it turns. */
  const target = () => {
    const close = focused && character ? character.focusOf(focused) : null
    if (!close) {
      wantPosition.copy(home.position)
      wantLook.copy(home.look)
      return
    }
    const at = close.at.clone().applyAxisAngle(new Vector3(0, 1, 0), yaw)
    const vfov = (camera.fov * Math.PI) / 180
    const size = close.size * focusZoom
    const dist = (size / 2 / Math.tan(vfov / 2) / Math.min(camera.aspect, 1)) * 1.08
    wantLook.copy(at)
    wantPosition.set(at.x, at.y + size * 0.12, at.z + dist)
  }
  let yaw = options.yaw ?? 0
  let spin = 0
  let velocity = 0
  let dragging = false
  let lastX = 0
  let disposed = false
  let raf = 0
  let last = 0
  let clock = 0
  let active = true
  // With motion held, nothing moves on its own, so frames are drawn only for a while after a change.
  let awake = 1.5
  const wake = () => {
    awake = 1.5
  }

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
    home.position.set(0, centre + 0.18, dist)
    home.look.set(0, centre, 0)
    camera.updateProjectionMatrix()
    if (!started) place(home.position, home.look)
  }

  const resize = () => {
    // A canvas that is not on the page has no layout size, so it keeps the size it was given.
    const w = canvas.clientWidth || canvas.width
    const h = canvas.clientHeight || canvas.height
    if (w && h) renderer.setSize(w, h, false)
    frame()
  }

  const draw = (dt: number, time: number) => {
    if (options.framing !== 'portrait') {
      target()
      // Ease in like a game camera; snap when motion is reduced or nothing has been drawn yet.
      const k = options.reducedMotion || !started ? 1 : 1 - Math.exp(-dt * 6)
      eye.lerp(wantPosition, k)
      aim.lerp(wantLook, k)
      camera.position.copy(eye)
      camera.lookAt(aim)
      started = true
    }
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
      if (focusYaw !== null) {
        // Turn the short way round to show the focused part.
        const delta = Math.atan2(Math.sin(focusYaw - yaw), Math.cos(focusYaw - yaw))
        yaw += options.reducedMotion ? delta : delta * (1 - Math.exp(-dt * 6))
        if (!focused && Math.abs(delta) < 1e-3) focusYaw = null
      } else yaw += (spin + velocity) * dt
      velocity *= Math.exp(-dt * 3)
    }
    if (options.reducedMotion) {
      const moving = eye.distanceToSquared(wantPosition) > 1e-6 || aim.distanceToSquared(wantLook) > 1e-6
      if (dragging || spin !== 0 || Math.abs(velocity) > 0.002 || moving) wake()
      if (awake <= 0) return
      awake -= dt
    }
    draw(dt, clock)
  }

  const onDown = (e: PointerEvent) => {
    dragging = true
    // The visitor takes over the turn; the close-up stays.
    focusYaw = null
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

  const onLost = (e: Event) => {
    e.preventDefault()
    cancelAnimationFrame(raf)
    active = false
    options.onContextLost?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)

  resize()
  if (!options.manual) raf = requestAnimationFrame(tick)

  return {
    setLook(look) {
      character?.dispose()
      character = buildCharacter(look)
      scene.add(character.root)
      frame()
      wake()
    },
    setPose: (pose, immediate) => {
      character?.setPose(pose, immediate)
      wake()
    },
    setYaw: (value) => {
      yaw = value
      wake()
    },
    setSpin: (speed) => {
      spin = speed
      wake()
    },
    focus(slot, zoom = 1) {
      focused = slot
      focusZoom = zoom
      velocity = 0
      const close = slot && character ? character.focusOf(slot) : null
      // Back to the front when the close-up ends, as a game camera resets.
      focusYaw = close ? close.yaw : 0
      wake()
    },
    resize: () => {
      resize()
      wake()
    },
    setActive(next) {
      if (next === active || disposed || options.manual) return
      active = next
      cancelAnimationFrame(raf)
      if (active) {
        last = 0
        wake()
        raf = requestAnimationFrame(tick)
      }
    },
    renderStill(time = 0) {
      if (character) character.setPose(character.look.pose, true)
      draw(0, time)
    },
    character: () => character,
    // WebP where the browser can write it (much smaller, keeps transparency); PNG elsewhere.
    snapshot: () => canvas.toDataURL('image/webp', 0.9),
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('webglcontextlost', onLost)
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
