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
  clusterCenterX?: number
  bokehRingWidth?: number
}

interface UnderwaterBubblesCanvasProps {
  bubbleCount?: number
  className?: string
}

export function UnderwaterBubblesCanvas({
  bubbleCount = 200,
  className = 'absolute inset-0 pointer-events-none z-0',
}: UnderwaterBubblesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let isPaused = false

    const parent = canvas.parentElement
    let width = (canvas.width = parent?.clientWidth || window.innerWidth || 800)
    let height = (canvas.height = parent?.clientHeight || window.innerHeight || 600)

    // Cache top radial sun glow to avoid allocating gradient objects inside requestAnimationFrame
    let cachedSunGlow: CanvasGradient | string | null = null
    const updateSunGlowCache = () => {
      const sunX = width * 0.5
      const sunY = -20
      const sunGlowRadius = Math.max(width * 0.45, 380)

      if (typeof ctx.createRadialGradient === 'function') {
        const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunGlowRadius)
        glow.addColorStop(0, 'rgba(0, 255, 255, 0.12)')
        glow.addColorStop(0.4, 'rgba(0, 195, 255, 0.05)')
        glow.addColorStop(1, 'rgba(0, 255, 255, 0)')
        cachedSunGlow = glow
      } else {
        cachedSunGlow = 'rgba(0, 255, 255, 0.05)'
      }
    }
    updateSunGlowCache()

    // Debounced resize handling
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

    // Respect user reduced-motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    // Hydrothermal plume cluster centers across the X axis (strong central column)
    let clusterCenters: number[] = []
    const updateClusterCenters = () => {
      clusterCenters = [
        width * 0.18,
        width * 0.42, // Main dense central plume
        width * 0.48, // Main dense central plume
        width * 0.54, // Main dense central plume
        width * 0.82,
      ]
    }
    updateClusterCenters()

    // Helper to generate particles (fizz, standard 3D bubble, or bokeh ring)
    const createParticle = (initialY?: number): Particle => {
      const roll = Math.random()

      let type: ParticleType
      if (roll < 0.58) {
        type = 'fizz' // 58% micro-fizz particles
      } else if (roll < 0.86) {
        type = 'standard' // 28% crisp 3D spherical bubbles
      } else {
        type = 'bokeh' // 14% out-of-focus bokeh rings
      }

      const z = Math.random() * 0.92 + 0.08
      const isClustered = Math.random() < 0.88 // 88% focused inside plumes

      let x: number
      let clusterCenterX: number | undefined
      if (isClustered && clusterCenters.length > 0) {
        const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
        clusterCenterX = center
        // Tighter cluster spread for fizz, wider for bokeh
        const spread = type === 'fizz' ? 35 : type === 'bokeh' ? 85 : 55
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
        radius = (Math.random() * 1.8 + 0.6) * (0.4 + 0.6 * z)
        speed = (Math.random() * 140 + 60) * (0.45 + 0.55 * z)
        opacity = Math.random() * 0.55 + 0.25
      } else if (type === 'standard') {
        const sizePower = Math.pow(Math.random(), 2.0)
        radius = (sizePower * 14 + 3.5) * (0.35 + 0.65 * z)
        speed = (Math.random() * 110 + 45) * (0.4 + 0.6 * z)
        opacity = Math.random() * 0.45 + 0.2
      } else {
        // Bokeh particle: large radius, soft translucency, crisp bokeh stroke rim
        radius = (Math.random() * 22 + 14) * (0.5 + 0.5 * z)
        speed = (Math.random() * 80 + 35) * (0.35 + 0.65 * z)
        opacity = Math.random() * 0.3 + 0.12
        bokehRingWidth = Math.random() * 2.5 + 1.2
      }

      return {
        type,
        x,
        y: initialY !== undefined ? initialY : Math.random() * (height + 140),
        z,
        radius,
        speed,
        wobbleSpeed: Math.random() * 2.5 + 0.8,
        wobbleAmount: Math.random() * 18 + 4,
        wobbleOffset: Math.random() * Math.PI * 2,
        opacity,
        clusterCenterX,
        bokehRingWidth,
      }
    }

    // Initialize particles sorted by depth Z
    const particles: Particle[] = Array.from({ length: bubbleCount }, () => createParticle()).sort(
      (a, b) => a.z - b.z
    )

    let mouseX = -9999
    let mouseY = -9999

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Pause animation when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
      } else {
        isPaused = false
        lastTime = performance.now()
        animationFrameId = requestAnimationFrame(render)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const startTime = performance.now()
    let lastTime = startTime

    const render = (now: number = performance.now()) => {
      if (isPaused) return

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      // -------------------------------------------------------------------
      // 1. VERY SLIGHT TOP-CENTER SURFACE RADIAL GLOW (CACHED)
      // -------------------------------------------------------------------
      if (cachedSunGlow) {
        const sunX = width * 0.5
        const sunY = -20
        const sunGlowRadius = Math.max(width * 0.45, 380)

        ctx.fillStyle = cachedSunGlow
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunGlowRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // -------------------------------------------------------------------
      // 2. MULTI-TIER BOKEH & EFFERVESCENT BUBBLE PARTICLES
      // Batch micro-fizz particles for zero path recreation latency
      // -------------------------------------------------------------------
      const fizzParticles: { x: number; y: number; r: number }[] = []

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (!prefersReducedMotion) {
          p.y -= p.speed * dt
          p.wobbleOffset += p.wobbleSpeed * dt
        }

        // Wobble displacement
        const wobbleX = Math.sin(p.wobbleOffset) * p.wobbleAmount * p.z

        // Mouse repulsion
        const dx = p.x + wobbleX - mouseX
        const dy = p.y - mouseY
        const distSq = dx * dx + dy * dy
        let pushX = 0

        if (distSq < 14000 && distSq > 0) {
          const dist = Math.sqrt(distSq)
          const force = (1 - dist / 118) * (p.type === 'bokeh' ? 12 : 7) * p.z
          pushX = (dx / dist) * force
        }

        const renderX = p.x + wobbleX + pushX
        const renderY = p.y

        // Respawn at bottom when floating above screen top
        if (renderY < -50) {
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
          p.clusterCenterX = newP.clusterCenterX
          p.bokehRingWidth = newP.bokehRingWidth
        }

        // Vertical boundary fade
        let edgeAlpha = 1
        if (renderY < 100) {
          edgeAlpha = Math.max(0, renderY / 100)
        } else if (renderY > height - 60) {
          edgeAlpha = Math.max(0, (height - renderY) / 60)
        }

        const currentOpacity = p.opacity * edgeAlpha * (0.35 + 0.65 * p.z)

        if (currentOpacity <= 0.01) continue

        if (p.type === 'fizz') {
          // Collect micro-fizz positions to draw in a single batched path pass
          fizzParticles.push({ x: renderX, y: renderY, r: p.radius })
        } else if (p.type === 'bokeh') {
          // --- TIER 2: BOKEH RINGS ---
          if (typeof ctx.createRadialGradient === 'function') {
            const bokehGrad = ctx.createRadialGradient(
              renderX,
              renderY,
              p.radius * 0.2,
              renderX,
              renderY,
              p.radius
            )
            bokehGrad.addColorStop(0, `rgba(0, 240, 255, ${currentOpacity * 0.12})`)
            bokehGrad.addColorStop(0.7, `rgba(0, 200, 240, ${currentOpacity * 0.08})`)
            bokehGrad.addColorStop(1, `rgba(160, 255, 255, ${currentOpacity * 0.6})`)

            ctx.beginPath()
            ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2)
            ctx.fillStyle = bokehGrad
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.lineWidth = p.bokehRingWidth || 1.5
          ctx.strokeStyle = `rgba(160, 255, 255, ${currentOpacity * 0.6})`
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(
            renderX - p.radius * 0.3,
            renderY - p.radius * 0.3,
            p.radius * 0.3,
            0,
            Math.PI * 2
          )
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.75})`
          ctx.fill()
        } else {
          // --- TIER 3: STANDARD CRISP 3D SPHERICAL BUBBLE ---
          const outerGlowRadius = p.radius * 2.2
          if (typeof ctx.createRadialGradient === 'function') {
            const glowGrad = ctx.createRadialGradient(
              renderX,
              renderY,
              p.radius * 0.35,
              renderX,
              renderY,
              outerGlowRadius
            )
            glowGrad.addColorStop(0, `rgba(0, 255, 255, ${currentOpacity * 0.38})`)
            glowGrad.addColorStop(0.5, `rgba(0, 195, 255, ${currentOpacity * 0.14})`)
            glowGrad.addColorStop(1, 'rgba(0, 255, 255, 0)')

            ctx.fillStyle = glowGrad
            ctx.beginPath()
            ctx.arc(renderX, renderY, outerGlowRadius, 0, Math.PI * 2)
            ctx.fill()

            const shellGrad = ctx.createRadialGradient(
              renderX - p.radius * 0.3,
              renderY - p.radius * 0.3,
              p.radius * 0.08,
              renderX,
              renderY,
              p.radius
            )
            shellGrad.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.75})`)
            shellGrad.addColorStop(0.4, `rgba(0, 240, 255, ${currentOpacity * 0.38})`)
            shellGrad.addColorStop(0.85, `rgba(0, 180, 220, ${currentOpacity * 0.25})`)
            shellGrad.addColorStop(1, `rgba(0, 255, 255, ${currentOpacity * 0.85})`)

            ctx.beginPath()
            ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2)
            ctx.fillStyle = shellGrad
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2)
            ctx.fill()
          }

          const highlightRadius = Math.max(0.75, p.radius * 0.28)
          ctx.beginPath()
          ctx.arc(
            renderX - p.radius * 0.35,
            renderY - p.radius * 0.35,
            highlightRadius,
            0,
            Math.PI * 2
          )
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.92})`
          ctx.fill()
        }
      }

      // Render all micro-fizz particles in a single batched path fill for ultra-low draw-call latency
      if (fizzParticles.length > 0) {
        ctx.fillStyle = 'rgba(220, 255, 255, 0.75)'
        ctx.beginPath()
        for (let j = 0; j < fizzParticles.length; j++) {
          const fp = fizzParticles[j]
          ctx.moveTo(fp.x + fp.r, fp.y)
          ctx.arc(fp.x, fp.y, fp.r, 0, Math.PI * 2)
        }
        ctx.fill()
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
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [bubbleCount])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      data-testid="underwater-bubbles-canvas"
    />
  )
}
