import React, { useEffect, useRef } from 'react'

type ParticleType = 'fizz' | 'standard' | 'bokeh'

interface Particle {
  type: ParticleType
  x: number
  y: number
  z: number // depth scale: 0.05 (far background) .. 1.0 (near camera lens)
  radius: number
  speed: number
  wobbleSpeed: number
  wobbleAmount: number
  wobbleOffset: number
  opacity: number
  variantIndex: number
  clusterCenterX?: number
  bokehRingWidth?: number
}

export interface UnderwaterBubblesCanvasProps {
  bubbleCount?: number
  className?: string
  /**
   * Single URL to a custom bubble graphic asset.
   */
  customBubbleSrc?: string
  /**
   * Array of URLs for distinct bubble graphic variants.
   */
  customBubbleSrcs?: string[]
  /**
   * Chroma key color mode for custom image assets: 'green' | 'black' | 'auto'. Defaults to 'black'.
   */
  chromaKeyMode?: 'green' | 'black' | 'auto'
  /**
   * Disables canvas particle physics & animation frame loop when true.
   */
  disabled?: boolean
}

/**
 * Stable module-level variant source list. Sharing one array identity between
 * callers (e.g. HudLayout) and the component prevents effect churn from fresh
 * inline literals on every parent re-render.
 */
export const BUBBLE_VARIANT_SRCS: string[] = [
  '/images/bubble_variant_1.jpg',
  '/images/bubble_variant_2.jpg',
  '/images/bubble_variant_3.jpg',
]

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

/**
 * Creates a chroma-keyed transparent offscreen canvas from a source image or canvas.
 * Keying out green screen or black background pixels to 0 alpha for ultra-fast sprite rendering.
 */
export function createChromaKeyedSprite(
  source: HTMLCanvasElement | HTMLImageElement,
  keyMode: 'green' | 'black' | 'auto' = 'auto'
): HTMLCanvasElement {
  const width = (source as HTMLImageElement).naturalWidth || source.width || 128
  const height = (source as HTMLImageElement).naturalHeight || source.height || 128

  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height

  const ctx = offscreen.getContext('2d', { alpha: true })
  if (!ctx) return offscreen

  ctx.drawImage(source, 0, 0, width, height)

  try {
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      let isKeyPixel = false
      const isGreenPixel = g > 100 && g > r * 1.3 && g > b * 1.3
      const isBlackPixel = r < 25 && g < 25 && b < 25

      if ((keyMode === 'green' || keyMode === 'auto') && isGreenPixel) {
        isKeyPixel = true
      } else if ((keyMode === 'black' || keyMode === 'auto') && isBlackPixel) {
        isKeyPixel = true
      }

      if (isKeyPixel) {
        data[i + 3] = 0 // Transparent alpha
      }
    }

    ctx.putImageData(imgData, 0, 0)
  } catch (err) {
    // Tainted canvas security fallback: screen blend mode will key out black background
  }

  return offscreen
}

/**
 * Pre-renders high-detail 3D Glass Spherical Bubble sprite to an offscreen canvas.
 */
function createStandardBubbleSprite(size = 128): HTMLCanvasElement {
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size

  const ctx = offscreen.getContext('2d', { alpha: true })
  if (!ctx) return offscreen

  const center = size / 2
  const radius = size * 0.42

  if (typeof ctx.createRadialGradient === 'function') {
    const glowGrad = ctx.createRadialGradient(center, center, radius * 0.35, center, center, size * 0.5)
    glowGrad.addColorStop(0, 'rgba(0, 255, 255, 0.65)')
    glowGrad.addColorStop(0.5, 'rgba(0, 195, 255, 0.25)')
    glowGrad.addColorStop(1, 'rgba(0, 255, 255, 0)')

    ctx.fillStyle = glowGrad
    ctx.beginPath()
    ctx.arc(center, center, size * 0.5, 0, Math.PI * 2)
    ctx.fill()

    const shellGrad = ctx.createRadialGradient(
      center - radius * 0.3,
      center - radius * 0.3,
      radius * 0.08,
      center,
      center,
      radius
    )
    shellGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
    shellGrad.addColorStop(0.38, 'rgba(0, 240, 255, 0.65)')
    shellGrad.addColorStop(0.82, 'rgba(0, 180, 220, 0.45)')
    shellGrad.addColorStop(1, 'rgba(0, 255, 255, 0.95)')

    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fillStyle = shellGrad
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)'
    ctx.fill()
  }

  const highlightRadius = radius * 0.28
  ctx.beginPath()
  ctx.arc(
    center - radius * 0.35,
    center - radius * 0.35,
    highlightRadius,
    0,
    Math.PI * 2
  )
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'
  ctx.fill()

  return offscreen
}

