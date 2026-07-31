import React, { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  pulse: number
}

export const BiomechanicalCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // Node collection for synaptic network
    const nodeCount = Math.floor(Math.min(width, height) / 18)
    const nodes: Node[] = []
    const colors = ['#00ffff', '#ff0000', '#00e5ff', '#39ff14', '#ff0055']

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
      })
    }

    let time = 0

    const render = () => {
      time += 0.02
      ctx.clearRect(0, 0, width, height)

      // Draw subtle background radial ambient glow
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 3,
        50,
        width / 2,
        height / 2,
        width * 0.75
      )
      grad.addColorStop(0, 'rgba(0, 255, 255, 0.03)')
      grad.addColorStop(0.5, 'rgba(255, 0, 0, 0.015)')
      grad.addColorStop(1, 'rgba(7, 11, 11, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Update & Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        node.x += node.vx
        node.y += node.vy
        node.pulse += 0.03

        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1

        // Mouse repelling physics
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - node.x
          const dy = mouseRef.current.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 140

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist
            node.x -= (dx / dist) * force * 2
            node.y -= (dy / dist) * force * 2
          }
        }

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const targetNode = nodes[j]
          const dx = targetNode.x - node.x
          const dy = targetNode.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.18
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(targetNode.x, targetNode.y)
            ctx.strokeStyle =
              node.color === '#ff0000' || targetNode.color === '#ff0000'
                ? `rgba(255, 0, 0, ${alpha})`
                : `rgba(0, 255, 255, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }

        // Draw node dot
        const pulsedRadius = node.radius + Math.sin(node.pulse) * 0.6
        ctx.beginPath()
        ctx.arc(node.x, node.y, Math.max(0.5, pulsedRadius), 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.shadowBlur = 8
        ctx.shadowColor = node.color
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Draw cursor interactive energy ring if inside canvas
      if (mouseRef.current.active) {
        ctx.beginPath()
        ctx.arc(
          mouseRef.current.x,
          mouseRef.current.y,
          35 + Math.sin(time * 3) * 4,
          0,
          Math.PI * 2
        )
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  )
}
