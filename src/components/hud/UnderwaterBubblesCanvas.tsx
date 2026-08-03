import React, { useEffect, useRef } from 'react'

interface Bubble {
  x: number
  y: number
  z: number // depth scale: 0.1 (far) .. 1.0 (near)
  radius: number
  speed: number
  wobbleSpeed: number
  wobbleAmount: number
  wobbleOffset: number
  opacity: number
}

interface UnderwaterBubblesCanvasProps {
  bubbleCount?: number
  className?: string
}

export function UnderwaterBubblesCanvas({
  bubbleCount = 45,
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

    // Debounced resize handling
    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (!canvas) return
        width = canvas.width = parent?.clientWidth || window.innerWidth || 800
        height = canvas.height = parent?.clientHeight || window.innerHeight || 600
      }, 100)
    }

    window.addEventListener('resize', handleResize, { passive: true })

    // Respect user reduced-motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    // Initialize 3D underwater bubbles sorted by depth Z
    const bubbles: Bubble[] = Array.from({ length: bubbleCount }, () => {
      const z = Math.random() * 0.9 + 0.1 // depth: 0.1 (far away) to 1.0 (close)
      return {
        x: Math.random() * width,
        y: Math.random() * (height + 100),
        z,
        radius: (Math.random() * 7 + 2.5) * (0.4 + 0.6 * z), // 3D depth-scaled radius
        speed: (Math.random() * 35 + 15) * (0.3 + 0.7 * z), // px/sec, nearer bubbles rise faster
        wobbleSpeed: Math.random() * 1.5 + 0.5,
        wobbleAmount: Math.random() * 18 + 5,
        wobbleOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.45 + 0.15,
      }
    }).sort((a, b) => a.z - b.z) // Pre-sorted depth buffer

    let mouseX = -9999
    let mouseY = -9999

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Pause animation when document/tab is hidden to preserve GPU/battery
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

    let lastTime = performance.now()

    const render = (now: number = performance.now()) => {
      if (isPaused) return

      // Delta time calculation for framerate independence (e.g. 60Hz vs 144Hz)
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i]

        if (!prefersReducedMotion) {
          b.y -= b.speed * dt
          b.wobbleOffset += b.wobbleSpeed * dt
        }

        // Horizontal sine wobble displacement
        const wobbleX = Math.sin(b.wobbleOffset) * b.wobbleAmount * b.z

        // Fast squared-distance cursor repulsion check
        const dx = b.x + wobbleX - mouseX
        const dy = b.y - mouseY
        const distSq = dx * dx + dy * dy
        let pushX = 0

        // Repel only if within 100px radius (10,000 px^2)
        if (distSq < 10000 && distSq > 0) {
          const dist = Math.sqrt(distSq)
          const force = (1 - dist / 100) * 6 * b.z
          pushX = (dx / dist) * force
        }

        const renderX = b.x + wobbleX + pushX
        const renderY = b.y

        // Respawn at bottom when floating above the screen top
        if (renderY < -30) {
          b.y = height + Math.random() * 40
          b.x = Math.random() * width
          b.wobbleOffset = Math.random() * Math.PI * 2
        }

        // Vertical boundary fade-out
        let edgeAlpha = 1
        if (renderY < 80) {
          edgeAlpha = Math.max(0, renderY / 80)
        } else if (renderY > height - 50) {
          edgeAlpha = Math.max(0, (height - renderY) / 50)
        }

        const currentOpacity = b.opacity * edgeAlpha * (0.35 + 0.65 * b.z)

        if (currentOpacity <= 0.01) continue

        // 1. Soft Outer Hydro Radial Glow
        const outerGlowRadius = b.radius * 2.2
        const glowGrad = ctx.createRadialGradient(
          renderX,
          renderY,
          b.radius * 0.4,
          renderX,
          renderY,
          outerGlowRadius
        )
        glowGrad.addColorStop(0, `rgba(0, 255, 255, ${currentOpacity * 0.35})`)
        glowGrad.addColorStop(0.5, `rgba(0, 195, 255, ${currentOpacity * 0.12})`)
        glowGrad.addColorStop(1, 'rgba(0, 255, 255, 0)')

        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(renderX, renderY, outerGlowRadius, 0, Math.PI * 2)
        ctx.fill()

        // 2. 3D Spherical Bubble Shell Gradient
        const shellGrad = ctx.createRadialGradient(
          renderX - b.radius * 0.3,
          renderY - b.radius * 0.3,
          b.radius * 0.1,
          renderX,
          renderY,
          b.radius
        )
        shellGrad.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.65})`)
        shellGrad.addColorStop(0.4, `rgba(0, 240, 255, ${currentOpacity * 0.35})`)
        shellGrad.addColorStop(0.85, `rgba(0, 180, 220, ${currentOpacity * 0.25})`)
        shellGrad.addColorStop(1, `rgba(0, 255, 255, ${currentOpacity * 0.75})`)

        ctx.beginPath()
        ctx.arc(renderX, renderY, b.radius, 0, Math.PI * 2)
        ctx.fillStyle = shellGrad
        ctx.fill()

        // 3. Highlight Specular Spot (Top-Left 3D specular shine)
        ctx.beginPath()
        ctx.arc(
          renderX - b.radius * 0.35,
          renderY - b.radius * 0.35,
          b.radius * 0.26,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.85})`
        ctx.fill()
      }

      if (!prefersReducedMotion && !isPaused) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    // Start render loop
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
