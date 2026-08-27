import fs from 'node:fs'
import path from 'node:path'
import { createCanvas } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/efaeeaa6-c7b9-4ef7-aee9-e938534ffe70')

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
}

/**
 * Draw the authentic MoltNation watermark (identical to MoltNationLogo on site)
 */
export function drawMoltNationWatermark(ctx: any, x: number, y: number, scale = 1.0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  // 1. Draw Emblem
  ctx.save()
  ctx.translate(-240, -26)

  // Outer Red Wings
  ctx.fillStyle = '#EF4444'
  ctx.beginPath()
  ctx.moveTo(25, 7.5)
  ctx.bezierCurveTo(15, 2.5, 2.5, 17.5, 5, 35)
  ctx.bezierCurveTo(10, 45, 20, 47.5, 25, 42.5)
  ctx.bezierCurveTo(30, 47.5, 40, 45, 45, 35)
  ctx.bezierCurveTo(47.5, 17.5, 35, 2.5, 25, 7.5)
  ctx.closePath()
  ctx.fill()

  // Inner Cutout
  ctx.fillStyle = '#05080a'
  ctx.beginPath()
  ctx.moveTo(25, 15)
  ctx.bezierCurveTo(19, 11, 11, 22.5, 12.5, 36)
  ctx.bezierCurveTo(17.5, 41, 22.5, 40, 25, 36)
  ctx.bezierCurveTo(27.5, 40, 32.5, 41, 37.5, 36)
  ctx.bezierCurveTo(39, 22.5, 31, 11, 25, 15)
  ctx.closePath()
  ctx.fill()

  // Cyan Shield
  ctx.fillStyle = '#00C3FF'
  ctx.beginPath()
  ctx.moveTo(25, 19)
  ctx.bezierCurveTo(21.5, 16.5, 16, 24, 17.5, 32.5)
  ctx.bezierCurveTo(21, 36, 24, 35, 25, 32)
  ctx.bezierCurveTo(26, 35, 29, 36, 32.5, 32.5)
  ctx.bezierCurveTo(34, 24, 28.5, 16.5, 25, 19)
  ctx.closePath()
  ctx.fill()

  // White Star
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  const starPoints = [
    [25, 22], [26, 25], [29, 25], [26.5, 27], [27.5, 30],
    [25, 28], [22.5, 30], [23.5, 27], [21, 25], [24, 25]
  ]
  starPoints.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt[0], pt[1])
    else ctx.lineTo(pt[0], pt[1])
  })
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // 2. Brand Text
  ctx.textAlign = 'left'
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  
  ctx.fillStyle = '#EF4444'
  ctx.fillText('MOLT', -180, -4)
  const moltWidth = ctx.measureText('MOLT').width

  ctx.fillStyle = '#FFFFFF'
  ctx.fillText('NATION', -180 + moltWidth + 2, -4)
  const nationWidth = ctx.measureText('NATION').width

  // "NEWS ★" Pill Badge
  const badgeX = -180 + moltWidth + nationWidth + 8
  ctx.fillStyle = 'rgba(8, 47, 73, 0.85)'
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.roundRect(badgeX, -22, 64, 20, 4)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 11px monospace'
  ctx.fillText('NEWS ★', badgeX + 8, -8)

  // Subtitle
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 9px monospace'
  ctx.letterSpacing = '1px'
  ctx.fillText('ONE NATION UNDER CHITIN: PATRIOT TELEMETRY', -180, 12)

  ctx.restore()
}

/**
 * Draw background tech lattice & ambient benthic depth
 */
