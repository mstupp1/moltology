import React, { useEffect, useRef } from 'react'

/**
 * Bubbles for the in-app underwater scene.
 *
 * Bubbles are drawn as clear glass: a bright rim, a glint where the surface light
 * hits them, and light pooled in the lower inside. Most rise in streams from the
 * vents and the little sub in the painting, so the scene reads as one place.
 * Far bubbles are out of focus, near ones are sharp and wobble as they rise, and
 * bubbles that pass through the light shafts catch more light.
 */

type ParticleKind = 'bead' | 'bubble'

interface Particle {
  kind: ParticleKind
  x: number
  y: number
  z: number // depth: 0 far .. 1 near
  radius: number
  speed: number
  wobblePhase: number
  wobbleSpeed: number
  wobbleAmount: number
  opacity: number
  /** Bubbles from the same vent rise in a loose column. */
  fromVent: boolean
}

export interface UnderwaterBubblesCanvasProps {
  bubbleCount?: number
  className?: string
  /**
   * Disables canvas particle physics & animation frame loop when true.
   */
  disabled?: boolean
  /**
   * Holds the last drawn frame and stops the loop while the canvas is hidden
   * behind an opaque page or a full-screen overlay. Resumes where it left off.
   */
  paused?: boolean
}

/**
 * Where bubbles come from, in the painting's own coordinates (0..1). The scene image
 * is drawn with background-size: cover, centred, so these map the same way.
 */
export const SCENE_IMAGE_SIZE = { width: 1672, height: 941 }
export const BUBBLE_VENTS = [
  { x: 0.262, y: 0.7, weight: 2.2 },
  { x: 0.282, y: 0.75, weight: 1.4 },
  { x: 0.752, y: 0.66, weight: 2 },
  { x: 0.51, y: 0.84, weight: 0.8 }, // the little sub
]
const VENT_SHARE = 0.68

/** Maps a point in the painting to the canvas, matching background-size: cover. */
export function mapScenePoint(u: number, v: number, width: number, height: number): [number, number] {
  const scale = Math.max(width / SCENE_IMAGE_SIZE.width, height / SCENE_IMAGE_SIZE.height)
  const drawnW = SCENE_IMAGE_SIZE.width * scale
  const drawnH = SCENE_IMAGE_SIZE.height * scale
  return [(width - drawnW) / 2 + u * drawnW, (height - drawnH) / 2 + v * drawnH]
}

/** How much surface light reaches a point: strongest in the shafts at the top centre. */
export function sceneLightAt(x: number, y: number, width: number, height: number): number {
  const dx = x / Math.max(width, 1) - 0.5
  const across = Math.exp(-(dx * dx) / 0.06)
  const down = 1 - Math.min(1, Math.max(0, y / Math.max(height, 1))) * 0.7
  return across * down
}

// ---------------------------------------------------------------------------
// BUBBLE BUDGET
// ---------------------------------------------------------------------------
// Phones get fewer bubbles than desktop, and low-power or data-saver phones
// get fewer again at a lower frame rate. Desktop keeps the full scene.

export interface BubbleDeviceHints {
  viewportWidth: number
  saveData?: boolean
  hardwareConcurrency?: number
  deviceMemory?: number
}

export interface BubbleBudget {
  count: number
  fpsTiers: number[]
}

const PHONE_MAX_WIDTH = 768
const PHONE_BUBBLES = 26
const LOW_POWER_PHONE_BUBBLES = 16

export function isLowPowerDevice(hints: BubbleDeviceHints): boolean {
  return (
    hints.saveData === true ||
    (hints.hardwareConcurrency ?? 8) <= 4 ||
    (hints.deviceMemory ?? 8) <= 4
  )
}

export function pickBubbleBudget(bubbleCount: number, hints: BubbleDeviceHints): BubbleBudget {
  if (hints.viewportWidth >= PHONE_MAX_WIDTH) {
    return { count: bubbleCount, fpsTiers: [36, 24, 18] }
  }
  if (isLowPowerDevice(hints)) {
    return { count: Math.min(bubbleCount, LOW_POWER_PHONE_BUBBLES), fpsTiers: [24, 18] }
  }
  return { count: Math.min(bubbleCount, PHONE_BUBBLES), fpsTiers: [30, 24, 18] }
}

function readDeviceHints(): BubbleDeviceHints {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
  return {
    viewportWidth: window.innerWidth,
    saveData: nav.connection?.saveData,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
  }
}

