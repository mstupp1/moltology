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

const DEFAULT_BUBBLE_VARIANTS = [
  '/images/bubble_variant_1.jpg',
  '/images/bubble_variant_2.jpg',
  '/images/bubble_variant_3.jpg',
]

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
    const standardSprite = createStandardBubbleSprite(128)
    const bokehSprite = createBokehBubbleSprite(128)
    const fizzSprite = createFizzBubbleSprite(32)

    const targetSources = customBubbleSrcs
      ? customBubbleSrcs
      : customBubbleSrc
      ? [customBubbleSrc]
      : DEFAULT_BUBBLE_VARIANTS

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

    let cachedSunGlow: CanvasGradient | string | null = null
    const updateSunGlowCache = () => {
      const sunX = width * 0.5
      const sunY = -20
      const sunGlowRadius = Math.max(width * 0.45, 380)

      if (typeof ctx.createRadialGradient === 'function') {
        const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunGlowRadius)
        glow.addColorStop(0, 'rgba(0, 255, 255, 0.18)')
        glow.addColorStop(0.4, 'rgba(0, 195, 255, 0.08)')
        glow.addColorStop(1, 'rgba(0, 255, 255, 0)')
        cachedSunGlow = glow
      } else {
        cachedSunGlow = 'rgba(0, 255, 255, 0.08)'
      }
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

    const createParticle = (initialY?: number): Particle => {
      const roll = Math.random()

      let type: ParticleType
      if (roll < 0.35) {
        type = 'fizz'
      } else if (roll < 0.78) {
        type = 'standard'
      } else {
        type = 'bokeh'
      }

      const z = Math.random() * 0.92 + 0.08
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

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
      } else {
        isPaused = false
        lastTime = performance.now()
        lastFrameTime = performance.now()
        animationFrameId = requestAnimationFrame(render)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const startTime = performance.now()
    let lastTime = startTime
    let lastFrameTime = startTime
    const TARGET_FPS = isMobile ? 30 : 36
    const FRAME_INTERVAL = 1000 / TARGET_FPS

    const render = (now: number = performance.now()) => {
      if (isPaused) return

      const elapsed = now - lastFrameTime
      if (elapsed < FRAME_INTERVAL) {
        if (!prefersReducedMotion && !isPaused) {
          animationFrameId = requestAnimationFrame(render)
        }
        return
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      lastFrameTime = now - (elapsed % FRAME_INTERVAL)

      ctx.clearRect(0, 0, width, height)

      if (cachedSunGlow) {
        const sunX = width * 0.5
        const sunY = -20
        const sunGlowRadius = Math.max(width * 0.45, 380)

        ctx.fillStyle = cachedSunGlow
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunGlowRadius, 0, Math.PI * 2)
        ctx.fill()
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
          const newP = createParticle(height + Math.random() * 50 + 10)
          p.type = newP.type
          p.x = newP.x
          p.y = newP.y
          p.z = newP.z
          p.radius = newP.radius
          p.speed = newP.speed
          p.wobbleSpeed = newP.wobbleSpeed
          p.wobbleAmount = newP.wobbleAmount
          p.wobbleOffset = newP.wobbleOffset
          p.opacity = newP.opacity
          p.variantIndex = newP.variantIndex
          p.clusterCenterX = newP.clusterCenterX
          p.bokehRingWidth = newP.bokehRingWidth
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