/**
 * Pre-renders Chroma-Keyed Bokeh Ring Bubble sprite to an offscreen canvas.
 */
function createBokehBubbleSprite(size = 128): HTMLCanvasElement {
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size

  const ctx = offscreen.getContext('2d', { alpha: true })
  if (!ctx) return offscreen

  const center = size / 2
  const radius = size * 0.44

  if (typeof ctx.createRadialGradient === 'function') {
    const bokehGrad = ctx.createRadialGradient(center, center, radius * 0.2, center, center, radius)
    bokehGrad.addColorStop(0, 'rgba(0, 240, 255, 0.25)')
    bokehGrad.addColorStop(0.7, 'rgba(0, 200, 240, 0.18)')
    bokehGrad.addColorStop(1, 'rgba(160, 255, 255, 0.85)')

    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fillStyle = bokehGrad
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)'
    ctx.fill()
  }

  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(160, 255, 255, 0.85)'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(center - radius * 0.3, center - radius * 0.3, radius * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fill()

  return offscreen
}

/**
 * Pre-renders Micro-Fizz Particle sprite to an offscreen canvas.
 */
function createFizzBubbleSprite(size = 32): HTMLCanvasElement {
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size

  const ctx = offscreen.getContext('2d', { alpha: true })
  if (!ctx) return offscreen

  const center = size / 2
  const radius = size * 0.4

  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(220, 255, 255, 0.95)'
  ctx.fill()

  return offscreen
}

// Global persistent particle store and sprite cache across route transitions & re-mounts
let globalParticles: Particle[] | null = null
let globalCustomSpritesCache: Record<string, HTMLCanvasElement> = {}

interface ProceduralSpriteSet {
  standard: HTMLCanvasElement
  bokeh: HTMLCanvasElement
  fizz: HTMLCanvasElement
}

// Procedural sprites are deterministic: bake them once per session and reuse
// across effect re-runs instead of re-rendering gradients on every mount.
let globalProceduralSprites: ProceduralSpriteSet | null = null

function getProceduralSprites(): ProceduralSpriteSet {
  if (!globalProceduralSprites) {
    globalProceduralSprites = {
      standard: createStandardBubbleSprite(128),
      bokeh: createBokehBubbleSprite(128),
      fizz: createFizzBubbleSprite(32),
    }
  }
  return globalProceduralSprites
}