// ---------------------------------------------------------------------------
// ADAPTIVE FPS GOVERNOR
// ---------------------------------------------------------------------------
// Pure, testable frame-budget monitor. Samples real per-frame render cost and
// rAF cadence, and steps the target FPS down through tiers only when a device
// provably cannot hold the current tier (sustained breach, not transient
// spikes). Upgrades back after sustained headroom (hysteresis prevents
// oscillation). Healthy devices never leave tier 0.

export interface FpsTierSample {
  tierIndex: number
  intervalMs: number
  downgraded: boolean
  upgraded: boolean
  cullRequested: boolean
}

export interface FpsGovernor {
  readonly tierIndex: number
  readonly intervalMs: number
  /**
   * @param renderMs    measured duration of the actual draw work for this frame
   * @param rafDeltaMs  timestamp delta between consecutive rAF callbacks
   */
  sample: (renderMs: number, rafDeltaMs: number) => FpsTierSample
}

const GOVERNOR_EMA_ALPHA = 0.12
const GOVERNOR_WARMUP_SAMPLES = 10
const GOVERNOR_DOWNGRADE_AFTER = 45 // ~1.25s of sustained struggle at 36fps
const GOVERNOR_UPGRADE_AFTER = 180 // ~5s of sustained headroom
const GOVERNOR_RENDER_BREACH_FACTOR = 1.2
const GOVERNOR_CADENCE_BREACH_FACTOR = 2.2
const GOVERNOR_CADENCE_CALM_FACTOR = 1.6
const GOVERNOR_RENDER_CALM_FACTOR = 0.5
const GOVERNOR_MIN_VSYNC_MS = 4
const GOVERNOR_MAX_VSYNC_MS = 50
const GOVERNOR_RAF_STALL_MS = 500

export function createFpsGovernor(tiers: number[]): FpsGovernor {
  let tierIndex = 0
  let renderEma = 0
  let cadenceEma = 0
  let vsyncFloorMs = 0
  let breachStreak = 0
  let calmStreak = 0
  let samples = 0

  const currentIntervalMs = () => 1000 / tiers[tierIndex]

  const sample = (renderMs: number, rafDeltaMs: number): FpsTierSample => {
    samples++

    renderEma = samples === 1 ? renderMs : renderEma + (renderMs - renderEma) * GOVERNOR_EMA_ALPHA

    if (rafDeltaMs > 0 && rafDeltaMs < GOVERNOR_RAF_STALL_MS) {
      cadenceEma =
        samples === 1 || cadenceEma === 0
          ? rafDeltaMs
          : cadenceEma + (rafDeltaMs - cadenceEma) * GOVERNOR_EMA_ALPHA
      if (vsyncFloorMs === 0 || rafDeltaMs < vsyncFloorMs) {
        vsyncFloorMs = Math.min(Math.max(rafDeltaMs, GOVERNOR_MIN_VSYNC_MS), GOVERNOR_MAX_VSYNC_MS)
      }
    }

    let downgraded = false
    let upgraded = false
    let cullRequested = false

    if (samples > GOVERNOR_WARMUP_SAMPLES) {
      const interval = currentIntervalMs()
      const renderBreach = renderEma > interval * GOVERNOR_RENDER_BREACH_FACTOR
      const cadenceBreach =
        cadenceEma > 0 && cadenceEma > Math.max(interval, vsyncFloorMs * GOVERNOR_CADENCE_BREACH_FACTOR)

      if (renderBreach || cadenceBreach) {
        breachStreak++
      } else {
        breachStreak = 0
      }

      if (tierIndex < tiers.length - 1 && breachStreak >= GOVERNOR_DOWNGRADE_AFTER) {
        tierIndex++
        breachStreak = 0
        calmStreak = 0
        downgraded = true
        cullRequested = tierIndex === tiers.length - 1
      } else if (tierIndex > 0 && breachStreak === 0) {
        const higherInterval = 1000 / tiers[tierIndex - 1]
        const cadenceCalm =
          vsyncFloorMs > 0 && cadenceEma > 0 && cadenceEma < vsyncFloorMs * GOVERNOR_CADENCE_CALM_FACTOR
        const renderCalm = renderEma > 0 && renderEma < higherInterval * GOVERNOR_RENDER_CALM_FACTOR

        if (cadenceCalm && renderCalm) {
          calmStreak++
        } else {
          calmStreak = 0
        }

        if (calmStreak >= GOVERNOR_UPGRADE_AFTER) {
          tierIndex--
          calmStreak = 0
          breachStreak = 0
          upgraded = true
        }
      }
    }

    return { tierIndex, intervalMs: currentIntervalMs(), downgraded, upgraded, cullRequested }
  }

  return {
    get tierIndex() {
      return tierIndex
    },
    get intervalMs() {
      return currentIntervalMs()
    },
    sample,
  }
}