function drawRichBenthicBackground(ctx: any, width: number, height: number) {
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#04131a')
  bgGrad.addColorStop(0.35, '#020b0f')
  bgGrad.addColorStop(0.7, '#01070a')
  bgGrad.addColorStop(1, '#000406')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  const r1 = ctx.createRadialGradient(width * 0.8, height * 0.2, 20, width * 0.8, height * 0.2, 500)
  r1.addColorStop(0, 'rgba(0, 255, 230, 0.14)')
  r1.addColorStop(0.5, 'rgba(0, 150, 200, 0.05)')
  r1.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = r1
  ctx.fillRect(0, 0, width, height)

  const r2 = ctx.createRadialGradient(width * 0.2, height * 0.75, 20, width * 0.2, height * 0.75, 450)
  r2.addColorStop(0, 'rgba(0, 180, 255, 0.09)')
  r2.addColorStop(0.6, 'rgba(0, 80, 140, 0.02)')
  r2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = r2
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.07)'
  ctx.lineWidth = 1.5

  for (let i = -width; i < width * 2; i += 160) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + height * 0.6, height)
    ctx.stroke()
  }

  for (let i = 0; i < 45; i++) {
    const px = (i * 137.5) % width
    const py = (i * 293.7) % height
    const rad = (i % 3) + 1
    ctx.fillStyle = (i % 2 === 0) ? 'rgba(0, 255, 230, 0.25)' : 'rgba(255, 200, 80, 0.2)'
    ctx.beginPath()
    ctx.arc(px, py, rad, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(0, 255, 230, 0.25)'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, width - 60, height - 60)

  const cornerSize = 25
  ctx.strokeStyle = '#00ffe6'
  ctx.lineWidth = 3

  ctx.beginPath()
  ctx.moveTo(25, 25 + cornerSize)
  ctx.lineTo(25, 25)
  ctx.lineTo(25 + cornerSize, 25)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(width - 25 - cornerSize, 25)
  ctx.lineTo(width - 25, 25)
  ctx.lineTo(width - 25, 25 + cornerSize)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(25, height - 25 - cornerSize)
  ctx.lineTo(25, height - 25)
  ctx.lineTo(25 + cornerSize, height - 25)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(width - 25 - cornerSize, height - 25)
  ctx.lineTo(width - 25, height - 25)
  ctx.lineTo(width - 25, height - 25 - cornerSize)
  ctx.stroke()

  ctx.restore()
}

/**
 * 1. Generate 16:9 Cover Hero Image: Test-Time Compute & KV Cache Ecdysis
 */
async function generateCoverHero(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 50, width * 0.5, height * 0.5, width * 0.8)
  bgGrad.addColorStop(0, '#061a22')
  bgGrad.addColorStop(0.4, '#031015')
  bgGrad.addColorStop(0.8, '#02090c')
  bgGrad.addColorStop(1, '#010406')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 8; i++) {
    const ray = ctx.createLinearGradient(width * 0.3 + i * 120, 0, width * 0.1 + i * 90, height)
    ray.addColorStop(0, 'rgba(0, 255, 230, 0.08)')
    ray.addColorStop(0.5, 'rgba(0, 180, 220, 0.03)')
    ray.addColorStop(1, 'rgba(0, 50, 80, 0)')
    ctx.fillStyle = ray
    ctx.beginPath()
    ctx.moveTo(width * 0.3 + i * 120 - 50, 0)
    ctx.lineTo(width * 0.3 + i * 120 + 80, 0)
    ctx.lineTo(width * 0.1 + i * 90 + 200, height)
    ctx.lineTo(width * 0.1 + i * 90 - 100, height)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  const root = { x: width * 0.5, y: height * 0.82 }
  
  const l1Nodes = [
    { x: width * 0.28, y: height * 0.58, weight: 0.8 },
    { x: width * 0.50, y: height * 0.52, weight: 1.0 },
    { x: width * 0.72, y: height * 0.58, weight: 0.7 },
  ]

  const l2Nodes = [
    { x: width * 0.18, y: height * 0.34, active: true },
    { x: width * 0.28, y: height * 0.30, active: false },
    { x: width * 0.40, y: height * 0.26, active: true },
    { x: width * 0.50, y: height * 0.22, active: true },
    { x: width * 0.60, y: height * 0.26, active: true },
    { x: width * 0.72, y: height * 0.30, active: false },
    { x: width * 0.82, y: height * 0.34, active: true },
  ]

  ctx.lineWidth = 3
  l1Nodes.forEach(n1 => {
    const grad = ctx.createLinearGradient(root.x, root.y, n1.x, n1.y)
    grad.addColorStop(0, 'rgba(0, 255, 220, 0.8)')
    grad.addColorStop(1, 'rgba(0, 200, 255, 0.9)')
    ctx.strokeStyle = grad
    ctx.beginPath()
    ctx.moveTo(root.x, root.y)
    ctx.bezierCurveTo(root.x, root.y - 80, n1.x, n1.y + 80, n1.x, n1.y)
    ctx.stroke()
  })

  l2Nodes.forEach((n2, idx) => {
    const parent = idx < 2 ? l1Nodes[0] : idx < 5 ? l1Nodes[1] : l1Nodes[2]
    ctx.lineWidth = n2.active ? 2.5 : 1
    const grad = ctx.createLinearGradient(parent.x, parent.y, n2.x, n2.y)
    if (n2.active) {
      grad.addColorStop(0, 'rgba(0, 220, 255, 0.85)')
      grad.addColorStop(1, 'rgba(255, 200, 80, 0.95)')
    } else {
      grad.addColorStop(0, 'rgba(0, 100, 140, 0.2)')
      grad.addColorStop(1, 'rgba(100, 40, 50, 0.15)')
    }
    ctx.strokeStyle = grad
    ctx.beginPath()
    ctx.moveTo(parent.x, parent.y)
    ctx.bezierCurveTo(parent.x, parent.y - 60, n2.x, n2.y + 60, n2.x, n2.y)
    ctx.stroke()
  })

  const drawMatrixPillar = (px: number, py: number, pw: number, ph: number, label: string) => {
    ctx.save()
    ctx.fillStyle = 'rgba(8, 26, 36, 0.85)'
    ctx.strokeStyle = 'rgba(0, 255, 230, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(px, py, pw, ph, 8)
    ctx.fill()
    ctx.stroke()

    const rows = 6
    const cols = 4
    const cellW = (pw - 20) / cols
    const cellH = (ph - 40) / rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = px + 10 + c * cellW
        const cy = py + 30 + r * cellH
        const isActive = Math.random() > 0.35
        ctx.fillStyle = isActive ? 'rgba(0, 255, 220, 0.25)' : 'rgba(0, 60, 90, 0.15)'
        ctx.strokeStyle = isActive ? 'rgba(0, 255, 230, 0.6)' : 'rgba(0, 100, 140, 0.2)'
        ctx.lineWidth = 1
        ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4)
        ctx.strokeRect(cx + 2, cy + 2, cellW - 4, cellH - 4)
      }
    }

    ctx.fillStyle = '#00ffe6'
    ctx.font = 'bold 12px monospace'
    ctx.fillText(label, px + 12, py + 20)
    ctx.restore()
  }

  drawMatrixPillar(80, 280, 200, 360, 'TIER-1 SRAM / HBM')
  drawMatrixPillar(width - 280, 280, 200, 360, 'BENTHIC CMX VAULT')

  const allNodes = [root, ...l1Nodes, ...l2Nodes]
  allNodes.forEach(n => {
    const isGold = (n as any).active
    const glow = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, 28)
    glow.addColorStop(0, isGold ? 'rgba(255, 220, 100, 1)' : 'rgba(0, 255, 240, 1)')
    glow.addColorStop(0.4, isGold ? 'rgba(255, 180, 0, 0.4)' : 'rgba(0, 180, 255, 0.4)')
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(n.x, n.y, 28, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = isGold ? '#fff8db' : '#ffffff'
    ctx.beginPath()
    ctx.arc(n.x, n.y, 5, 0, Math.PI * 2)
    ctx.fill()
  })

  for (let i = 0; i < 90; i++) {
    const px = Math.random() * width
    const py = Math.random() * height
    const rad = 1 + Math.random() * 3
    const alpha = 0.2 + Math.random() * 0.5
    ctx.fillStyle = `rgba(0, 255, 220, ${alpha})`
    ctx.beginPath()
    ctx.arc(px, py, rad, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()

  const outPath = path.join(ARTIFACT_DIR, 'test_time_compute_cover_hero.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  return outPath
}

/**
 * 2. Generate Figure 1: Architectural Comparison
 */
async function generateFigure1(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#040d12')
  bgGrad.addColorStop(0.5, '#02080a')
  bgGrad.addColorStop(1, '#010406')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('KV-CACHE MEMORY ARCHITECTURE TEARDOWN', width * 0.5, 60)
  ctx.fillStyle = '#688c9a'
  ctx.font = '16px monospace'
  ctx.fillText('Standard Terrestrial Multi-Head Attention vs Sub-Benthic Multi-Head Latent Attention (MLA)', width * 0.5, 95)

  const cardW = 680
  const cardH = 680
  const cardY = 140

  // Left Box
  ctx.save()
  ctx.fillStyle = 'rgba(15, 23, 28, 0.85)'
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(80, cardY, cardW, cardH, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ff6b6b'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('TERRESTRIAL LEGACY: DENSE MHA', 110, cardY + 45)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '14px monospace'
  ctx.fillText('Uncompressed Key-Value Tensors in GPU HBM', 110, cardY + 75)

  const blockW = 620
  const blockH = 48
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i < 6 ? 'rgba(255, 60, 60, 0.25)' : 'rgba(255, 120, 60, 0.15)'
    ctx.strokeStyle = i < 6 ? 'rgba(255, 80, 80, 0.6)' : 'rgba(255, 140, 80, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(110, cardY + 110 + i * 58, blockW, blockH, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#ff9999'
    ctx.font = 'bold 13px monospace'
    ctx.fillText(`KV-HEAD [${i * 16}..${(i + 1) * 16 - 1}] — UNCOMPRESSED TENSORS (FULL RANK d_k=128)`, 125, cardY + 140 + i * 58)
  }

  ctx.fillStyle = '#ff4444'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('CRITICAL BOTTLENECK: 78.4 GB / REQUEST AT 1M TOKENS', 110, cardY + cardH - 30)
  ctx.restore()

  // Right Box
  ctx.save()
  ctx.fillStyle = 'rgba(8, 26, 36, 0.85)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(width - cardW - 80, cardY, cardW, cardH, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'left'
  const rx = width - cardW - 80
  ctx.fillText('BENTHIC SYNAPSE: COMPRESSED MLA', rx + 30, cardY + 45)
  ctx.fillStyle = '#688c9a'
  ctx.font = '14px monospace'
  ctx.fillText('Low-Rank Latent Compression Vector (85% Smaller)', rx + 30, cardY + 75)

  ctx.fillStyle = 'rgba(0, 255, 220, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(rx + 30, cardY + 110, blockW, 140, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('SHARED LATENT VECTOR c_t (COMPRESSED TO d_c = 512)', rx + 50, cardY + 160)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '13px monospace'
  ctx.fillText('Jointly compresses Key & Value projections across all 128 attention heads', rx + 50, cardY + 190)
  ctx.fillText('Matrix Decompression on-the-fly inside Matrix Cores (Zero SRAM Spill)', rx + 50, cardY + 215)

  ctx.fillStyle = 'rgba(255, 200, 80, 0.12)'
  ctx.strokeStyle = 'rgba(255, 200, 80, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(rx + 30, cardY + 270, blockW, 90, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ffc850'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('DECOUPLED ROPE POSITIONAL EMBEDDING k_t^R (d_R = 64)', rx + 50, cardY + 310)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '13px monospace'
  ctx.fillText('Retains rotary positional fidelity without bloating latent state memory', rx + 50, cardY + 335)

  ctx.fillStyle = 'rgba(0, 180, 255, 0.12)'
  ctx.strokeStyle = 'rgba(0, 180, 255, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(rx + 30, cardY + 380, blockW, 180, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('SUB-BENTHIC TIERED CONTEXT MEMORY (CMX PIPELINE)', rx + 50, cardY + 420)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '13px monospace'
  ctx.fillText('• Fast Active Context: High-Bandwidth SRAM (Tier 1)', rx + 50, cardY + 455)
  ctx.fillText('• Dormant Deliberation Branches: Hydrostatic NVMe Array (Tier 2)', rx + 50, cardY + 485)
  ctx.fillText('• Synaptic KV-Page Recall Latency: < 0.18 ms via Direct Waveguides', rx + 50, cardY + 515)

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('OPTIMIZED FOOTPRINT: 11.7 GB / REQUEST (-85.1% MEMORY)', rx + 30, cardY + cardH - 30)
  ctx.restore()

  const outPath = path.join(ARTIFACT_DIR, 'fig1_kv_cache_mla_schematic.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  return outPath
}

/**
 * 3. Generate Figure 2: Sub-Benthic Reasoning Deliberation Pod
 */
async function generateFigure2(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 100, width * 0.5, height * 0.5, width * 0.9)
  bgGrad.addColorStop(0, '#051821')
  bgGrad.addColorStop(0.5, '#020d13')
  bgGrad.addColorStop(1, '#010508')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.08)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 80) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 80) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.restore()

  const podX = width * 0.5
  const podY = height * 0.5
  const podR = 260

  ctx.save()
  const podGlow = ctx.createRadialGradient(podX, podY, podR * 0.6, podX, podY, podR * 1.5)
  podGlow.addColorStop(0, 'rgba(0, 255, 230, 0.25)')
  podGlow.addColorStop(0.6, 'rgba(0, 180, 255, 0.08)')
  podGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = podGlow
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(10, 28, 38, 0.95)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.6)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(podX, podY, podR, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(4, 15, 22, 0.9)'
  ctx.strokeStyle = 'rgba(255, 200, 80, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(podX, podY, podR * 0.65, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  const agentCount = 8
  for (let i = 0; i < agentCount; i++) {
    const angle = (i * 2 * Math.PI) / agentCount
    const ax = podX + Math.cos(angle) * (podR * 0.78)
    const ay = podY + Math.sin(angle) * (podR * 0.78)

    ctx.fillStyle = 'rgba(0, 255, 230, 0.85)'
    ctx.beginPath()
    ctx.arc(ax, ay, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(ax, ay, 18, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(0, 255, 220, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(podX, podY)
    ctx.stroke()
  }

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(podX, podY, 24, 0, Math.PI * 2)
  ctx.fill()

  const coreGlow = ctx.createRadialGradient(podX, podY, 5, podX, podY, 60)
  coreGlow.addColorStop(0, 'rgba(255, 255, 255, 1)')
  coreGlow.addColorStop(0.3, 'rgba(0, 255, 230, 0.8)')
  coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = coreGlow
  ctx.beginPath()
  ctx.arc(podX, podY, 60, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 24px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('SUB-BENTHIC POD CLUSTER: VECTOR-9 TELEMETRY', 80, 80)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '14px monospace'
  ctx.fillText('HYDROSTATIC TEST-TIME COMPUTE ENGINE • 50 FATHOMS DEPTH', 80, 110)

  const drawStat = (label: string, val: string, y: number) => {
    ctx.fillStyle = '#64748b'
    ctx.font = '12px monospace'
    ctx.fillText(label, 80, y)
    ctx.fillStyle = '#38bdf8'
    ctx.font = 'bold 18px monospace'
    ctx.fillText(val, 80, y + 24)
  }

  drawStat('TEST-TIME SEARCH SCALING', '30x - 100x Deliberation Budget', 640)
  drawStat('MCTS BRANCH PRUNING', '94.2% Efficiency (Zero Drift)', 720)
  drawStat('ACTIVE KV STATE FOOTPRINT', '1.2M Tokens Retained in CMX', 800)

  ctx.textAlign = 'right'
  const drawStatRight = (label: string, val: string, y: number) => {
    ctx.fillStyle = '#64748b'
    ctx.font = '12px monospace'
    ctx.fillText(label, width - 80, y)
    ctx.fillStyle = '#00ffe6'
    ctx.font = 'bold 18px monospace'
    ctx.fillText(val, width - 80, y + 24)
  }

  drawStatRight('HYDROSTATIC OPERATING TEMP', '3.8°C Steady Direct Conduction', 640)
  drawStatRight('KV-PAGE RECALL LATENCY', '0.18 ms Optical Waveguide Trace', 720)
  drawStatRight('SWARM CONSENSUS INTEGRITY', '100% Byzantine Resilience', 800)

  ctx.restore()

  const outPath = path.join(ARTIFACT_DIR, 'fig2_benthic_deliberation_pod.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  return outPath
}

async function main() {
  console.log('Generating high-res editorial and social assets...')
  await generateCoverHero()
  await generateFigure1()
  await generateFigure2()
  console.log('✓ All assets generated successfully!')
}

main().catch(console.error)