export function UnderwaterBubblesCanvas({
  bubbleCount = 90,
  className = 'absolute inset-0 pointer-events-none z-0',
  customBubbleSrc,
  customBubbleSrcs,
  chromaKeyMode = 'black',
  disabled = false,
}: UnderwaterBubblesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let isPaused = false

    const parent = canvas.parentElement
    let width = (canvas.width = parent?.clientWidth || window.innerWidth || 800)
    let height = (canvas.height = parent?.clientHeight || window.innerHeight || 600)

    // -------------------------------------------------------------------
    // PRE-RENDERED HARDWARE-ACCELERATED SPRITE TEXTURE CACHE
    // -------------------------------------------------------------------
    const { standard: standardSprite, bokeh: bokehSprite, fizz: fizzSprite } = getProceduralSprites()

    const targetSources = customBubbleSrcs
      ? customBubbleSrcs
      : customBubbleSrc
      ? [customBubbleSrc]
      : BUBBLE_VARIANT_SRCS

    const customSprites: HTMLCanvasElement[] = []

    if (typeof window !== 'undefined') {
      targetSources.forEach((src, idx) => {
        if (globalCustomSpritesCache[src]) {
          customSprites[idx] = globalCustomSpritesCache[src]
        } else {
          const img = new Image()
          img.onload = () => {
            const sprite = createChromaKeyedSprite(img, chromaKeyMode)
            globalCustomSpritesCache[src] = sprite
            customSprites[idx] = sprite
          }
          img.src = src
        }
      })
    }

    // -------------------------------------------------------------------
    // BAKED SUN GLOW BITMAP
    // -------------------------------------------------------------------
    // The sun glow is static between resizes; re-filling a huge radial
    // gradient every frame is the most expensive op in the loop. Bake it
    // once into an offscreen canvas cropped to its on-screen region, then
    // blit with a single drawImage per frame (pixel-identical output).
    let cachedSunGlowSprite: HTMLCanvasElement | null = null
    let sunGlowDestX = 0
    let sunGlowDestY = 0
    const updateSunGlowCache = () => {
      const sunX = width * 0.5
      const sunY = -20
      const sunGlowRadius = Math.max(width * 0.45, 380)

      const glowLeft = Math.max(0, sunX - sunGlowRadius)
      const glowTop = Math.max(0, sunY - sunGlowRadius)
      const glowRight = Math.min(width, sunX + sunGlowRadius)
      const glowBottom = Math.min(height, sunY + sunGlowRadius)
      const glowWidth = Math.max(1, Math.ceil(glowRight - glowLeft))
      const glowHeight = Math.max(1, Math.ceil(glowBottom - glowTop))

      const glowCanvas = document.createElement('canvas')
      glowCanvas.width = glowWidth
      glowCanvas.height = glowHeight
      const glowCtx = glowCanvas.getContext('2d', { alpha: true })

      if (glowCtx) {
        const localX = sunX - glowLeft
        const localY = sunY - glowTop

        if (typeof glowCtx.createRadialGradient === 'function') {
          const glow = glowCtx.createRadialGradient(localX, localY, 10, localX, localY, sunGlowRadius)
          glow.addColorStop(0, 'rgba(0, 255, 255, 0.18)')
          glow.addColorStop(0.4, 'rgba(0, 195, 255, 0.08)')
          glow.addColorStop(1, 'rgba(0, 255, 255, 0)')
          glowCtx.fillStyle = glow
        } else {
          glowCtx.fillStyle = 'rgba(0, 255, 255, 0.08)'
        }
        glowCtx.beginPath()
        glowCtx.arc(localX, localY, sunGlowRadius, 0, Math.PI * 2)
        glowCtx.fill()
      }

      cachedSunGlowSprite = glowCanvas
      sunGlowDestX = glowLeft
      sunGlowDestY = glowTop
    }
    updateSunGlowCache()

    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (!canvas) return
        width = canvas.width = parent?.clientWidth || window.innerWidth || 800
        height = canvas.height = parent?.clientHeight || window.innerHeight || 600
        updateClusterCenters()
        updateSunGlowCache()
      }, 100)
    }

    window.addEventListener('resize', handleResize, { passive: true })

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    let clusterCenters: number[] = []
    const updateClusterCenters = () => {
      clusterCenters = [
        width * 0.15,
        width * 0.35,
        width * 0.50,
        width * 0.65,
        width * 0.85,
      ]
    }
    updateClusterCenters()

    const createParticle = (initialY?: number, zOverride?: number): Particle => {
      const roll = Math.random()

      let type: ParticleType
      if (roll < 0.35) {
        type = 'fizz'
      } else if (roll < 0.78) {
        type = 'standard'
      } else {
        type = 'bokeh'
      }

      const z = zOverride ?? Math.random() * 0.92 + 0.08
      const isClustered = Math.random() < 0.88

      let x: number
      let clusterCenterX: number | undefined
      if (isClustered && clusterCenters.length > 0) {
        const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
        clusterCenterX = center
        const spread = type === 'fizz' ? 45 : type === 'bokeh' ? 95 : 65
        const clusterJitter = (Math.random() + Math.random() - 1) * spread
        x = center + clusterJitter
      } else {
        x = Math.random() * width
      }

      let radius: number
      let speed: number
      let opacity: number
      let bokehRingWidth: number | undefined

      if (type === 'fizz') {
        radius = (Math.random() * 3.0 + 1.2) * (0.5 + 0.5 * z)
        speed = (Math.random() * 140 + 60) * (0.45 + 0.55 * z)
        opacity = Math.random() * 0.6 + 0.35
      } else if (type === 'standard') {
        const sizePower = Math.pow(Math.random(), 1.8)
        radius = (sizePower * 26 + 8.0) * (0.4 + 0.6 * z)
        speed = (Math.random() * 110 + 45) * (0.4 + 0.6 * z)
        opacity = Math.random() * 0.65 + 0.35
      } else {
        radius = (Math.random() * 34 + 20) * (0.5 + 0.5 * z)
        speed = (Math.random() * 80 + 35) * (0.35 + 0.65 * z)
        opacity = Math.random() * 0.45 + 0.25
        bokehRingWidth = Math.random() * 2.5 + 1.2
      }

      const variantIndex = Math.floor(Math.random() * targetSources.length)

      return {
        type,
        x,
        y: initialY !== undefined ? initialY : Math.random() * (height + 140),
        z,
        radius,
        speed,
        wobbleSpeed: Math.random() * 2.5 + 0.8,
        wobbleAmount: Math.random() * 20 + 6,
        wobbleOffset: Math.random() * Math.PI * 2,
        opacity,
        variantIndex,
        clusterCenterX,
        bokehRingWidth,
      }
    }

    // Dynamic particle count scaling for mobile devices
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const activeParticleCount = isMobile ? Math.min(bubbleCount, 40) : bubbleCount

    // Reuse persistent global particle positions across page changes & re-renders
    let particles: Particle[]
    if (globalParticles && globalParticles.length === activeParticleCount) {
      particles = globalParticles
    } else {
      particles = Array.from({ length: activeParticleCount }, () => createParticle()).sort(
        (a, b) => a.z - b.z
      )
      globalParticles = particles
    }

    const applyParticle = (target: Particle, src: Particle) => {
      target.type = src.type
      target.x = src.x
      target.y = src.y
      target.z = src.z
      target.radius = src.radius
      target.speed = src.speed
      target.wobbleSpeed = src.wobbleSpeed
      target.wobbleAmount = src.wobbleAmount
      target.wobbleOffset = src.wobbleOffset
      target.opacity = src.opacity
      target.variantIndex = src.variantIndex
      target.clusterCenterX = src.clusterCenterX
      target.bokehRingWidth = src.bokehRingWidth
    }

    // One-time overdraw relief for the lowest FPS tier: near-invisible far
    // fizz is recycled into visible mid/near bubbles so perceived density
    // stays constant while tiny high-churn sprites disappear.
    let farFizzCulled = false
    const cullFarFizz = () => {
      if (farFizzCulled) return
      farFizzCulled = true
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (p.type === 'fizz' && p.z < 0.25) {
          applyParticle(p, createParticle(height + Math.random() * 50 + 10, 0.45 + Math.random() * 0.5))
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
      } else {
        isPaused = false
        const now = performance.now()
        lastTime = now
        lastFrameTime = now
        lastRafTimestamp = now
        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(render)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const startTime = performance.now()
    let lastTime = startTime
    let lastFrameTime = startTime
    let lastRafTimestamp = startTime
    const governor = createFpsGovernor(isMobile ? [30, 24, 18] : [36, 24, 18])
    let frameInterval = governor.intervalMs

    const render = (now: number = performance.now()) => {
      if (isPaused) return

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
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      lastFrameTime = now - (elapsed % frameInterval)

      ctx.clearRect(0, 0, width, height)

      if (cachedSunGlowSprite) {
        ctx.drawImage(cachedSunGlowSprite, sunGlowDestX, sunGlowDestY)
      }

      // Set blend mode ONCE for particle sprites to avoid context flushing
      if (chromaKeyMode === 'black' || chromaKeyMode === 'auto') {
        ctx.globalCompositeOperation = 'screen'
      }

      // Hardware-accelerated multi-variant sprite draw loop
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (!prefersReducedMotion) {
          p.y -= p.speed * dt
          p.wobbleOffset += p.wobbleSpeed * dt
        }

        const renderX = p.x + Math.sin(p.wobbleOffset) * p.wobbleAmount * p.z
        const renderY = p.y

        if (renderY < -60) {
          applyParticle(p, createParticle(height + Math.random() * 50 + 10))
        }

        let edgeAlpha = 1
        if (renderY < 100) {
          edgeAlpha = Math.max(0, renderY / 100)
        } else if (renderY > height - 60) {
          edgeAlpha = Math.max(0, (height - renderY) / 60)
        }

        const currentOpacity = p.opacity * edgeAlpha * (0.45 + 0.55 * p.z)

        if (currentOpacity <= 0.01) continue

        // Select sprite texture from custom variants or fallbacks
        const customVariant = customSprites[p.variantIndex]
        const activeSprite =
          customVariant ||
          (p.type === 'fizz' ? fizzSprite : p.type === 'bokeh' ? bokehSprite : standardSprite)

        ctx.globalAlpha = currentOpacity
        const size = p.radius * 2

        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(activeSprite, renderX - p.radius, renderY - p.radius, size, size)
        }
      }

      // Reset canvas context state ONCE after draw loop finishes
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0

      const renderMs = performance.now() - workStart
      const tierSample = governor.sample(renderMs, rafDelta)
      frameInterval = tierSample.intervalMs
      if (tierSample.cullRequested) {
        cullFarFizz()
      }

      if (!prefersReducedMotion && !isPaused) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      clearTimeout(resizeTimeout)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [bubbleCount, customBubbleSrc, customBubbleSrcs, chromaKeyMode, disabled])

  if (disabled) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      data-testid="underwater-bubbles-canvas"
    />
  )
}