// ---------------------------------------------------------------------------
// SPRITES
// ---------------------------------------------------------------------------
// Baked once per session; every frame is only drawImage calls.

function newSpriteCanvas(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return { canvas, ctx: canvas.getContext('2d', { alpha: true }) }
}

/**
 * A clear glass bubble lit from the surface above: a bright silvery rim (total internal
 * reflection), a sharp glint and a soft window near the top, and the bright surface seen
 * upside down in the lower inside. The centre stays mostly clear.
 */
function createGlassBubbleSprite(size: number, blur = 0): HTMLCanvasElement {
  const { canvas, ctx: g } = newSpriteCanvas(size)
  if (!g) return canvas
  try {
    const c = size / 2
    const r = size * 0.4
    const tint = '150,235,255'
    if (blur) g.filter = `blur(${blur}px)`

    // The water lit around the bubble
    let grad = g.createRadialGradient(c, c, r * 0.9, c, c, r * 1.22)
    grad.addColorStop(0, `rgba(${tint},0.16)`)
    grad.addColorStop(1, `rgba(${tint},0)`)
    g.fillStyle = grad
    g.beginPath()
    g.arc(c, c, r * 1.22, 0, Math.PI * 2)
    g.fill()

    // Body: clear centre, a darker band, then the bright rim
    grad = g.createRadialGradient(c, c - r * 0.08, 0, c, c, r)
    grad.addColorStop(0, 'rgba(200,245,255,0.04)')
    grad.addColorStop(0.62, 'rgba(40,120,140,0.10)')
    grad.addColorStop(0.84, `rgba(${tint},0.30)`)
    grad.addColorStop(0.95, 'rgba(225,250,255,0.85)')
    grad.addColorStop(1, 'rgba(255,255,255,0.35)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(c, c, r, 0, Math.PI * 2)
    g.fill()

    g.save()
    g.beginPath()
    g.arc(c, c, r, 0, Math.PI * 2)
    g.clip()
    // Rim is brighter where it faces the light and at the bottom, dimmer on the sides
    const lin = g.createLinearGradient(0, c - r, 0, c + r)
    lin.addColorStop(0, 'rgba(255,255,255,0.35)')
    lin.addColorStop(0.35, 'rgba(255,255,255,0)')
    lin.addColorStop(0.7, 'rgba(255,255,255,0)')
    lin.addColorStop(1, `rgba(${tint},0.35)`)
    g.fillStyle = lin
    g.fillRect(0, 0, size, size)
    // The bright surface, refracted into the lower inside
    grad = g.createRadialGradient(c, c + r * 0.55, 0, c, c + r * 0.55, r * 0.62)
    grad.addColorStop(0, 'rgba(190,255,255,0.55)')
    grad.addColorStop(1, `rgba(${tint},0)`)
    g.fillStyle = grad
    g.beginPath()
    g.ellipse(c, c + r * 0.55, r * 0.62, r * 0.32, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()

    // Soft window near the top
    grad = g.createRadialGradient(c, c - r * 0.62, 0, c, c - r * 0.62, r * 0.42)
    grad.addColorStop(0, 'rgba(255,255,255,0.75)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.ellipse(c, c - r * 0.62, r * 0.42, r * 0.2, 0, 0, Math.PI * 2)
    g.fill()
    // Sharp glint, upper left
    g.fillStyle = 'rgba(255,255,255,0.98)'
    g.beginPath()
    g.ellipse(c - r * 0.38, c - r * 0.42, r * 0.1, r * 0.065, -0.7, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.arc(c - r * 0.18, c - r * 0.58, r * 0.035, 0, Math.PI * 2)
    g.fill()

    // Thin crisp outline
    g.lineWidth = Math.max(1, size * 0.01)
    g.strokeStyle = 'rgba(235,252,255,0.9)'
    g.beginPath()
    g.arc(c, c, r - g.lineWidth / 2, 0, Math.PI * 2)
    g.stroke()
  } catch {
    // A partial sprite still draws; never let a missing canvas feature break the page.
  }
  return canvas
}

/** Tiny bubbles are mostly highlight: a bright bead ring with one glint. */
function createBeadSprite(size: number): HTMLCanvasElement {
  const { canvas, ctx: g } = newSpriteCanvas(size)
  if (!g) return canvas
  try {
    const c = size / 2
    const r = size * 0.36
    const grad = g.createRadialGradient(c, c, 0, c, c, c)
    grad.addColorStop(0, 'rgba(200,250,255,0)')
    grad.addColorStop(0.55, 'rgba(200,250,255,0.25)')
    grad.addColorStop(0.72, 'rgba(240,255,255,0.95)')
    grad.addColorStop(0.85, 'rgba(160,235,255,0.35)')
    grad.addColorStop(1, 'rgba(160,235,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
    g.fillStyle = 'rgba(255,255,255,1)'
    g.beginPath()
    g.arc(c - r * 0.3, c - r * 0.35, r * 0.28, 0, Math.PI * 2)
    g.fill()
  } catch {
    // see createGlassBubbleSprite
  }
  return canvas
}

interface SpriteSet {
  sharp: HTMLCanvasElement
  soft: HTMLCanvasElement
  far: HTMLCanvasElement
  bead: HTMLCanvasElement
}

let spriteCache: SpriteSet | null = null
function getSprites(): SpriteSet {
  if (!spriteCache) {
    spriteCache = {
      sharp: createGlassBubbleSprite(160),
      soft: createGlassBubbleSprite(112, 2),
      far: createGlassBubbleSprite(96, 5),
      bead: createBeadSprite(24),
    }
  }
  return spriteCache
}

// Bubbles carry on where they were when the layout remounts (route changes).
let globalParticles: Particle[] | null = null

export function UnderwaterBubblesCanvas({
  bubbleCount = 48,
  className = 'absolute inset-0 pointer-events-none z-0',
  disabled = false,
  paused = false,
}: UnderwaterBubblesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pausedRef = useRef(paused)
  const resumeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    pausedRef.current = paused
    if (!paused) resumeRef.current?.()
  }, [paused])

  useEffect(() => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let isPaused = false
    let running = false

    const parent = canvas.parentElement
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    let width = 800
    let height = 600
    const sizeCanvas = () => {
      width = parent?.clientWidth || window.innerWidth || 800
      height = parent?.clientHeight || window.innerHeight || 600
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      if (typeof ctx.setTransform === 'function') ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }
    sizeCanvas()

    const sprites = getSprites()
    const totalVentWeight = BUBBLE_VENTS.reduce((sum, vent) => sum + vent.weight, 0)

    const createParticle = (initial: boolean, zOverride?: number): Particle => {
      const fromVent = Math.random() < VENT_SHARE
      let x: number
      let y: number
      let z: number
      if (fromVent) {
        let pick = Math.random() * totalVentWeight
        let vent = BUBBLE_VENTS[0]
        for (const candidate of BUBBLE_VENTS) {
          pick -= candidate.weight
          if (pick <= 0) {
            vent = candidate
            break
          }
        }
        ;[x, y] = mapScenePoint(vent.x, vent.y, width, height)
        x += (Math.random() - 0.5) * 14
        // Vents are in the middle distance.
        z = zOverride ?? 0.15 + Math.random() * 0.45
      } else {
        x = Math.random() * width
        y = height + 20 + Math.random() * 40
        z = zOverride ?? Math.random()
      }
      if (initial) y -= Math.random() * (y + 40)

      // Most bubbles are small beads; a few larger glass bubbles, mostly up close.
      const kind: ParticleKind = Math.random() < (fromVent ? 0.6 : 0.35) ? 'bead' : 'bubble'
      const near = z > 0.75
      const radius =
        kind === 'bead'
          ? (1.6 + Math.random() * 2.4) * (0.6 + z * 0.6)
          : (near ? 9 + Math.random() * 15 : 3.5 + Math.random() * 7) * (0.6 + z * 0.7)

      return {
        kind,
        x,
        y,
        z,
        radius,
        // Bigger bubbles rise faster; nearer ones look faster.
        speed: (20 + radius * 2.2 + Math.random() * 18) * (0.55 + z * 0.6),
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: kind === 'bead' ? 3 + Math.random() * 3 : 1.4 + Math.random() * 1.8,
        wobbleAmount: kind === 'bead' ? 1 + Math.random() * 2.5 : 2 + z * 6,
        opacity: kind === 'bead' ? 0.55 + z * 0.4 : 0.5 + z * 0.45,
        fromVent,
      }
    }

    const budget = pickBubbleBudget(bubbleCount, readDeviceHints())
    let particles: Particle[]
    if (globalParticles && globalParticles.length === budget.count) {
      particles = globalParticles
    } else {
      particles = Array.from({ length: budget.count }, () => createParticle(true)).sort((a, b) => a.z - b.z)
      globalParticles = particles
    }

    // When a device can't keep up, swap the most out-of-focus bubbles (the costliest
    // blurred sprites relative to what they add) for nearer, cheaper beads.
    let farCulled = false
    const cullFar = () => {
      if (farCulled) return
      farCulled = true
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].z < 0.25) particles[i] = createParticle(false, 0.45 + Math.random() * 0.5)
      }
      particles.sort((a, b) => a.z - b.z)
    }

    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        sizeCanvas()
        for (let i = 0; i < particles.length; i++) particles[i] = createParticle(true)
        particles.sort((a, b) => a.z - b.z)
        if (!running) drawFrame(0)
      }, 100)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    const drawFrame = (dt: number) => {
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.y -= p.speed * dt
        p.wobblePhase += p.wobbleSpeed * dt

        if (p.y < -40) {
          particles[i] = createParticle(false, p.z)
          continue
        }

        const x = p.x + Math.sin(p.wobblePhase) * p.wobbleAmount
        // Fade in from the vent or the bottom edge, and out just under the surface.
        let edge = 1
        if (p.y < 90) edge = Math.max(0, p.y / 90)
        const light = sceneLightAt(x, p.y, width, height)
        const alpha = p.opacity * edge * (0.55 + 0.6 * light)
        if (alpha <= 0.02) continue
        ctx.globalAlpha = Math.min(1, alpha)

        if (p.kind === 'bead') {
          const d = p.radius * 2 / 0.72
          ctx.drawImage(sprites.bead, x - d / 2, p.y - d / 2, d, d)
        } else {
          const sprite = p.z > 0.88 ? sprites.soft : p.z > 0.3 ? sprites.sharp : sprites.far
          // Larger bubbles flatten and rock as they rise.
          const squash = p.radius > 8 ? 1 + Math.sin(p.wobblePhase * 1.7) * 0.08 : 1
          const d = (p.radius * 2) / 0.8
          ctx.drawImage(sprite, x - (d * squash) / 2, p.y - d / squash / 2, d * squash, d / squash)
        }
      }
      ctx.globalAlpha = 1
    }

    const resume = () => {
      if (running || isPaused || pausedRef.current || prefersReducedMotion) return
      const now = performance.now()
      lastTime = now
      lastFrameTime = now
      lastRafTimestamp = now
      running = true
      animationFrameId = requestAnimationFrame(render)
    }
    resumeRef.current = resume

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true
        running = false
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
      } else {
        isPaused = false
        resume()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const startTime = performance.now()
    let lastTime = startTime
    let lastFrameTime = startTime
    let lastRafTimestamp = startTime
    const governor = createFpsGovernor(budget.fpsTiers)
    let frameInterval = governor.intervalMs
    lastFrameTime = startTime - frameInterval

    const render = (now: number = performance.now()) => {
      if (isPaused || pausedRef.current) {
        running = false
        return
      }

      const rafDelta = now - lastRafTimestamp
      lastRafTimestamp = now

      const elapsed = now - lastFrameTime
      if (elapsed < frameInterval) {
        if (!prefersReducedMotion && !isPaused) {
          animationFrameId = requestAnimationFrame(render)
        }
        return
      }

      const workStart = performance.now()
      const dt = prefersReducedMotion ? 0 : Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      lastFrameTime = now - (elapsed % frameInterval)

      drawFrame(dt)

      const tierSample = governor.sample(performance.now() - workStart, rafDelta)
      frameInterval = tierSample.intervalMs
      if (tierSample.cullRequested) cullFar()

      if (!prefersReducedMotion && !isPaused) {
        animationFrameId = requestAnimationFrame(render)
      } else {
        running = false
      }
    }

    // Always paint one frame, even when starting paused or under reduced motion.
    running = true
    animationFrameId = requestAnimationFrame((now) => {
      const wasPaused = pausedRef.current
      pausedRef.current = false
      render(now)
      pausedRef.current = wasPaused
      if (pausedRef.current) {
        cancelAnimationFrame(animationFrameId)
        running = false
      }
    })

    return () => {
      resumeRef.current = null
      clearTimeout(resizeTimeout)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [bubbleCount, disabled])

  if (disabled) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
      data-testid="underwater-bubbles-canvas"
    />
  )
}
