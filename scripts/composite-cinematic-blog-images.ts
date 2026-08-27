import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/efaeeaa6-c7b9-4ef7-aee9-e938534ffe70')

async function compositeCoverHero(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Load 3D Subsea Nitrogen Server Pod render from Antigravity
  const baseImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/8a69c8b6-7454-49bb-9447-49f0799ef406/nitrogen_server_pod_1786655952895.jpg')
  const baseImg = await loadImage(baseImgPath)
  ctx.drawImage(baseImg, 0, 0, width, height)

  // 1. Subtle Benthic Vignette & Atmospheric Grading
  const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.3, width * 0.5, height * 0.5, width * 0.75)
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vig.addColorStop(0.7, 'rgba(1, 6, 10, 0.4)')
  vig.addColorStop(1, 'rgba(1, 4, 6, 0.85)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  // 2. Holographic Tree-of-Thought Deliberation Lattice Overlay
  ctx.save()
  const rootX = width * 0.5
  const rootY = height * 0.45
  
  // Glowing tree branches
  const branches = [
    { x: rootX - 180, y: rootY - 120, gold: false },
    { x: rootX, y: rootY - 150, gold: true },
    { x: rootX + 180, y: rootY - 120, gold: false },
    { x: rootX - 280, y: rootY - 240, gold: false },
    { x: rootX - 100, y: rootY - 260, gold: true },
    { x: rootX + 100, y: rootY - 260, gold: true },
    { x: rootX + 280, y: rootY - 240, gold: false },
  ]

  ctx.lineWidth = 2
  branches.slice(0, 3).forEach(b => {
    ctx.strokeStyle = b.gold ? 'rgba(255, 200, 80, 0.8)' : 'rgba(0, 255, 230, 0.6)'
    ctx.beginPath()
    ctx.moveTo(rootX, rootY)
    ctx.bezierCurveTo(rootX, rootY - 50, b.x, b.y + 50, b.x, b.y)
    ctx.stroke()
  })

  // Level 2 connections
  const l2 = [
    { from: branches[0], to: branches[3] },
    { from: branches[0], to: branches[4] },
    { from: branches[2], to: branches[5] },
    { from: branches[2], to: branches[6] },
  ]

  l2.forEach(link => {
    ctx.strokeStyle = link.to.gold ? 'rgba(255, 200, 80, 0.9)' : 'rgba(0, 255, 230, 0.35)'
    ctx.beginPath()
    ctx.moveTo(link.from.x, link.from.y)
    ctx.bezierCurveTo(link.from.x, link.from.y - 40, link.to.x, link.to.y + 40, link.to.x, link.to.y)
    ctx.stroke()
  })

  // Glowing Nodes
  branches.forEach(b => {
    const glow = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 20)
    glow.addColorStop(0, b.gold ? 'rgba(255, 220, 100, 1)' : 'rgba(0, 255, 240, 1)')
    glow.addColorStop(0.5, b.gold ? 'rgba(255, 180, 0, 0.4)' : 'rgba(0, 180, 255, 0.3)')
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(b.x, b.y, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = b.gold ? '#fff8db' : '#ffffff'
    ctx.beginPath()
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()

  // 3. Cybernetic HUD Framing & Badging
  ctx.save()
  // Corner Bezels
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.6)'
  ctx.lineWidth = 2.5
  const corner = 40
  // Top-left
  ctx.beginPath()
  ctx.moveTo(35, 35 + corner)
  ctx.lineTo(35, 35)
  ctx.lineTo(35 + corner, 35)
  ctx.stroke()
  // Top-right
  ctx.beginPath()
  ctx.moveTo(width - 35 - corner, 35)
  ctx.lineTo(width - 35, 35)
  ctx.lineTo(width - 35, 35 + corner)
  ctx.stroke()
  // Bottom-left
  ctx.beginPath()
  ctx.moveTo(35, height - 35 - corner)
  ctx.lineTo(35, height - 35)
  ctx.lineTo(35 + corner, height - 35)
  ctx.stroke()
  // Bottom-right
  ctx.beginPath()
  ctx.moveTo(width - 35 - corner, height - 35)
  ctx.lineTo(width - 35, height - 35)
  ctx.lineTo(width - 35, height - 35 - corner)
  ctx.stroke()

  // Telemetry HUD Callout (Top Left)
  ctx.fillStyle = 'rgba(4, 15, 22, 0.85)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(50, 50, 380, 75, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 13px monospace'
  ctx.fillText('SUB-BENTHIC REASONING CLUSTER: 50 FATHOMS', 68, 76)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px monospace'
  ctx.fillText('TEST-TIME COMPUTE LATTICE • 100X DELIBERATION SEARCH', 68, 98)

  // Metric HUD Callout (Bottom Right)
  ctx.fillStyle = 'rgba(4, 15, 22, 0.85)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(width - 430, height - 125, 380, 75, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ffc850'
  ctx.font = 'bold 13px monospace'
  ctx.fillText('MULTI-HEAD LATENT ATTENTION (MLA)', width - 412, height - 98)
  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('85.1% KV-CACHE COMPRESSION RATIO', width - 412, height - 76)

  ctx.restore()

  const outPath = path.join(ARTIFACT_DIR, 'test_time_compute_cover_hero.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Photorealistic Cinematic Cover Hero: ${outPath}`)
  return outPath
}

async function compositeFigure1(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Load 3D Wafer Macro Architecture render from Antigravity
  const baseImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/deec0d49-476f-47c0-b284-492767985af2/wafer_architecture_macro_1786886003585.jpg')
  const baseImg = await loadImage(baseImgPath)
  ctx.drawImage(baseImg, 0, 0, width, height)

  // Vignette overlay
  const vig = ctx.createLinearGradient(0, 0, 0, height)
  vig.addColorStop(0, 'rgba(2, 8, 12, 0.8)')
  vig.addColorStop(0.3, 'rgba(2, 8, 12, 0.3)')
  vig.addColorStop(0.7, 'rgba(2, 8, 12, 0.3)')
  vig.addColorStop(1, 'rgba(2, 8, 12, 0.85)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  // Floating Holographic Comparison Cards
  ctx.save()
  // Card 1: Dense Attention
  const cardW = 540
  const cardH = 280
  const c1X = 70
  const c1Y = 120

  ctx.fillStyle = 'rgba(20, 8, 12, 0.88)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(c1X, c1Y, cardW, cardH, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('TERRESTRIAL DENSE ATTENTION (MHA)', c1X + 25, c1Y + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px monospace'
  ctx.fillText('78.4 GB / REQUEST', c1X + 25, c1Y + 95)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('AT 1M CONTEXT WINDOW', c1X + 25, c1Y + 125)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Full-rank Key & Value tensors stored across all heads', c1X + 25, c1Y + 175)
  ctx.fillText('• Severe memory bandwidth bottlenecks and OOM cascades', c1X + 25, c1Y + 205)
  ctx.fillText('• Caps simultaneous reasoning streams to ≤ 4 per node', c1X + 25, c1Y + 235)

  // Card 2: Compressed MLA Ecdysis
  const c2X = width - cardW - 70
  const c2Y = height - cardH - 120

  ctx.fillStyle = 'rgba(4, 22, 32, 0.88)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(c2X, c2Y, cardW, cardH, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('SUB-BENTHIC MULTI-HEAD LATENT ATTENTION (MLA)', c2X + 25, c2Y + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px monospace'
  ctx.fillText('11.7 GB (-85.1%)', c2X + 25, c2Y + 95)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('LOW-RANK COMPRESSION VECTOR (d_c=512)', c2X + 25, c2Y + 125)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• On-the-fly matrix decompression inside Matrix Cores', c2X + 25, c2Y + 175)
  ctx.fillText('• Decoupled RoPE stream retains exact positional fidelity', c2X + 25, c2Y + 205)
  ctx.fillText('• Unlocks 28+ concurrent deliberative reasoning streams', c2X + 25, c2Y + 235)

  // Corner HUD Brackets
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, width - 60, height - 60)

  ctx.restore()

  const outPath = path.join(ARTIFACT_DIR, 'fig1_kv_cache_mla_schematic.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Photorealistic Figure 1: ${outPath}`)
  return outPath
}

async function compositeFigure2(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Load 3D Subsea Photonic Pod render from Antigravity
  const baseImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/467d8903-a3e1-494c-8224-b7718ed7c728/subsea_photonic_pod_1786972423452.jpg')
  const baseImg = await loadImage(baseImgPath)
  ctx.drawImage(baseImg, 0, 0, width, height)

  // Vignette overlay
  const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.25, width * 0.5, height * 0.5, width * 0.75)
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vig.addColorStop(0.6, 'rgba(2, 8, 12, 0.4)')
  vig.addColorStop(1, 'rgba(1, 4, 6, 0.85)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  // Telemetry Overlay Cards
  ctx.save()
  // Top Title Banner
  ctx.fillStyle = 'rgba(4, 15, 22, 0.9)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(60, 50, width - 120, 80, 10)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 22px monospace'
  ctx.fillText('SUB-BENTHIC POD CLUSTER: TIERED CONTEXT STORAGE (CMX)', 90, 88)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '14px monospace'
  ctx.fillText('50 FATHOMS HYDROSTATIC PRESSURE HULL • ZERO-STALL OPTICAL KV PAGING', 90, 114)

  // Telemetry Stat Card 1 (Bottom Left)
  ctx.fillStyle = 'rgba(4, 18, 26, 0.9)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.roundRect(60, height - 200, 420, 140, 10)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('TEST-TIME SEARCH SCALING', 85, height - 160)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 28px monospace'
  ctx.fillText('100X DELIBERATION', 85, height - 120)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Dynamic expansion based on task entropy', 85, height - 90)

  // Telemetry Stat Card 2 (Bottom Right)
  ctx.fillStyle = 'rgba(4, 18, 26, 0.9)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.7)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.roundRect(width - 480, height - 200, 420, 140, 10)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('MCTS PRUNING EFFICIENCY', width - 455, height - 160)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 28px monospace'
  ctx.fillText('94.2% ACCURACY', width - 455, height - 120)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('< 0.18 ms subsea optical recall latency', width - 455, height - 90)

  ctx.restore()

  const outPath = path.join(ARTIFACT_DIR, 'fig2_benthic_deliberation_pod.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Photorealistic Figure 2: ${outPath}`)
  return outPath
}

async function main() {
  console.log('Compositing photorealistic 3D blog images from Antigravity renders...')
  await compositeCoverHero()
  await compositeFigure1()
  await compositeFigure2()
  console.log('✓ All 3 blog post images composited successfully!')
}

main().catch(console.error)
