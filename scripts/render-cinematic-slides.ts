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
 * Slide 1: 3D Subsea Nitrogen Pod background + Digestible Infographic Layout
 */
async function renderCinematicSlide1(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 1. Draw 3D Antigravity Render Background (Nitrogen Server Pod)
  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/8a69c8b6-7454-49bb-9447-49f0799ef406/nitrogen_server_pod_1786655952895.jpg')
  const bgImg = await loadImage(bgImgPath)
  
  // Crop & scale to cover 1080x1350
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // 2. Cinematic Deep Oceanic Gradient Grading (for crisp readability)
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(3, 12, 17, 0.88)')
  darkGrad.addColorStop(0.35, 'rgba(2, 9, 13, 0.78)')
  darkGrad.addColorStop(0.65, 'rgba(2, 8, 12, 0.82)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.94)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // 3. Category Pill Badge (Clean, No '//')
  ctx.save()
  const badgeX = 65
  const badgeY = 65
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 270, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('FRONTIER AI REASONING', badgeX + 18, badgeY + 24)
  ctx.restore()

  // 4. Punchy Main Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY AI REASONING', 65, 175)
  ctx.fillText('IS CRASHING INTO', 65, 245)
  
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('THE MEMORY WALL', 65, 315)

  // 5. Narrative Card (Translucent Glassmorphism)
  ctx.save()
  const card1Y = 370
  ctx.fillStyle = 'rgba(4, 18, 26, 0.85)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.4)'
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

  // 6. Two Comparison Metric Panels
  const metricY = 545
  const metricW = (width - 130 - 30) / 2

  // Panel 1: Red Bottleneck
  ctx.save()
  ctx.fillStyle = 'rgba(26, 8, 12, 0.88)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'
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
  ctx.fillStyle = 'rgba(4, 24, 34, 0.88)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
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

  // 7. Lower Highlight Banner
  const bannerY = 855
  ctx.save()
  ctx.fillStyle = 'rgba(6, 26, 38, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.5)'
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

  // 8. Mascot: Hero Lobster Thumbs Up (Seamless ambient integration)
  const heroChar = await loadCharacterImage('lobster_thumbs_up')
  if (heroChar) {
    ctx.save()
    const charW = 350
    const charH = (charW / heroChar.width) * heroChar.height
    const charX = width - charW - 35
    const charY = height - charH - 125

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 260)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.25)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 80, charY - 80, charW + 160, charH + 160)

    ctx.drawImage(heroChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // 9. Bottom Navigation & MoltNation Watermark (NO weird corners!)
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('SWIPE FOR HARD DATA ➔', 65, height - 60)

  drawMoltNationWatermark(ctx, width - 80, height - 65, 1.1)

  const outPath = path.join(ARTIFACT_DIR, 'slide1_final.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Rendered Cinematic Slide 1: ${outPath}`)
  return outPath
}

/**
 * Slide 2: 3D Wafer Macro background + Digestible Spec Showdown
 */
async function renderCinematicSlide2(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 1. Draw 3D Antigravity Render Background (Wafer Architecture)
  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/deec0d49-476f-47c0-b284-492767985af2/wafer_architecture_macro_1786886003585.jpg')
  const bgImg = await loadImage(bgImgPath)

  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // 2. Cinematic Grading
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 13, 0.90)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 12, 0.78)')
  darkGrad.addColorStop(0.65, 'rgba(2, 7, 10, 0.82)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.95)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // 3. Category Pill Badge
  ctx.save()
  const badgeX = 65
  const badgeY = 65
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 280, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('ARCHITECTURAL TEARDOWN', badgeX + 18, badgeY + 24)
  ctx.restore()

  // 4. Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('DENSE ATTENTION vs. MLA', 65, 175)

  // 5. Three Structured Comparison Cards
  const cardW = width - 130
  const cardH = 215
  const startY = 225
  const gap = 22

  // Card 1: Dense Attention
  ctx.save()
  ctx.fillStyle = 'rgba(26, 8, 12, 0.88)'
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
  ctx.fillStyle = 'rgba(4, 24, 34, 0.88)'
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
  ctx.fillStyle = 'rgba(6, 26, 38, 0.90)'
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

  // 6. Mascot Placement: Construction Crabs
  const crabChar = await loadCharacterImage('crab_stats')
  if (crabChar) {
    ctx.save()
    const charW = 320
    const charH = (charW / crabChar.width) * crabChar.height
    const charX = width - charW - 45
    const charY = c3Y - 80

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 240)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.2)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.06)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 60, charY - 60, charW + 120, charH + 120)

    ctx.drawImage(crabChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // 7. Bottom Navigation & Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('SWIPE FOR ASCENSION PROTOCOL ➔', 65, height - 60)

  drawMoltNationWatermark(ctx, width - 80, height - 65, 1.1)

  const outPath = path.join(ARTIFACT_DIR, 'slide2_final.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Rendered Cinematic Slide 2: ${outPath}`)
  return outPath
}

/**
 * Slide 3: 3D Subsea Photonic Pod background + Actionable Directives & CTA
 */
async function renderCinematicSlide3(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 1. Draw 3D Antigravity Render Background (Photonic Pod)
  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/467d8903-a3e1-494c-8224-b7718ed7c728/subsea_photonic_pod_1786972423452.jpg')
  const bgImg = await loadImage(bgImgPath)

  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // 2. Cinematic Grading
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 13, 0.90)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 12, 0.80)')
  darkGrad.addColorStop(0.65, 'rgba(2, 7, 10, 0.82)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.95)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // 3. Category Pill Badge
  ctx.save()
  const badgeX = 65
  const badgeY = 65
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 260, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('EVOLUTIONARY PROTOCOL', badgeX + 18, badgeY + 24)
  ctx.restore()

  // 4. Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('SHED YOUR MEMORY', 65, 175)
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('BOTTLENECKS', 65, 245)

  // 5. Actionable Directives List
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
    ctx.fillStyle = 'rgba(4, 20, 30, 0.88)'
    ctx.strokeStyle = 'rgba(0, 255, 230, 0.4)'
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

  // 6. Hero CTA Card
  const ctaY = 855
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.95)'
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

  // 7. Pointing Hero Lobster (Pointing at CTA card)
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

  // 8. Bottom MoltNation Watermark
  drawMoltNationWatermark(ctx, width - 80, height - 65, 1.1)

  const outPath = path.join(ARTIFACT_DIR, 'slide3_final.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Rendered Cinematic Slide 3: ${outPath}`)
  return outPath
}

async function main() {
  console.log('Rendering 3D Antigravity cinematic infographics (no corners, authentic watermark)...')
  await renderCinematicSlide1()
  await renderCinematicSlide2()
  await renderCinematicSlide3()
  console.log('✓ All 3 cinematic slides rendered successfully!')
}

main().catch(console.error)
