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
    // 1. Background Gradient (Clean, smooth luxury Benthic Sapphire)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h)
    bgGrad.addColorStop(0, '#0c2d4f')
    bgGrad.addColorStop(0.35, '#124373')
    bgGrad.addColorStop(0.70, '#0d3257')
    bgGrad.addColorStop(1, '#08213b')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Left Hardcover Hinge Groove with subtle specular highlight
    ctx.fillStyle = 'rgba(3, 14, 26, 0.75)'
    ctx.fillRect(0, 0, 26, h)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(26, 0)
    ctx.lineTo(26, h)
    ctx.stroke()

    // 2. Eyebrow Text
    ctx.textAlign = 'center'
    ctx.font = 'bold 13px monospace'
    ctx.fillStyle = '#bae6fd'
    ctx.fillText(coverEyebrow, w / 2 + 13, 50)

    // Subtitle with vibrant gold accent
    ctx.font = '900 15px monospace'
    ctx.fillStyle = '#fde047'
    ctx.fillText(`— ${coverSubtitle} —`, w / 2 + 13, 76)

    // 3. Huge 2-Tone Hero Title (Dynamically scaled to fit width perfectly)
    const maxTitleLen = Math.max(coverTitlePart1.length, coverTitlePart2.length)
    const titleFontSize1 = maxTitleLen > 11 ? 52 : maxTitleLen > 8 ? 62 : 74
    const titleFontSize2 = maxTitleLen > 11 ? 54 : maxTitleLen > 8 ? 64 : 76

    ctx.font = `900 ${titleFontSize1}px system-ui, -apple-system, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = 16
    ctx.fillText(coverTitlePart1, w / 2 + 13, 158)

    ctx.font = `900 ${titleFontSize2}px system-ui, -apple-system, sans-serif`
    ctx.fillStyle = '#fde047'
    ctx.shadowColor = 'rgba(251, 191, 36, 0.65)'
    ctx.shadowBlur = 24
    ctx.fillText(coverTitlePart2, w / 2 + 13, 228)
    ctx.shadowBlur = 0

    // Divider rule with Tagline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(48, 258)
    ctx.lineTo(122, 258)
    ctx.moveTo(w - 96, 258)
    ctx.lineTo(w - 22, 258)
    ctx.stroke()

    ctx.font = '900 11px monospace'
    ctx.fillStyle = '#e0f2fe'
    ctx.fillText(coverTagline, w / 2 + 13, 262)

    // 4. Central 3D Rising Bar Chart Card (Smooth Sapphire Glass Box)
    const cardX = 60
    const cardY = 290
    const cardW = w - 96
    const cardH = 244

    const cardBgGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH)
    cardBgGrad.addColorStop(0, '#0c2844')
    cardBgGrad.addColorStop(1, '#081c32')
    ctx.fillStyle = cardBgGrad
    ctx.fillRect(cardX, cardY, cardW, cardH)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(cardX, cardY, cardW, cardH)

    // Glowing Rising Bars
    const bars = [
      { h: 54, c1: '#0e7490', c2: '#22d3ee' },
      { h: 90, c1: '#0284c7', c2: '#38bdf8' },
      { h: 132, c1: '#0369a1', c2: '#67e8f9' },
      { h: 172, c1: '#d97706', c2: '#fde047' },
    ]

    const barW = 56
    const startX = cardX + 38
    bars.forEach((bar, i) => {
      const bx = startX + i * 88
      const by = cardY + cardH - 24 - bar.h
      const barGrad = ctx.createLinearGradient(bx, by, bx, by + bar.h)
      barGrad.addColorStop(0, bar.c2)
      barGrad.addColorStop(1, bar.c1)
      ctx.fillStyle = barGrad
      ctx.fillRect(bx, by, barW, bar.h)

      // Top bar highlight
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(bx, by, barW, 3)
    })

    // Ascending Trendline with vibrant glow
    ctx.strokeStyle = '#fde047'
    ctx.lineWidth = 4.5
    ctx.shadowColor = 'rgba(251, 191, 36, 0.9)'
    ctx.shadowBlur = 16
    ctx.beginPath()
    ctx.moveTo(cardX + 44, cardY + cardH - 52)
    ctx.lineTo(cardX + 144, cardY + cardH - 94)
    ctx.lineTo(cardX + 242, cardY + cardH - 136)
    ctx.lineTo(cardX + 360, cardY + cardH - 188)
    ctx.stroke()
    ctx.shadowBlur = 0

    // Top Right Telemetry Badge
    ctx.fillStyle = 'rgba(8, 30, 52, 0.95)'
    ctx.fillRect(cardX + cardW - 78, cardY + 12, 64, 32)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(cardX + cardW - 78, cardY + 12, 64, 32)
    ctx.font = 'bold 14px system-ui'
    ctx.fillStyle = '#fde047'
    ctx.fillText('🔍 📈', cardX + cardW - 46, cardY + 34)

    // 5. Three Bottom Feature Badges (Smooth Sapphire Navy)
    const badgeY = 562
    const badgeW = 126
    const badgeH = 76
    const badges = [
      { icon: '🛡️', t1: 'PROVEN', t2: 'ECDYSIS' },
      { icon: '⚡', t1: 'PINCER', t2: 'TORQUE' },
      { icon: '🌊', t1: '50,000', t2: 'FATHOMS' },
    ]

    badges.forEach((b, i) => {
      const bx = 42 + i * 148
      ctx.fillStyle = '#0b2642'
      ctx.fillRect(bx, badgeY, badgeW, badgeH)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, badgeY, badgeW, badgeH)

      ctx.font = '19px system-ui'
      ctx.fillText(b.icon, bx + badgeW / 2, badgeY + 24)

      ctx.font = '900 11.5px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(b.t1, bx + badgeW / 2, badgeY + 46)

      ctx.font = 'bold 10px monospace'
      ctx.fillStyle = '#bae6fd'
      ctx.fillText(b.t2, bx + badgeW / 2, badgeY + 63)
    })

    // Radiant gold bottom stripe
    ctx.fillStyle = '#fde047'
    ctx.fillRect(45, 670, w - 66, 2.5)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: THREE.WebGLRenderer | null = null
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []
    const textures: THREE.Texture[] = []

    try {
      // 1. Scene, Camera, WebGLRenderer
      const scene = new THREE.Scene()
      // Perfectly calibrated perspective camera framing enlarged 3D book and platter with ample clearance on all sides
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
      camera.position.set(0.0, 1.05, 9.6)
      camera.lookAt(0, 0.20, 0)

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2))
      renderer.setSize(width, height)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.25

      const isGoldTheme = themeVariant === 'amber' || themeVariant === 'gold'
      const accentColorHex = isGoldTheme ? 0xfbbf24 : 0x38bdf8
      const accentTrimHex = isGoldTheme ? 0xf59e0b : 0x0284c7

      // 2. Multi-Point Luminous Lighting Rig
      // Ambient environmental light
      const ambientLight = new THREE.AmbientLight(0x1a3d60, 1.7)
      scene.add(ambientLight)

      // Key Light: Upper-front directional light illuminating front cover & typography
      const keyLight = new THREE.DirectionalLight(0xfffaee, 2.8)
      keyLight.position.set(4.5, 7.5, 6.2)
      scene.add(keyLight)

      // Fill Light: Soft fill on the left side / spine
      const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.6)
      fillLight.position.set(-5.0, 3.8, 4.5)
      scene.add(fillLight)

      // Top Backlight: Crisp specular rim light along book top edge and platter back
      const rimLight = new THREE.DirectionalLight(accentColorHex, 1.8)
      rimLight.position.set(-1.6, 6.5, -3.5)
      scene.add(rimLight)

      // Platter Soft Uplight: Broad, soft-angled directional light illuminating platter and book base
      const platterUplight = new THREE.DirectionalLight(accentColorHex, 1.6)
      platterUplight.position.set(0, -1.6, 4.5)
      scene.add(platterUplight)

      // Soft Hero Spotlight targeting book title (Smooth 45° penumbra falloff)
      const heroSpotlight = new THREE.SpotLight(0xffffff, 2.2, 14, Math.PI / 4, 0.45, 1.1)
      heroSpotlight.position.set(1.0, 6.2, 5.5)
      heroSpotlight.target.position.set(0, 0.35, 0)
      scene.add(heroSpotlight)
      scene.add(heroSpotlight.target)

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

      // Face 0: Right (+X) - Pages (Crisp bright paper)
      const rightPagesTex = createTexture(120, 512, (ctx) => {
        ctx.fillStyle = '#0e2338'
        ctx.fillRect(0, 0, 120, 512)
        for (let y = 0; y < 512; y += 2) {
          ctx.fillStyle = y % 4 === 0 ? '#f8fafc' : y % 6 === 0 ? '#cbd5e1' : '#ffffff'
          ctx.fillRect(4, y, 112, 1.5)
        }
      })

      // Face 1: Left (-X) - Spine (Rich Royal Navy with Gold)
      const spineTex = createTexture(120, 512, (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 120, 0)
        grad.addColorStop(0, '#051829')
        grad.addColorStop(0.3, '#0d385f')
        grad.addColorStop(0.7, '#124c80')
        grad.addColorStop(1, '#08223a')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 120, 512)

        ctx.fillStyle = '#fde047'
        ctx.fillRect(10, 20, 100, 3)
        ctx.fillRect(10, 488, 100, 3)

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
        ctx.fillStyle = '#bae6fd'
        ctx.shadowBlur = 0
        ctx.fillText('MOLTOLOGY', -160, 0)

        ctx.fillStyle = '#fde047'
        ctx.fillText('2026', 160, 0)
        ctx.restore()
      })

      // Face 2: Top (+Y)
      const topPagesTex = createTexture(384, 120, (ctx) => {
        ctx.fillStyle = '#0a2338'
        ctx.fillRect(0, 0, 384, 120)
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(16, 4, 352, 112)
      })

      // Face 3: Bottom (-Y)
      const bottomPagesTex = createTexture(384, 120, (ctx) => {
        ctx.fillStyle = '#0a2338'
        ctx.fillRect(0, 0, 384, 120)
        ctx.fillStyle = '#cbd5e1'
        ctx.fillRect(16, 4, 352, 112)
      })

      // Face 4: Front (+Z)
      const frontCoverTex = createTexture(512, 720, (ctx) => {
        drawFrontCover(ctx, 512, 720)
      })

      // Face 5: Back (-Z)
      const backCoverTex = createTexture(512, 720, (ctx) => {
        ctx.fillStyle = '#08213b'
        ctx.fillRect(0, 0, 512, 720)
      })

      const bookMaterials = [
        new THREE.MeshStandardMaterial({ map: rightPagesTex, roughness: 0.75 }),
        new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.28, metalness: 0.2 }),
        new THREE.MeshStandardMaterial({ map: topPagesTex, roughness: 0.75 }),
        new THREE.MeshStandardMaterial({ map: bottomPagesTex, roughness: 0.75 }),
        new THREE.MeshStandardMaterial({ map: frontCoverTex, roughness: 0.2, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ map: backCoverTex, roughness: 0.35 }),
      ]
      materials.push(...bookMaterials)

      const bookGeometry = new THREE.BoxGeometry(bookWidth, bookHeight, bookThickness)
      geometries.push(bookGeometry)
      const bookMesh = new THREE.Mesh(bookGeometry, bookMaterials)

      // Book positioning & elevation
      const bookCenterY = 0.34
      bookMesh.rotation.set(rotateX, rotateY, rotateZ)
      bookMesh.position.set(0, bookCenterY, 0)
      scene.add(bookMesh)

      // --- 3D BENTHIC OVAL PLATTER / PEDESTAL (Proportional & Zero Clipping) ---
      const platterY = bookCenterY - bookHeight / 2 - 0.015
      const platterThickness = 0.18
      const radiusX = 2.18
      const radiusZ = 1.42
      const platterYaw = rotateY * 0.5 // matching perspective yaw

      // 1. Platter Base Tier (Luminous Metallic Titanium-Sapphire Alloy)
      const platterBaseShape = new THREE.Shape()
      platterBaseShape.absellipse(0, 0, radiusX, radiusZ, 0, Math.PI * 2, false, 0)

      const baseExtrudeSettings: THREE.ExtrudeGeometryOptions = {
        steps: 1,
        depth: platterThickness,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.07,
        bevelOffset: 0,
        bevelSegments: 8,
      }

      const platterBaseGeo = new THREE.ExtrudeGeometry(platterBaseShape, baseExtrudeSettings)
      platterBaseGeo.rotateX(-Math.PI / 2)
      geometries.push(platterBaseGeo)

      const platterBaseMat = new THREE.MeshStandardMaterial({
        color: 0x1e4b78,
        metalness: 0.85,
        roughness: 0.2,
      })
      materials.push(platterBaseMat)

      const platterBaseMesh = new THREE.Mesh(platterBaseGeo, platterBaseMat)
      platterBaseMesh.position.set(0, platterY - platterThickness, 0)
      platterBaseMesh.rotation.y = platterYaw
      scene.add(platterBaseMesh)

      // 2. Platter Top Inset Deck (Smooth Sapphire Deck Plate)
      const deckShape = new THREE.Shape()
      deckShape.absellipse(0, 0, radiusX - 0.08, radiusZ - 0.07, 0, Math.PI * 2, false, 0)

      const deckExtrudeSettings: THREE.ExtrudeGeometryOptions = {
        steps: 1,
        depth: 0.025,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 4,
      }

      const deckGeo = new THREE.ExtrudeGeometry(deckShape, deckExtrudeSettings)
      deckGeo.rotateX(-Math.PI / 2)
      geometries.push(deckGeo)

      // High-DPI Tech Deck Texture (Smooth Sapphire with Gold / Platinum Accent Rings)
      const deckTexture = createTexture(512, 320, (ctx) => {
        const w = 512
        const h = 320
        const cx = w / 2
        const cy = h / 2

        // Radial sapphire background
        const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, cx * 0.9)
        radGrad.addColorStop(0, '#1c5a94')
        radGrad.addColorStop(0.5, '#123f6c')
        radGrad.addColorStop(1, '#0a2644')
        ctx.fillStyle = radGrad
        ctx.fillRect(0, 0, w, h)

        // Outer Accent Ring
        ctx.strokeStyle = isGoldTheme ? 'rgba(251, 191, 36, 0.85)' : 'rgba(255, 255, 255, 0.6)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.ellipse(cx, cy, cx - 18, cy - 18, 0, 0, Math.PI * 2)
        ctx.stroke()

        // Inner Concentric Coordinate Guide Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.ellipse(cx, cy, cx - 58, cy - 44, 0, 0, Math.PI * 2)
        ctx.stroke()
      })

      const deckMat = new THREE.MeshStandardMaterial({
        map: deckTexture,
        metalness: 0.55,
        roughness: 0.24,
      })
      materials.push(deckMat)

      const deckMesh = new THREE.Mesh(deckGeo, deckMat)
      deckMesh.position.set(0, platterY + 0.005, 0)
      deckMesh.rotation.y = platterYaw
      scene.add(deckMesh)

      // 3. Metallic Bezel Rim Ring
      const rimShape = new THREE.Shape()
      rimShape.absellipse(0, 0, radiusX + 0.02, radiusZ + 0.02, 0, Math.PI * 2, false, 0)
      const rimHole = new THREE.Path()
      rimHole.absellipse(0, 0, radiusX - 0.04, radiusZ - 0.04, 0, Math.PI * 2, true, 0)
      rimShape.holes.push(rimHole)

      const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
        steps: 1,
        depth: 0.018,
        bevelEnabled: false,
      })
      rimGeo.rotateX(-Math.PI / 2)
      geometries.push(rimGeo)

      const rimMat = new THREE.MeshStandardMaterial({
        color: accentColorHex,
        emissive: accentColorHex,
        emissiveIntensity: 0.45,
        metalness: 0.95,
        roughness: 0.12,
      })
      materials.push(rimMat)

      const rimMesh = new THREE.Mesh(rimGeo, rimMat)
      rimMesh.position.set(0, platterY + 0.015, 0)
      rimMesh.rotation.y = platterYaw
      scene.add(rimMesh)

      // 4. Soft Contact Shadow Directly Beneath Book on Platter
      const bookShadowGeo = new THREE.PlaneGeometry(bookWidth * 1.1, bookThickness * 3.2)
      bookShadowGeo.rotateX(-Math.PI / 2)
      geometries.push(bookShadowGeo)

      const bookShadowTex = createTexture(256, 128, (ctx) => {
        const w = 256
        const h = 128
        const cx = w / 2
        const cy = h / 2
        const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, cx * 0.92)
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.92)')
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)')
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      })

      const bookShadowMat = new THREE.MeshBasicMaterial({
        map: bookShadowTex,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      })
      materials.push(bookShadowMat)

      const bookShadowMesh = new THREE.Mesh(bookShadowGeo, bookShadowMat)
      bookShadowMesh.position.set(0, platterY + 0.035, 0)
      bookShadowMesh.rotation.y = rotateY
      scene.add(bookShadowMesh)

      // 5. Deep Ground Contact Ambient Occlusion Shadow Below Platter
      const groundShadowGeo = new THREE.PlaneGeometry(radiusX * 2.3, radiusZ * 2.5)
      groundShadowGeo.rotateX(-Math.PI / 2)
      geometries.push(groundShadowGeo)

      const groundShadowTex = createTexture(512, 256, (ctx) => {
        const w = 512
        const h = 256
        const cx = w / 2
        const cy = h / 2
        const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, cx * 0.96)
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.94)')
        grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.6)')
        grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.2)')
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      })

      const groundShadowMat = new THREE.MeshBasicMaterial({
        map: groundShadowTex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
      materials.push(groundShadowMat)

      const groundShadowMesh = new THREE.Mesh(groundShadowGeo, groundShadowMat)
      groundShadowMesh.position.set(0, platterY - platterThickness - 0.06, 0)
      groundShadowMesh.rotation.y = platterYaw
      scene.add(groundShadowMesh)

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
      geometries.forEach((g) => g.dispose())
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

