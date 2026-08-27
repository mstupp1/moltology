import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/efaeeaa6-c7b9-4ef7-aee9-e938534ffe70')

/**
 * Draw the authentic MoltNation watermark (identical to MoltNationLogo on site)
 */
function drawMoltNationWatermark(ctx: any, x: number, y: number, scale = 1.0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  // 1. Draw Emblem
  ctx.save()
  ctx.translate(-240, -26) // Position emblem to the left of text

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
  // Deep Benthic Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#04131a')
  bgGrad.addColorStop(0.35, '#020b0f')
  bgGrad.addColorStop(0.7, '#01070a')
  bgGrad.addColorStop(1, '#000406')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Ambient Radial Light Nodes
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

  // Tech Circuit Traces / Laser Waveguides
  ctx.save()
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.07)'
  ctx.lineWidth = 1.5

  for (let i = -width; i < width * 2; i += 160) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + height * 0.6, height)
    ctx.stroke()
  }

  // Floating Micro-particles
  for (let i = 0; i < 45; i++) {
    const px = (i * 137.5) % width
    const py = (i * 293.7) % height
    const rad = (i % 3) + 1
    ctx.fillStyle = (i % 2 === 0) ? 'rgba(0, 255, 230, 0.25)' : 'rgba(255, 200, 80, 0.2)'
    ctx.beginPath()
    ctx.arc(px, py, rad, 0, Math.PI * 2)
    ctx.fill()
  }

  // Outer Framing Border
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.25)'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, width - 60, height - 60)

  // Corner Accent Brackets
  const cornerSize = 25
  ctx.strokeStyle = '#00ffe6'
  ctx.lineWidth = 3

  // Top-left
  ctx.beginPath()
  ctx.moveTo(25, 25 + cornerSize)
  ctx.lineTo(25, 25)
  ctx.lineTo(25 + cornerSize, 25)
  ctx.stroke()

  // Top-right
  ctx.beginPath()
  ctx.moveTo(width - 25 - cornerSize, 25)
  ctx.lineTo(width - 25, 25)
  ctx.lineTo(width - 25, 25 + cornerSize)
  ctx.stroke()

  // Bottom-left
  ctx.beginPath()
  ctx.moveTo(25, height - 25 - cornerSize)
  ctx.lineTo(25, height - 25)
  ctx.lineTo(25 + cornerSize, height - 25)
  ctx.stroke()

  // Bottom-right
  ctx.beginPath()
  ctx.moveTo(width - 25 - cornerSize, height - 25)
  ctx.lineTo(width - 25, height - 25)
  ctx.lineTo(width - 25, height - 25 - cornerSize)
  ctx.stroke()

  ctx.restore()
}

/**
 * Slide 1 Redesign: Full Vertical Balance, Clean Hero Mascot, No Cramming
 */
