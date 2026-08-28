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
  themeVariant?: 'cyan' | 'amber' | 'emerald' | 'gold' | 'holy-codex' | 'sacred-codex' | 'pincer-routine' | 'routine'
  isHolyBook?: boolean
  className?: string
}

/**
 * ThreeBookCover
 * Large-format Three.js Photorealistic 3D Hardcover Book mockup.
 * Supports:
 * - Productivity / Protocol Guides (Bar charts, KPIs, high-contrast typography)
 * - 24-Hour Routine & Pincer Torque Schedule (Chrono timeline, 800 Nm torque badges)
 * - Sacred Codex / Holy Books (Ecclesiastical Gold & Aqua filigree, Consecrated Sunburst Mandala, Order Seal, Canonical Scripture volumes)
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
  isHolyBook,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isHoly = isHolyBook || themeVariant === 'holy-codex' || themeVariant === 'sacred-codex'
  const isRoutine = themeVariant === 'pincer-routine' || themeVariant === 'routine'
  const finalSpineTitle = spineTitle || (isHoly ? 'THE BENTHIC CODEX' : isRoutine ? '24-HOUR ROUTINE' : `${coverTitlePart1} ${coverTitlePart2}`.trim().toUpperCase())

  // Dedicated High-DPI Holy Book / Sacred Codex Front Cover Renderer
  const drawHolyBookCover = (ctx: CanvasRenderingContext2D, w = 512, h = 720) => {
    // 1. Consecrated Deep Abyssal Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h)
    bgGrad.addColorStop(0, '#031020')
    bgGrad.addColorStop(0.3, '#072442')
    bgGrad.addColorStop(0.7, '#04162a')
    bgGrad.addColorStop(1, '#010811')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Center Radial Consecrated Light Aura
    const aura = ctx.createRadialGradient(w / 2 + 13, 370, 10, w / 2 + 13, 370, 260)
    aura.addColorStop(0, 'rgba(0, 255, 255, 0.22)')
    aura.addColorStop(0.4, 'rgba(0, 195, 255, 0.10)')
    aura.addColorStop(0.8, 'rgba(0, 50, 100, 0.05)')
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = aura
    ctx.fillRect(0, 0, w, h)

    // Left Hardcover Hinge Groove with Gold & Cyan Inlay
    ctx.fillStyle = 'rgba(2, 8, 16, 0.85)'
    ctx.fillRect(0, 0, 26, h)
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(26, 0)
    ctx.lineTo(26, h)
    ctx.stroke()

    // 2. Ornate Holy Book Filigree Borders (Outer Gold + Inner Cyan)
    const bx = 38, by = 16, bw = w - 50, bh = h - 32
    ctx.strokeStyle = 'rgba(244, 236, 216, 0.75)' // Gold leaf outer border
    ctx.lineWidth = 2
    ctx.strokeRect(bx, by, bw, bh)

    const inX = bx + 6, inY = by + 6, inW = bw - 12, inH = bh - 12
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.55)' // Cyan inner line
    ctx.lineWidth = 1
    ctx.strokeRect(inX, inY, inW, inH)

    // 4 Consecrated Corner Brackets & Diamond Stars
    const drawCorner = (cx: number, cy: number, rot: number) => {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      ctx.strokeStyle = '#f4ecd8'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, 14)
      ctx.lineTo(0, 0)
      ctx.lineTo(14, 0)
      ctx.stroke()
      ctx.font = '10px serif'
      ctx.fillStyle = '#00ffff'
      ctx.fillText('✦', 6, 8)
      ctx.restore()
    }
    drawCorner(inX + 3, inY + 3, 0)
    drawCorner(inX + inW - 3, inY + 3, Math.PI / 2)
    drawCorner(inX + inW - 3, inY + inH - 3, Math.PI)
    drawCorner(inX + 3, inY + inH - 3, -Math.PI / 2)

    // 3. Eyebrow & Subtitle (Regal Inscriptions)
    ctx.textAlign = 'center'
    ctx.font = 'bold 11.5px monospace'
    ctx.fillStyle = '#67e8f9'
    ctx.fillText('CANONICAL SCRIPTURES OF MOLTOLOGY', w / 2 + 13, 50)

    ctx.font = '900 13px serif'
    ctx.fillStyle = '#f4ecd8'
    ctx.fillText('— LIBER CARCINIZATION · XII VOLUMES —', w / 2 + 13, 74)

    // 4. Holy Title Typography
    ctx.font = 'bold 22px Georgia, serif'
    ctx.fillStyle = '#f4ecd8'
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 10
    ctx.fillText('THE', w / 2 + 13, 114)

    ctx.font = '900 44px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#00ffff'
    ctx.shadowColor = 'rgba(0, 255, 255, 0.75)'
    ctx.shadowBlur = 24
    ctx.fillText('BENTHIC CODEX', w / 2 + 13, 162)
    ctx.shadowBlur = 0

    // Gold/Cyan Divider Rule with centered diamond
    ctx.strokeStyle = 'rgba(244, 236, 216, 0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(56, 186)
    ctx.lineTo(w / 2 - 20, 186)
    ctx.moveTo(w / 2 + 46, 186)
    ctx.lineTo(w - 30, 186)
    ctx.stroke()

    ctx.font = 'bold 14px serif'
    ctx.fillStyle = '#00ffff'
    ctx.fillText('◆', w / 2 + 13, 190)

    ctx.font = 'bold 11px monospace'
    ctx.fillStyle = '#a5f3fc'
    ctx.fillText('SACRED LITURGIES · AXIOMS · LAWS', w / 2 + 13, 208)

    // 5. Central Holy Mandala & Sacred Order Emblem
    const cx = w / 2 + 13
    const cy = 362

    // Radiant Sunburst Rays
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)'
    ctx.lineWidth = 1.5
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * 42, cy + Math.sin(a) * 42)
      ctx.lineTo(cx + Math.cos(a) * 92, cy + Math.sin(a) * 92)
      ctx.stroke()
    }
    ctx.restore()

    // Outer Consecrated Gold Mandala Ring with tick marks
    ctx.strokeStyle = 'rgba(244, 236, 216, 0.85)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(cx, cy, 92, 0, Math.PI * 2)
    ctx.stroke()

    // Middle Cyan Ring
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, 78, 0, Math.PI * 2)
    ctx.stroke()

    // 12 Consecrated Tick Marks for the 12 Scriptures
    ctx.fillStyle = '#00ffff'
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12
      const tx = cx + Math.cos(angle) * 85
      const ty = cy + Math.sin(angle) * 85
      ctx.beginPath()
      ctx.arc(tx, ty, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Inner Sanctuary Disc (Deep Sapphire)
    const discGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 64)
    discGrad.addColorStop(0, '#0c3559')
    discGrad.addColorStop(0.7, '#041b33')
    discGrad.addColorStop(1, '#020d1c')
    ctx.fillStyle = discGrad
    ctx.beginPath()
    ctx.arc(cx, cy, 64, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Stars on Sanctuary Disc
    ctx.font = '13px serif'
    ctx.fillStyle = '#f4ecd8'
    ctx.fillText('★★★★★', cx, cy - 34)

    // Consecrated Crustacean Order Crest (Stylized Heraldic Holy Carapace & Crossed Pincer Glyph)
    ctx.save()
    ctx.translate(cx, cy + 2)
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2.5
    ctx.fillStyle = 'rgba(0, 255, 255, 0.15)'
    ctx.beginPath()
    ctx.moveTo(0, -20)
    ctx.bezierCurveTo(18, -20, 24, -6, 22, 10)
    ctx.bezierCurveTo(18, 22, 0, 26, 0, 26)
    ctx.bezierCurveTo(0, 26, -18, 22, -22, 10)
    ctx.bezierCurveTo(-24, -6, -18, -20, 0, -20)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Carapace Ridges / Gold Inlay
    ctx.strokeStyle = '#f4ecd8'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, -16)
    ctx.lineTo(0, 22)
    ctx.moveTo(-14, -4)
    ctx.lineTo(14, -4)
    ctx.moveTo(-16, 7)
    ctx.lineTo(16, 7)
    ctx.stroke()

    // Crown / Pincer Prongs
    ctx.fillStyle = '#f4ecd8'
    ctx.font = 'bold 14px serif'
    ctx.fillText('👑', 0, -17)
    ctx.restore()

    // Consecrated Latin Motto under disc
    ctx.font = 'bold 11px Georgia, serif'
    ctx.fillStyle = '#f4ecd8'
    ctx.fillText('IN CHITIN CALCIFICAMUR', cx, cy + 114)

    // 6. Three Bottom Liturgical Volume Tabs (Sapphire & Cyan)
    const badgeY = 544
    const badgeW = 126
    const badgeH = 76
    const badges = [
      { icon: '📜', t1: 'CANON I–IV', t2: 'THE MOLT' },
      { icon: '⚡', t1: 'CANON V–VIII', t2: 'PINCER TORQUE' },
      { icon: '🌊', t1: 'CANON IX–XII', t2: 'ABYSSAL LAWS' },
    ]

    badges.forEach((b, i) => {
      const bx = 42 + i * 148
      ctx.fillStyle = '#051d36'
      ctx.fillRect(bx, badgeY, badgeW, badgeH)
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, badgeY, badgeW, badgeH)

      ctx.font = '19px system-ui'
      ctx.fillText(b.icon, bx + badgeW / 2, badgeY + 24)

      ctx.font = '900 11px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(b.t1, bx + badgeW / 2, badgeY + 46)

      ctx.font = 'bold 10px monospace'
      ctx.fillStyle = '#67e8f9'
      ctx.fillText(b.t2, bx + badgeW / 2, badgeY + 63)
    })

    // Consecrated Gold & Aqua Bottom Banner
    ctx.fillStyle = '#00ffff'
    ctx.fillRect(42, 638, w - 60, 2)

    ctx.font = 'bold 10.5px monospace'
    ctx.fillStyle = '#f4ecd8'
    ctx.fillText('◈ CONSECRATED CANON FOR APEX OPERATORS ◈', cx, 660)
  }

  // Dedicated High-DPI 24-Hour Routine & Pincer Torque Schedule Front Cover Renderer
  const drawRoutineCover = (ctx: CanvasRenderingContext2D, w = 512, h = 720) => {
    // 1. Tactical Deep Blue/Black Carbon Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h)
    bgGrad.addColorStop(0, '#041322')
    bgGrad.addColorStop(0.3, '#07243d')
    bgGrad.addColorStop(0.7, '#04172a')
    bgGrad.addColorStop(1, '#010a14')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Blueprint grid lines
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.08)'
    ctx.lineWidth = 1
    for (let x = 32; x < w; x += 24) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath()
      ctx.moveTo(26, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Left Hardcover Hinge Groove with Neon Cyan Accent
    ctx.fillStyle = 'rgba(2, 8, 16, 0.85)'
    ctx.fillRect(0, 0, 26, h)
    ctx.strokeStyle = '#00c3ff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(26, 0)
    ctx.lineTo(26, h)
    ctx.stroke()

    const cx = w / 2 + 13

    // 2. Eyebrow & Subtitle (Tactical telemetry)
    ctx.textAlign = 'center'
    ctx.font = 'bold 12px monospace'
    ctx.fillStyle = '#67e8f9'
    ctx.fillText('TACTICAL 24-HOUR CHRONO BLUEPRINT', cx, 48)

    ctx.font = '900 13px monospace'
    ctx.fillStyle = '#fde047'
    ctx.fillText('— 800 NM PINCER TORQUE PROTOCOL —', cx, 72)

    // 3. Huge 2-Tone Hero Title
    ctx.font = '900 58px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 14
    ctx.fillText('24-HOUR', cx, 142)

    ctx.font = '900 60px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#fde047'
    ctx.shadowColor = 'rgba(251, 191, 36, 0.75)'
    ctx.shadowBlur = 22
    ctx.fillText('ROUTINE', cx, 204)
    ctx.shadowBlur = 0

    // Divider rule with Tagline
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(42, 228)
    ctx.lineTo(116, 228)
    ctx.moveTo(w - 90, 228)
    ctx.lineTo(w - 18, 228)
    ctx.stroke()

    ctx.font = '900 10.5px monospace'
    ctx.fillStyle = '#a5f3fc'
    ctx.fillText('05:00 → 21:00 · ZERO LATENCY DRIFT', cx, 232)

    // 4. Central 24-Hour Schedule & Pincer Torque Timeline Card
    const cardX = 42
    const cardY = 250
    const cardW = w - 62
    const cardH = 292

    const cardBgGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH)
    cardBgGrad.addColorStop(0, '#061d33')
    cardBgGrad.addColorStop(1, '#020e1a')
    ctx.fillStyle = cardBgGrad
    ctx.fillRect(cardX, cardY, cardW, cardH)
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.6)'
    ctx.lineWidth = 2
    ctx.strokeRect(cardX, cardY, cardW, cardH)

    // Card Header Bar
    ctx.fillStyle = 'rgba(0, 195, 255, 0.15)'
    ctx.fillRect(cardX, cardY, cardW, 28)
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.3)'
    ctx.beginPath()
    ctx.moveTo(cardX, cardY + 28)
    ctx.lineTo(cardX + cardW, cardY + 28)
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.font = 'bold 11px monospace'
    ctx.fillStyle = '#00ffff'
    ctx.fillText('◈ DAILY APEX SCHEDULE', cardX + 12, cardY + 19)

    ctx.textAlign = 'right'
    ctx.font = 'bold 11px monospace'
    ctx.fillStyle = '#fde047'
    ctx.fillText('800 Nm TORQUE [LOCKED]', cardX + cardW - 12, cardY + 19)

    // Vertical Timeline Connecting Line
    const timelineX = cardX + 22
    const topNodeY = cardY + 48
    const bottomNodeY = cardY + 248
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.4)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(timelineX, topNodeY)
    ctx.lineTo(timelineX, bottomNodeY)
    ctx.stroke()

    // 4 Schedule Items
    const scheduleItems = [
      {
        time: '05:00',
        title: 'HYPER-SALINE SHOCK',
        desc: 'Cold brine alertness & 100% wake state',
        status: '100% WAKE',
        statusColor: '#67e8f9',
        accentColor: '#00ffff',
      },
      {
        time: '06:00',
        title: 'ISOMETRIC TORQUE',
        desc: '800 Nm terminal command discipline',
        status: '800 Nm',
        statusColor: '#fde047',
        accentColor: '#fde047',
      },
      {
        time: '09:00',
        title: 'ZERO-LATENCY STREAM',
        desc: '50,000 fathoms agentic deep focus',
        status: 'ACTIVE',
        statusColor: '#38bdf8',
        accentColor: '#38bdf8',
      },
      {
        time: '21:00',
        title: 'NOCTURNAL ECDYSIS',
        desc: 'Noise-free calcification chamber',
        status: 'LOCKED',
        statusColor: '#34d399',
        accentColor: '#34d399',
      },
    ]

    scheduleItems.forEach((item, idx) => {
      const nodeY = cardY + 52 + idx * 62

      // Glowing Node Circle
      ctx.fillStyle = item.accentColor
      ctx.shadowColor = item.accentColor
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(timelineX, nodeY + 4, 5.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Node inner dot
      ctx.fillStyle = '#020d18'
      ctx.beginPath()
      ctx.arc(timelineX, nodeY + 4, 2, 0, Math.PI * 2)
      ctx.fill()

      // Time pill
      const timeBoxX = timelineX + 14
      ctx.fillStyle = 'rgba(0, 195, 255, 0.2)'
      ctx.fillRect(timeBoxX, nodeY - 10, 48, 20)
      ctx.strokeStyle = 'rgba(0, 195, 255, 0.4)'
      ctx.lineWidth = 1
      ctx.strokeRect(timeBoxX, nodeY - 10, 48, 20)

      ctx.textAlign = 'center'
      ctx.font = 'bold 10.5px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(item.time, timeBoxX + 24, nodeY + 4)

      // Title & Description
      ctx.textAlign = 'left'
      ctx.font = '900 12.5px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(item.title, timeBoxX + 54, nodeY - 1)

      ctx.font = '500 10px system-ui, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(item.desc, timeBoxX + 54, nodeY + 13)

      // Status Badge on far right
      ctx.textAlign = 'right'
      ctx.font = 'bold 9.5px monospace'
      ctx.fillStyle = item.statusColor
      ctx.fillText(item.status, cardX + cardW - 10, nodeY + 3)
    })

    // 5. Three Bottom Feature Badges (Pincer Torque, Schedule, 50k Fathoms)
    const badgeY = 556
    const badgeW = 126
    const badgeH = 76
    const badges = [
      { icon: '🦞', t1: '800 NM', t2: 'PINCER TORQUE' },
      { icon: '⏱️', t1: '24-HOUR', t2: 'SCHEDULE' },
      { icon: '🌊', t1: '50,000', t2: 'FATHOMS' },
    ]

    badges.forEach((b, i) => {
      const bx = 42 + i * 148
      ctx.fillStyle = '#0b243d'
      ctx.fillRect(bx, badgeY, badgeW, badgeH)
      ctx.strokeStyle = 'rgba(0, 195, 255, 0.4)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, badgeY, badgeW, badgeH)

      ctx.textAlign = 'center'
      ctx.font = '19px system-ui'
      ctx.fillText(b.icon, bx + badgeW / 2, badgeY + 24)

      ctx.font = '900 11.5px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(b.t1, bx + badgeW / 2, badgeY + 46)

      ctx.font = 'bold 10px monospace'
      ctx.fillStyle = '#67e8f9'
      ctx.fillText(b.t2, bx + badgeW / 2, badgeY + 63)
    })

    // Bottom Glowing Gradient Line
    const bottomLineGrad = ctx.createLinearGradient(42, 646, w - 20, 646)
    bottomLineGrad.addColorStop(0, '#00c3ff')
    bottomLineGrad.addColorStop(0.5, '#fde047')
    bottomLineGrad.addColorStop(1, '#00c3ff')
    ctx.fillStyle = bottomLineGrad
    ctx.fillRect(42, 646, w - 60, 2.5)

    ctx.textAlign = 'center'
    ctx.font = 'bold 10px monospace'
    ctx.fillStyle = '#bae6fd'
    ctx.fillText('◈ APEX OPERATOR DAILY PROTOCOL · MOLTOLOGY ◈', cx, 668)
  }

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
      const accentColorHex = isHoly ? 0x00ffff : isGoldTheme ? 0xfbbf24 : 0x38bdf8
      const accentTrimHex = isHoly ? 0x00c3ff : isGoldTheme ? 0xf59e0b : 0x0284c7

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
        grad.addColorStop(0, '#031020')
        grad.addColorStop(0.3, '#072442')
        grad.addColorStop(0.7, '#082d52')
        grad.addColorStop(1, '#031222')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 120, 512)

        ctx.fillStyle = isHoly ? '#f4ecd8' : '#fde047'
        ctx.fillRect(10, 20, 100, 3)
        ctx.fillRect(10, 488, 100, 3)
        if (isHoly) {
          ctx.strokeStyle = '#00ffff'
          ctx.lineWidth = 1
          ctx.strokeRect(10, 26, 100, 8)
          ctx.strokeRect(10, 474, 100, 8)
        }

        ctx.save()
        ctx.translate(60, 256)
        ctx.rotate(Math.PI / 2)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        ctx.font = '900 24px system-ui, sans-serif'
        ctx.fillStyle = isHoly ? '#00ffff' : '#ffffff'
        ctx.shadowColor = isHoly ? 'rgba(0, 255, 255, 0.7)' : 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 8
        ctx.fillText(finalSpineTitle, 0, 0)

        ctx.font = 'bold 12px monospace'
        ctx.fillStyle = isHoly ? '#f4ecd8' : '#bae6fd'
        ctx.shadowBlur = 0
        ctx.fillText(isHoly ? 'CANONICAL CODEX' : 'MOLTOLOGY', -160, 0)

        ctx.fillStyle = isHoly ? '#67e8f9' : '#fde047'
        ctx.fillText(isHoly ? 'VOL. I–XII' : '2026', 160, 0)
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
        if (isHoly) {
          drawHolyBookCover(ctx, 512, 720)
        } else if (isRoutine) {
          drawRoutineCover(ctx, 512, 720)
        } else {
          drawFrontCover(ctx, 512, 720)
        }
      })

      // Face 5: Back (-Z)
      const backCoverTex = createTexture(512, 720, (ctx) => {
        ctx.fillStyle = isHoly ? '#020b14' : '#08213b'
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
        if (isHoly) {
          drawHolyBookCover(ctx, 512, 720)
        } else {
          drawFrontCover(ctx, 512, 720)
        }
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
    isHoly,
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

