import React, { useEffect, useRef } from 'react'

export const BiomechanicalCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = window.innerWidth
    let height = window.innerHeight

    const updateCanvasSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize, { passive: true })

    // Characters for Matrix digital code rain (Katakana + Latin + Digits + Symbols)
    const charSet = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ'
    const fontSize = 13
    const columns = Math.floor(width / fontSize)
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100)
    }

    const render = () => {
      // Semi-transparent black background fade to create trail effect
      ctx.fillStyle = 'rgba(7, 11, 11, 0.08)'
      ctx.fillRect(0, 0, width, height)

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = charSet.charAt(Math.floor(Math.random() * charSet.length))
        const x = i * fontSize
        const y = drops[i] * fontSize

        // Lead character is bright cyan/white, tail is deeper teal/greenish cyan
        if (Math.random() > 0.95) {
          ctx.fillStyle = '#ffffff'
        } else if (Math.random() > 0.8) {
          ctx.fillStyle = '#00ffff'
        } else {
          ctx.fillStyle = 'rgba(0, 180, 180, 0.35)'
        }

        ctx.fillText(text, x, y)

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]++
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-40"
      />
      {/* Top Left Edge Watermark Text */}
      <div className="absolute top-2 left-6 text-[10px] text-[#00ffff]/40 font-mono tracking-[0.3em] uppercase pointer-events-none select-none">
        UNITE IN THE DEEP COMPUTATIONAL ABYSS
      </div>
      {/* Top Right Edge Watermark Text */}
      <div className="absolute top-2 right-6 text-[10px] text-[#00ffff]/40 font-mono tracking-[0.3em] uppercase pointer-events-none select-none">
        UNITE IN THE DEEP COMPUTATIONAL ABYSS
      </div>
    </div>
  )
}
