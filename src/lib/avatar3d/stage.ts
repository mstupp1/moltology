/**
 * The stage a character stands on: renderer, studio lighting, soft ground shadow and
 * drag-to-turn. Framework free, so the creator, portraits and tests can all drive it.
 */
import {
  AdditiveBlending,
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
  Raycaster,
  Scene,
  ShadowMaterial,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { AvatarPose } from '../avatar/traits'
import { buildCharacter, type Character3D } from './character'
import { lookChange, type Avatar3DLook } from './look'
import { withLoftDetail } from './loft'
import type { Reaction } from './motion'

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
  /**
   * `studio` (default) is even, soft light for stills. `cinematic` is for the live full-body view:
   * a darker fill, a cyan rim on one edge and a pink kicker on the other (the glass portrait's
   * colours), and a faint glowing ring on the floor. Lights only, so it costs no more to draw.
   */
  lighting?: 'studio' | 'cinematic'
  /**
   * `low` is for phones and weaker machines: a lower pixel ratio, a smaller shadow map and coarser
   * meshes. Either way the stage lowers its own resolution if frames run slow.
   */
  quality?: 'high' | 'low'
  /** The browser took the 3D context away (too many canvases, or the graphics driver reset). */
  onContextLost?: () => void
}

export interface Stage {
  /**
   * Show this look. Only what changed is redone: a new pose or temperament retargets the bones, a
   * new colour, finish, marking or eye colour repaints the materials, and anything else rebuilds
   * the character. `fresh` always rebuilds.
   */
  setLook: (look: Avatar3DLook, fresh?: boolean) => void
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
  /** Play a short reaction (a flinch, a claw snap, trying on gear, a celebration). */
  react: (kind: Reaction, side?: 1 | -1) => void
  /** Zoom (1 is the whole figure) and tilt back to where they started. */
  resetView: () => void
  /** Switch a manual stage between the whole figure and the head-and-shoulders framing. */
  setFraming: (framing: 'full' | 'portrait') => void
  /** Move time on by `dt` seconds and draw. For manual stages (tests and review renders). */
  step: (dt: number) => void
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

/** A faint cyan ring for the character to stand in, brightest at its edge. */
function floorRingTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(0,195,255,0.14)')
  g.addColorStop(0.6, 'rgba(0,195,255,0.05)')
  g.addColorStop(0.82, 'rgba(120,235,255,0.32)')
  g.addColorStop(0.88, 'rgba(0,195,255,0.08)')
  g.addColorStop(1, 'rgba(0,195,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

/** A soft white disc, tinted and drawn behind a glowing shell as its halo. */
function haloTexture(): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.2)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
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

const ZOOM_MAX = 2.4
const TILT_MIN = -0.12
const TILT_MAX = 0.6
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export function createStage(canvas: HTMLCanvasElement, options: StageOptions = {}): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: options.preserveDrawingBuffer })
  const low = options.quality === 'low'
  let pixelRatio = options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2)
  renderer.setPixelRatio(pixelRatio)
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
  key.shadow.mapSize.set(low ? 512 : 1024, low ? 512 : 1024)
  key.shadow.camera.left = key.shadow.camera.bottom = -1.7
  key.shadow.camera.right = key.shadow.camera.top = 1.7
  key.shadow.camera.near = 1
  key.shadow.camera.far = 12
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.012
  key.shadow.radius = 7
  key.shadow.blurSamples = low ? 8 : 16
  key.target.position.set(0, 1, 0)
  const fill = new DirectionalLight(0xa9c9ff, 0.5)
  fill.position.set(-3.2, 1.6, 2.4)
  const rim = new DirectionalLight(0xc8ecff, 1.9)
  rim.position.set(-1.8, 2.6, -3.6)
  scene.add(hemi, key, key.target, fill, rim)
  const cinematic = options.lighting === 'cinematic'
  if (cinematic) {
    // Darker all round, so the coloured edges read: cyan behind the left side, pink behind the right.
    scene.environmentIntensity = 0.2
    hemi.intensity = 0.22
    hemi.groundColor.set(0x0b2a36)
    fill.intensity = 0.28
    fill.color.set(0x7fb8ff)
    key.intensity = 3
    rim.color.set(0x48dcff)
    rim.intensity = 8
    rim.position.set(-3.4, 2.2, -1.6)
  }
  const kicker = new DirectionalLight(0xff8fc4, 3.2)
  kicker.position.set(3.4, 1.4, -1.4)
  if (cinematic) scene.add(kicker)

  const ground = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ opacity: 0.26 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  const blobTexture = contactShadowTexture()
  const blob = new Mesh(new PlaneGeometry(1.9, 1.3), new MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false, opacity: 0.7 }))
  blob.rotation.x = -Math.PI / 2
  blob.position.y = 0.002
  scene.add(ground, blob)
  const ringTexture = cinematic ? floorRingTexture() : null
  const ring = ringTexture
    ? new Mesh(new PlaneGeometry(2.3, 2.3), new MeshBasicMaterial({ map: ringTexture, transparent: true, depthWrite: false, blending: AdditiveBlending }))
    : null
  if (ring) {
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.001
    scene.add(ring)
  }

  // Shells with the glow finish light the water around them.
  const glowTexture = haloTexture()
  const halo = new Sprite(new SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, opacity: 0.5 }))
  halo.renderOrder = -1
  halo.visible = false
  scene.add(halo)
  let glowing = false
  const lightHalo = (look: Avatar3DLook, height: number) => {
    glowing = look.finish === 'glow'
    if (!glowing) return
    halo.material.color.set(look.palette.base)
    halo.position.set(0, height * 0.56, -0.2)
    halo.scale.setScalar(height * 1.9)
  }

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
    let dist: number
    let rise: number
    if (!close) {
      // Zooming in closes on the head and shoulders rather than the middle of the body.
      const near = (zoom - 1) / (ZOOM_MAX - 1)
      wantLook.copy(home.look)
      wantLook.y += ((character?.height ?? 1.8) * 0.8 - home.look.y) * near
      dist = (home.position.z - home.look.z) / zoom
      rise = (home.position.y - home.look.y) / zoom
    } else {
      const at = close.at.clone().applyAxisAngle(new Vector3(0, 1, 0), yaw)
      const vfov = (camera.fov * Math.PI) / 180
      const size = close.size * focusZoom
      dist = ((size / 2 / Math.tan(vfov / 2) / Math.min(camera.aspect, 1)) * 1.08) / zoom
      rise = size * 0.12
      wantLook.copy(at)
    }
    wantPosition.set(wantLook.x, wantLook.y + rise + dist * Math.sin(tilt), wantLook.z + dist * Math.cos(tilt))
  }
  let yaw = options.yaw ?? 0
  let zoom = 1
  let tilt = 0
  let framing = options.framing ?? 'full'
  let spin = 0
  let velocity = 0
  let dragging = false
  let lastX = 0
  let lastY = 0
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
  let slow = 16
  let frames = 0
  // The eyes follow the pointer anywhere on the page, for a while after it last moved.
  const follow = Boolean(options.interactive) && !options.reducedMotion
  let seen: { x: number; y: number; at: number } | null = null
  const onSeen = (e: PointerEvent) => {
    seen = { x: e.clientX, y: e.clientY, at: performance.now() }
  }

  const frame = () => {
    const w = canvas.clientWidth || canvas.width
    const h = canvas.clientHeight || canvas.height
    camera.aspect = w / Math.max(h, 1)
    if (framing === 'portrait') {
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
    if (framing !== 'portrait') {
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
    // A close portrait would be all halo, so only the whole figure wears it.
    halo.visible = glowing && framing === 'full'
    renderer.render(scene, camera)
  }

  const tick = (now: number) => {
    if (disposed) return
    raf = requestAnimationFrame(tick)
    const elapsed = last ? now - last : 0
    const dt = Math.min(elapsed / 1000 || 0, 0.05)
    last = now
    clock += dt
    // If frames run slow for a while, draw fewer pixels, and then drop the cast shadow.
    if (elapsed > 0 && elapsed < 250) {
      slow = slow * 0.95 + elapsed * 0.05
      if (++frames > 90 && slow > 30) {
        frames = 0
        if (pixelRatio > 1) {
          pixelRatio = Math.max(1, pixelRatio - 0.5)
          renderer.setPixelRatio(pixelRatio)
          resize()
        } else if (key.castShadow) key.castShadow = false
      }
    }
    if (character && follow) {
      if (seen && now - seen.at < 4000) {
        const box = canvas.getBoundingClientRect()
        character.lookAt({
          x: clamp((seen.x - box.left - box.width / 2) / (box.width / 2), -2, 2),
          y: clamp(-(seen.y - box.top - box.height / 2) / (box.height / 2), -2, 2),
        })
      } else character.lookAt(null)
    }
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

  const touches = new Map<number, { x: number; y: number }>()
  let pinch: { span: number; zoom: number } | null = null
  let press: { x: number; y: number; at: number; moved: number } | null = null
  let lastTap = 0
  const raycaster = new Raycaster()
  const span = () => {
    const [a, b] = [...touches.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  /** A tap on the character: a claw snaps, anywhere else makes it jump. */
  const tap = (e: PointerEvent) => {
    if (!character || options.reducedMotion) return
    const box = canvas.getBoundingClientRect()
    const at = new Vector2(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1)
    raycaster.setFromCamera(at, camera)
    const hit = raycaster.intersectObject(character.root, true)[0]
    if (!hit) return
    const bone = character.boneOf(hit.object) ?? ''
    const claw = /^(claw|thumb|forearm)([LR])$/.exec(bone)
    if (claw) character.react('snap', claw[2] === 'L' ? 1 : -1)
    else character.react('poke')
    wake()
  }
  const onDown = (e: PointerEvent) => {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
    canvas.setPointerCapture(e.pointerId)
    if (touches.size === 2) {
      // Two fingers: pinch to zoom.
      pinch = { span: span() || 1, zoom }
      dragging = false
      press = null
      return
    }
    dragging = true
    press = { x: e.clientX, y: e.clientY, at: performance.now(), moved: 0 }
    // The visitor takes over the turn; the close-up stays.
    focusYaw = null
    lastX = e.clientX
    lastY = e.clientY
    velocity = 0
  }
  const onMove = (e: PointerEvent) => {
    const touch = touches.get(e.pointerId)
    if (!touch) return
    touch.x = e.clientX
    touch.y = e.clientY
    if (pinch && touches.size === 2) {
      zoom = clamp(pinch.zoom * (span() / pinch.span), 1, ZOOM_MAX)
      wake()
      return
    }
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    if (press) press.moved += Math.abs(dx) + Math.abs(dy)
    yaw += dx * 0.01
    velocity = dx * 0.6
    // A mouse can also tilt the view; on a touch screen an up and down drag scrolls the page.
    if (e.pointerType === 'mouse') tilt = clamp(tilt + dy * 0.005, TILT_MIN, TILT_MAX)
  }
  const onUp = (e: PointerEvent) => {
    touches.delete(e.pointerId)
    if (touches.size < 2) pinch = null
    if (!dragging) return
    dragging = false
    const now = performance.now()
    if (e.type === 'pointerup' && press && press.moved < 6 && now - press.at < 350) {
      if (now - lastTap < 320) {
        // Double tap: in close, or back out.
        zoom = zoom > 1.3 ? 1 : 1.9
        if (zoom === 1) tilt = 0
        lastTap = 0
        wake()
      } else {
        lastTap = now
        tap(e)
      }
    }
    press = null
  }
  const onWheel = (e: WheelEvent) => {
    // Pinch on a trackpad, or the wheel with Ctrl or Cmd held; a plain wheel scrolls the page.
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    zoom = clamp(zoom * Math.exp(-e.deltaY * 0.01), 1, ZOOM_MAX)
    wake()
  }
  if (options.interactive) {
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.style.touchAction = 'pan-y'
    canvas.style.cursor = 'grab'
  }
  if (follow) window.addEventListener('pointermove', onSeen, { passive: true })

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
    setLook(look, fresh = false) {
      const before = character?.look
      const change = before && !fresh ? lookChange(before, look) : 'shape'
      if (character && change !== 'shape') {
        if (change === 'paint') {
          character.repaint(look)
          lightHalo(look, character.height)
        } else character.look = look
        if (before!.pose !== look.pose) character.setPose(look.pose)
        character.setTemperament(look.temperament)
        wake()
        return
      }
      character?.dispose()
      // A live character on a phone is built from slightly coarser meshes; stills choose their own detail.
      character = low && !options.manual ? withLoftDetail(0.8, () => buildCharacter(look)) : buildCharacter(look)
      scene.add(character.root)
      lightHalo(look, character.height)
      // New gear on a live character: it tries the piece on.
      if (before && follow && JSON.stringify(before.equipment ?? {}) !== JSON.stringify(look.equipment ?? {})) character.react('equip')
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
    react(kind, side) {
      if (options.reducedMotion) return
      character?.react(kind, side)
      wake()
    },
    resetView() {
      zoom = 1
      tilt = 0
      wake()
    },
    setFraming(next) {
      if (next === framing) return
      framing = next
      started = false
      frame()
    },
    step(dt) {
      clock += dt
      draw(dt, clock)
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
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointermove', onSeen)
      canvas.removeEventListener('webglcontextlost', onLost)
      character?.dispose()
      env.dispose()
      pmrem.dispose()
      room.dispose()
      blobTexture.dispose()
      glowTexture.dispose()
      halo.material.dispose()
      ringTexture?.dispose()
      ring?.geometry.dispose()
      ;(ring?.material as MeshBasicMaterial | undefined)?.dispose()
      ground.geometry.dispose()
      ;(ground.material as ShadowMaterial).dispose()
      blob.geometry.dispose()
      ;(blob.material as MeshBasicMaterial).dispose()
      renderer.dispose()
    },
  }
}