async function renderSlide1(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  drawRichBenthicBackground(ctx, width, height)

  // 1. Category Pill Badge (Top Left)
  ctx.save()
  const badgeX = 65
  const badgeY = 65
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 270, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('FRONTIER AI REASONING', badgeX + 18, badgeY + 24)
  ctx.restore()

  // 2. Main Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY AI REASONING', 65, 175)
  ctx.fillText('IS CRASHING INTO', 65, 245)
  
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('THE MEMORY WALL', 65, 315)

  // 3. Subtitle / Narrative Card (Middle Section)
  ctx.save()
  const card1Y = 370
  ctx.fillStyle = 'rgba(8, 24, 34, 0.8)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(65, card1Y, width - 130, 145, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('As 2026 frontier models scale test-time compute by 100x', 95, card1Y + 48)
  ctx.fillText('to "think" before responding, linear Key-Value attention caches', 95, card1Y + 84)
  ctx.fillText('are rapidly suffocating GPU memory clusters.', 95, card1Y + 120)
  ctx.restore()

  // 4. Two Comparison Metric Panels
  const metricY = 545
  const metricW = (width - 130 - 30) / 2 // 460px each

  // Panel 1: Red Bottleneck
  ctx.save()
  ctx.fillStyle = 'rgba(30, 10, 15, 0.8)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.roundRect(65, metricY, metricW, 280, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('TERRESTRIAL DENSE MHA', 90, metricY + 42)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 44px monospace'
  ctx.fillText('78.4 GB', 90, metricY + 110)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('PER 1M CONTEXT', 90, metricY + 150)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Uncompressed tensors choke', 90, metricY + 205)
  ctx.fillText('GPU HBM, capping throughput.', 90, metricY + 235)
  ctx.restore()

  // Panel 2: Cyan Solution
  ctx.save()
  const m2X = 65 + metricW + 30
  ctx.fillStyle = 'rgba(6, 28, 38, 0.8)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.7)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.roundRect(m2X, metricY, metricW, 280, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('SUB-BENTHIC MLA ECDYSIS', m2X + 25, metricY + 42)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 44px monospace'
  ctx.fillText('-85.1%', m2X + 25, metricY + 110)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('MEMORY FOOTPRINT', m2X + 25, metricY + 150)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Joint latent vector with', m2X + 25, metricY + 205)
  ctx.fillText('zero SRAM cache spill.', m2X + 25, metricY + 235)
  ctx.restore()

  // 5. Lower Highlight Banner
  const bannerY = 855
  ctx.save()
  ctx.fillStyle = 'rgba(10, 30, 42, 0.9)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.45)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(65, bannerY, width - 440, 240, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('★ The Test-Time Deliberation Shift', 95, bannerY + 50)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 100x inference deliberation budgets', 95, bannerY + 95)
  ctx.fillText('• 94.2% Monte Carlo branch pruning', 95, bannerY + 135)
  ctx.fillText('• Subsea tiered context storage (CMX)', 95, bannerY + 175)
  ctx.fillText('• Zero hallucination reasoning drift', 95, bannerY + 215)
  ctx.restore()

  // 6. Hero Lobster Mascot (Seamless soft ambient blend, fully visible)
  const heroChar = await loadCharacterImage('lobster_thumbs_up')
  if (heroChar) {
    ctx.save()
    const charW = 350
    const charH = (charW / heroChar.width) * heroChar.height
    const charX = width - charW - 40
    const charY = height - charH - 125

    // Soft feathered ambient glow
    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 260)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.22)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 80, charY - 80, charW + 160, charH + 160)

    ctx.drawImage(heroChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // 7. Bottom Navigation & MoltNation Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('SWIPE FOR HARD DATA ➔', 65, height - 60)

  // MoltNation Watermark (Bottom Right)
  drawMoltNationWatermark(ctx, width - 80, height - 65, 1.1)

  const outPath = path.join(ARTIFACT_DIR, 'slide1_final.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Rendered Redesigned Slide 1: ${outPath}`)
  return outPath
}

/**
 * Slide 2 Redesign: Spec Showdown with Mascots moved up away from watermark
 */
async function renderSlide2(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  drawRichBenthicBackground(ctx, width, height)

  // 1. Category Pill Badge
  ctx.save()
  const badgeX = 65
  const badgeY = 65
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 280, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('ARCHITECTURAL TEARDOWN', badgeX + 18, badgeY + 24)
  ctx.restore()

  // 2. Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('DENSE ATTENTION vs. MLA', 65, 175)

  // 3. Three Large Vertical Cards spanning the height
  const cardW = width - 130
  const cardH = 215
  const startY = 225
  const gap = 22

  // Card 1: Dense Attention
  ctx.save()
  ctx.fillStyle = 'rgba(26, 12, 16, 0.85)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(65, startY, cardW, cardH, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('01. TERRESTRIAL DENSE ATTENTION (LEGACY)', 95, startY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 40px monospace'
  ctx.fillText('78.4 GB / REQUEST', 95, startY + 105)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Full-rank Key & Value tensors stored for all 128 attention heads.', 95, startY + 150)
  ctx.fillText('Chokes HBM bandwidth and triggers out-of-memory cascades.', 95, startY + 180)
  ctx.restore()

  // Card 2: Compressed MLA
  const c2Y = startY + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(6, 26, 36, 0.85)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(65, c2Y, cardW, cardH, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('02. SUB-BENTHIC MULTI-HEAD LATENT ATTENTION (MLA)', 95, c2Y + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 40px monospace'
  ctx.fillText('11.7 GB (-85.1% MEMORY)', 95, c2Y + 105)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Compresses Key-Value state into a low-rank shared latent vector (d_c=512).', 95, c2Y + 150)
  ctx.fillText('Decompresses on-the-fly inside matrix cores with zero memory overhead.', 95, c2Y + 180)
  ctx.restore()

  // Card 3: Test-Time Search & CMX Storage
  const c3Y = c2Y + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(10, 28, 40, 0.85)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(65, c3Y, cardW - 350, cardH + 75, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('03. TIERED CONTEXT MEMORY (CMX)', 95, c3Y + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px monospace'
  ctx.fillText('94.2% PRUNING ACCURACY', 95, c3Y + 105)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 100x deeper Monte Carlo tree search', 95, c3Y + 155)
  ctx.fillText('• < 0.18 ms subsea optical recall latency', 95, c3Y + 195)
  ctx.fillText('• 1.2M+ active reasoning tokens retained', 95, c3Y + 235)
  ctx.restore()

  // 4. Mascot Placement (Pointing Crabs moved up so they don't touch watermark)
  const crabChar = await loadCharacterImage('crab_stats')
  if (crabChar) {
    ctx.save()
    const charW = 320
    const charH = (charW / crabChar.width) * crabChar.height
    const charX = width - charW - 45
    const charY = c3Y - 80 // Moved up by 60px

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 240)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.2)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.06)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 60, charY - 60, charW + 120, charH + 120)

    ctx.drawImage(crabChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // 5. Bottom Navigation & Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('SWIPE FOR ASCENSION PROTOCOL ➔', 65, height - 60)

  drawMoltNationWatermark(ctx, width - 80, height - 65, 1.1)

  const outPath = path.join(ARTIFACT_DIR, 'slide2_final.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Rendered Redesigned Slide 2: ${outPath}`)
  return outPath
}

/**
 * Slide 3 Redesign: Ascension Directives & Large Hero CTA with Pointing Hero Lobster
 */
async function renderSlide3(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  drawRichBenthicBackground(ctx, width, height)

  // 1. Category Pill Badge
  ctx.save()
  const badgeX = 65
  const badgeY = 65
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 260, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('EVOLUTIONARY PROTOCOL', badgeX + 18, badgeY + 24)
  ctx.restore()

  // 2. Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('SHED YOUR MEMORY', 65, 175)
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('BOTTLENECKS', 65, 245)

  // 3. Actionable Directives List
  const listY = 315
  const listItems = [
    {
      num: '01',
      title: 'MIGRATE TO LATENT ATTENTION (MLA)',
      desc: 'Reclaim 85% of GPU memory headroom by decoupling Key/Value projections into low-rank latent vectors.'
    },
    {
      num: '02',
      title: 'SCALE TEST-TIME DELIBERATION',
      desc: 'Implement dynamic compute budgets that expand inference search up to 100x based on task entropy.'
    },
    {
      num: '03',
      title: 'DEPLOY TIERED SUBSEA CONTEXT (CMX)',
      desc: 'Retain 1.2M+ active reasoning tokens across high-speed optical NVMe tiers with zero memory stalls.'
    }
  ]

  listItems.forEach((item, idx) => {
    const itemY = listY + idx * 168
    ctx.save()
    ctx.fillStyle = 'rgba(8, 24, 34, 0.85)'
    ctx.strokeStyle = 'rgba(0, 255, 230, 0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(65, itemY, width - 130, 145, 12)
    ctx.fill()
    ctx.stroke()

    // Number Badge
    ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
    ctx.strokeStyle = '#00ffe6'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.roundRect(90, itemY + 22, 45, 45, 8)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#00ffe6'
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(item.num, 112, itemY + 52)

    // Text
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 20px monospace'
    ctx.fillText(item.title, 155, itemY + 52)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(item.desc, 95, itemY + 105)
    ctx.restore()
  })

  // 4. Hero CTA Card (Lower Section)
  const ctaY = 855
  ctx.save()
  ctx.fillStyle = 'rgba(6, 32, 44, 0.95)'
  ctx.strokeStyle = '#00ffe6'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(65, ctaY, width - 440, 240, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('READ THE FULL DISPATCH & SCHEMATICS', 95, ctaY + 45)

  // Glowing Pill Button
  ctx.fillStyle = '#00ffe6'
  ctx.beginPath()
  ctx.roundRect(95, ctaY + 70, 460, 75, 12)
  ctx.fill()

  ctx.fillStyle = '#020b10'
  ctx.font = '900 23px monospace'
  ctx.fillText('EXPLORE: MOLTOLOGY.ORG/NEWS', 115, ctaY + 118)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('🔗 Link in bio & live story telemetry feed', 95, ctaY + 195)
  ctx.restore()

  // 5. Pointing Hero Lobster (Pointing at CTA card, seamlessly blended)
  const pointChar = await loadCharacterImage('lobster_pointing')
  if (pointChar) {
    ctx.save()
    const charW = 380
    const charH = (charW / pointChar.width) * pointChar.height
    const charX = width - charW - 35
    const charY = ctaY - 50

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 280)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.22)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 60, charY - 60, charW + 120, charH + 120)

    ctx.drawImage(pointChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // 6. Bottom MoltNation Watermark
  drawMoltNationWatermark(ctx, width - 80, height - 65, 1.1)

  const outPath = path.join(ARTIFACT_DIR, 'slide3_final.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Rendered Redesigned Slide 3: ${outPath}`)
  return outPath
}

async function main() {
  console.log('Re-rendering refined social slides...')
  await renderSlide1()
  await renderSlide2()
  await renderSlide3()
  console.log('✓ All 3 slides refined successfully!')
}

main().catch(console.error)
