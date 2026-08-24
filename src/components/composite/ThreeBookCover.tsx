import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export interface ThreeBookCoverProps {
  width?: number
  height?: number
  bookWidth?: number
  bookHeight?: number
  bookThickness?: number
  rotateY?: number
  rotateX?: number
  rotateZ?: number
  coverImageUrl?: string
  coverEyebrow?: string
  coverTitlePart1?: string
  coverTitlePart2?: string
  coverSubtitle?: string
  coverTagline?: string
  spineTitle?: string
  themeVariant?: 'cyan' | 'amber' | 'emerald' | 'gold'
  className?: string
}

/**
 * ThreeBookCover
 * Large-format Three.js Photorealistic 3D Hardcover Book mockup.
 * Features:
 * - Large 3D presence (460px x 580px)
 * - Matte dark obsidian hardcover finish with zero harsh neon borders
 * - Huge 2-tone typography ("MOLT" + "MAXXING")
 * - 3D rising bar chart with gold trendline and dark matte badges
 * - Robust WebGL renderer with automatic high-res 2D fallback
 */
export const ThreeBookCover: React.FC<ThreeBookCoverProps> = ({
  width = 460,
  height = 580,
  bookWidth = 3.3,
  bookHeight = 4.6,
  bookThickness = 0.46,
  rotateY = 0.36,
  rotateX = 0.05,
  rotateZ = 0,
  coverImageUrl,
  coverEyebrow = 'THE COMPLETE PROTOCOL GUIDE TO',
  coverTitlePart1 = 'MOLT',
  coverTitlePart2 = 'MAXXING',
  coverSubtitle = 'STAGE 4 CARCINIZATION',
  coverTagline = 'STRATEGIES · TECHNIQUES · RESULTS',
  spineTitle,
  themeVariant = 'cyan',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const finalSpineTitle = spineTitle || `${coverTitlePart1} ${coverTitlePart2}`.trim().toUpperCase()

  // Helper: Draw High-DPI Front Cover on any 2D canvas context
  const drawFrontCover = (ctx: CanvasRenderingContext2D, w = 512, h = 720) => {
    // 1. Background Gradient (Dark Navy/Obsidian)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h)
    bgGrad.addColorStop(0, '#031120')
    bgGrad.addColorStop(0.5, '#041e35')
    bgGrad.addColorStop(1, '#010810')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Subtle dark grid texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Left Hardcover Hinge Groove
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, 24, h)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(24, 0)
    ctx.lineTo(24, h)
    ctx.stroke()

    // Sleek Matte Outer Border (No harsh neon lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
    ctx.lineWidth = 2
    ctx.strokeRect(4, 4, w - 8, h - 8)

    // 2. Eyebrow Text
    ctx.textAlign = 'center'
    ctx.font = 'bold 13px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(coverEyebrow, w / 2 + 12, 52)

    // Subtitle with subtle amber accent
    ctx.font = '900 15px monospace'
    ctx.fillStyle = '#fbbf24'
    ctx.fillText(`— ${coverSubtitle} —`, w / 2 + 12, 78)

    // 3. Huge 2-Tone Hero Title
    ctx.font = '900 74px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.95)'
    ctx.shadowBlur = 14
    ctx.fillText(coverTitlePart1, w / 2 + 12, 160)

    ctx.font = '900 76px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#fbbf24'
    ctx.shadowColor = 'rgba(251, 191, 36, 0.5)'
    ctx.shadowBlur = 20
    ctx.fillText(coverTitlePart2, w / 2 + 12, 230)
    ctx.shadowBlur = 0

    // Divider rule with Tagline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(50, 260)
    ctx.lineTo(120, 260)
    ctx.moveTo(w - 96, 260)
    ctx.lineTo(w - 26, 260)
    ctx.stroke()

    ctx.font = '900 11px monospace'
    ctx.fillStyle = '#bae6fd'
    ctx.fillText(coverTagline, w / 2 + 12, 264)

    // 4. Central 3D Rising Bar Chart Card (Dark Matte Box)
    const cardX = 64
    const cardY = 295
    const cardW = w - 104
    const cardH = 240

    ctx.fillStyle = '#020b16'
    ctx.fillRect(cardX, cardY, cardW, cardH)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(cardX, cardY, cardW, cardH)

    // Glowing Rising Bars
    const bars = [
      { h: 50, c1: '#083344', c2: '#06b6d4' },
      { h: 85, c1: '#0e7490', c2: '#22d3ee' },
      { h: 125, c1: '#0891b2', c2: '#67e8f9' },
      { h: 165, c1: '#d97706', c2: '#fde047' },
    ]

    const barW = 54
    const startX = cardX + 38
    bars.forEach((bar, i) => {
      const bx = startX + i * 86
      const by = cardY + cardH - 24 - bar.h
      const barGrad = ctx.createLinearGradient(bx, by, bx, by + bar.h)
      barGrad.addColorStop(0, bar.c2)
      barGrad.addColorStop(1, bar.c1)
      ctx.fillStyle = barGrad
      ctx.fillRect(bx, by, barW, bar.h)

      // Top bar highlight
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(bx, by, barW, 2.5)
    })

    // Ascending Trendline
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 4
    ctx.shadowColor = 'rgba(251, 191, 36, 0.8)'
    ctx.shadowBlur = 14
    ctx.beginPath()
    ctx.moveTo(cardX + 45, cardY + cardH - 50)
    ctx.lineTo(cardX + 145, cardY + cardH - 90)
    ctx.lineTo(cardX + 240, cardY + cardH - 130)
    ctx.lineTo(cardX + 355, cardY + cardH - 180)
    ctx.stroke()
    ctx.shadowBlur = 0

    // Top Right Magnifying Glass & Badge
    ctx.fillStyle = 'rgba(3, 14, 26, 0.9)'
    ctx.fillRect(cardX + cardW - 75, cardY + 12, 60, 32)
    ctx.strokeStyle = 'rgba(0, 255, 230, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(cardX + cardW - 75, cardY + 12, 60, 32)
    ctx.font = 'bold 14px system-ui'
    ctx.fillStyle = '#00ffe6'
    ctx.fillText('🔍 📈', cardX + cardW - 45, cardY + 34)

    // 5. Three Bottom Feature Badges (Matte Dark Navy)
    const badgeY = 565
    const badgeW = 125
    const badgeH = 75
    const badges = [
      { icon: '🛡️', t1: 'PROVEN', t2: 'ECDYSIS' },
      { icon: '⚡', t1: 'PINCER', t2: 'TORQUE' },
      { icon: '🌊', t1: '50,000', t2: 'FATHOMS' },
    ]

    badges.forEach((b, i) => {
      const bx = 45 + i * 145
      ctx.fillStyle = '#010912'
      ctx.fillRect(bx, badgeY, badgeW, badgeH)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, badgeY, badgeW, badgeH)

      ctx.font = '18px system-ui'
      ctx.fillText(b.icon, bx + badgeW / 2, badgeY + 24)

      ctx.font = '900 11px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(b.t1, bx + badgeW / 2, badgeY + 46)

      ctx.font = 'bold 10px monospace'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(b.t2, bx + badgeW / 2, badgeY + 62)
    })

    // Subtle gold bottom stripe
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(50, 672, w - 76, 2)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: THREE.WebGLRenderer | null = null
    let geometry: THREE.BoxGeometry | null = null
    const materials: THREE.Material[] = []
    const textures: THREE.Texture[] = []

    try {
      // 1. Scene, Camera, WebGLRenderer
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
      camera.position.set(0, 0, 7.8)

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2))
      renderer.setSize(width, height)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15

      // 2. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
      scene.add(ambientLight)

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
      keyLight.position.set(4, 5, 6)
      scene.add(keyLight)

      const fillLight = new THREE.DirectionalLight(0xe0f7fa, 1.1)
      fillLight.position.set(-4, 2, 4)
      scene.add(fillLight)

      const rimLight = new THREE.DirectionalLight(0x00ffe6, 1.3)
      rimLight.position.set(-3, -3, -2)
      scene.add(rimLight)

      // Helper to generate textures from canvas
      const createTexture = (
        w: number,
        h: number,
        draw: (ctx: CanvasRenderingContext2D) => void
      ) => {
        const cvs = document.createElement('canvas')
        cvs.width = w * 2
        cvs.height = h * 2
        const ctx = cvs.getContext('2d')
        if (ctx) {
          ctx.scale(2, 2)
          draw(ctx)
        }
        const texture = new THREE.CanvasTexture(cvs)
        texture.colorSpace = THREE.SRGBColorSpace
        textures.push(texture)
        return texture
      }

      // Face 0: Right (+X) - Pages
      const rightPagesTex = createTexture(120, 512, (ctx) => {
        ctx.fillStyle = '#0a192f'
        ctx.fillRect(0, 0, 120, 512)
        for (let y = 0; y < 512; y += 2) {
          ctx.fillStyle = y % 4 === 0 ? '#cbd5e1' : y % 6 === 0 ? '#94a3b8' : '#ffffff'
          ctx.fillRect(4, y, 112, 1.5)
        }
      })

      // Face 1: Left (-X) - Spine
      const spineTex = createTexture(120, 512, (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 120, 0)
        grad.addColorStop(0, '#01050a')
        grad.addColorStop(0.3, '#061c30')
        grad.addColorStop(0.7, '#0b3254')
        grad.addColorStop(1, '#020d18')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 120, 512)

        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(10, 20, 100, 2.5)
        ctx.fillRect(10, 489, 100, 2.5)

        ctx.save()
        ctx.translate(60, 256)
        ctx.rotate(Math.PI / 2)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        ctx.font = '900 24px system-ui, sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 6
        ctx.fillText(finalSpineTitle, 0, 0)

        ctx.font = 'bold 13px monospace'
        ctx.fillStyle = '#94a3b8'
        ctx.shadowBlur = 0
        ctx.fillText('MOLTOLOGY', -160, 0)

        ctx.fillStyle = '#fbbf24'
        ctx.fillText('2026', 160, 0)
        ctx.restore()
      })

      // Face 2: Top (+Y)
      const topPagesTex = createTexture(384, 120, (ctx) => {
        ctx.fillStyle = '#020d1a'
        ctx.fillRect(0, 0, 384, 120)
        ctx.fillStyle = '#e2e8f0'
        ctx.fillRect(16, 4, 352, 112)
      })

      // Face 3: Bottom (-Y)
      const bottomPagesTex = createTexture(384, 120, (ctx) => {
        ctx.fillStyle = '#020d1a'
        ctx.fillRect(0, 0, 384, 120)
        ctx.fillStyle = '#94a3b8'
        ctx.fillRect(16, 4, 352, 112)
      })

      // Face 4: Front (+Z)
      const frontCoverTex = createTexture(512, 720, (ctx) => {
        drawFrontCover(ctx, 512, 720)
      })

      // Face 5: Back (-Z)
      const backCoverTex = createTexture(512, 720, (ctx) => {
        ctx.fillStyle = '#010810'
        ctx.fillRect(0, 0, 512, 720)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 2
        ctx.strokeRect(4, 4, 504, 712)
      })

      materials.push(
        new THREE.MeshStandardMaterial({ map: rightPagesTex, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.35, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ map: topPagesTex, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ map: bottomPagesTex, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ map: frontCoverTex, roughness: 0.25, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ map: backCoverTex, roughness: 0.4 })
      )

      geometry = new THREE.BoxGeometry(bookWidth, bookHeight, bookThickness)
      const bookMesh = new THREE.Mesh(geometry, materials)

      bookMesh.rotation.set(rotateX, rotateY, rotateZ)
      bookMesh.position.set(0, 0.05, 0)
      scene.add(bookMesh)

      // Render 1 pristine frame
      renderer.render(scene, camera)
    } catch (e) {
      console.warn('Three.js WebGL rendering failed, falling back to 2D Canvas:', e)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, width, height)
        ctx.save()
        ctx.scale(width / 512, height / 720)
        drawFrontCover(ctx, 512, 720)
        ctx.restore()
      }
    }

    return () => {
      geometry?.dispose()
      materials.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
      renderer?.dispose()
    }
  }, [
    width,
    height,
    bookWidth,
    bookHeight,
    bookThickness,
    rotateY,
    rotateX,
    rotateZ,
    coverImageUrl,
    coverEyebrow,
    coverTitlePart1,
    coverTitlePart2,
    coverSubtitle,
    coverTagline,
    finalSpineTitle,
    themeVariant,
  ])

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="drop-shadow-[0_30px_50px_rgba(0,0,0,0.95)]"
      />
    </div>
  )
}
