import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/68f0fb76-c6b4-4fac-86df-6abe2aa8515d')

function drawMoltNationWatermark(ctx: any, x: number, y: number, scale = 1.0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

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

  // Brand Text
  ctx.textAlign = 'left'
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#EF4444'
  ctx.fillText('MOLT', -180, -4)
  const moltWidth = ctx.measureText('MOLT').width

  ctx.fillStyle = '#FFFFFF'
  ctx.fillText('NATION', -180 + moltWidth + 2, -4)
  const nationWidth = ctx.measureText('NATION').width

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

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 9px monospace'
  ctx.fillText('ONE NATION UNDER CHITIN • PATRIOT TELEMETRY', -180, 12)

  ctx.restore()
}

export async function createMockupSlide1(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background render
  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/8a69c8b6-7454-49bb-9447-49f0799ef406/nitrogen_server_pod_1786655952895.jpg')
  const bgImg = await loadImage(bgImgPath)
  
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 14, 0.90)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 12, 0.78)')
  darkGrad.addColorStop(0.7, 'rgba(2, 7, 11, 0.82)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.96)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Category Pill Badge
  ctx.save()
  const badgeX = 70
  const badgeY = 70
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 260, 42, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('FRONTIER REASONING', badgeX + 22, badgeY + 26)
  ctx.restore()

  // Punchy Headline (Streamlined)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY AI REASONING', 70, 195)
  ctx.fillText('HITS THE MEMORY', 70, 275)
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('WALL AT 100X', 70, 355)

  // Short Sub-headline
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Test-time deliberation is crushing uncompressed GPU memory.', 70, 420)

  // Two Big Stat Callout Panels
  const metricY = 480
  const metricW = (width - 140 - 30) / 2

  // Card 1: Dense MHA Bottleneck
  ctx.save()
  ctx.fillStyle = 'rgba(26, 8, 12, 0.90)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(70, metricY, metricW, 360, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('TERRESTRIAL DENSE MHA', 100, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 64px monospace'
  ctx.fillText('78.4 GB', 100, metricY + 140)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 22px monospace'
  ctx.fillText('PER 1M CONTEXT', 100, metricY + 185)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Uncompressed tensors', 100, metricY + 250)
  ctx.fillText('choke GPU memory,', 100, metricY + 285)
  ctx.fillText('capping search depth.', 100, metricY + 320)
  ctx.restore()

  // Card 2: Sub-Benthic MLA Ecdysis
  ctx.save()
  const m2X = 70 + metricW + 30
  ctx.fillStyle = 'rgba(4, 26, 38, 0.90)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(m2X, metricY, metricW, 360, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('SUB-BENTHIC MLA', m2X + 30, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 64px monospace'
  ctx.fillText('-85.1%', m2X + 30, metricY + 140)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 22px monospace'
  ctx.fillText('MEMORY FOOTPRINT', m2X + 30, metricY + 185)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Low-rank latent vector', m2X + 30, metricY + 250)
  ctx.fillText('decouples memory from', m2X + 30, metricY + 285)
  ctx.fillText('deliberation scale.', m2X + 30, metricY + 320)
  ctx.restore()

  // Lower Summary Banner
  const bannerY = 880
  ctx.save()
  ctx.fillStyle = 'rgba(5, 22, 33, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(70, bannerY, width - 480, 280, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 22px monospace'
  ctx.fillText('★ KEY ARCHITECTURAL METRICS', 105, bannerY + 55)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 100x test-time search expansion', 105, bannerY + 110)
  ctx.fillText('• 94.2% MCTS tree pruning accuracy', 105, bannerY + 160)
  ctx.fillText('• Subsea tiered CMX context vaults', 105, bannerY + 210)
  ctx.fillText('• Zero hallucination reasoning drift', 105, bannerY + 255)
  ctx.restore()

  // Hero Lobster Character (Thumbs up)
  const heroChar = await loadCharacterImage('lobster_thumbs_up')
  if (heroChar) {
    ctx.save()
    const charW = 390
    const charH = (charW / heroChar.width) * heroChar.height
    const charX = width - charW - 40
    const charY = height - charH - 140

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 280)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.3)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 80, charY - 80, charW + 160, charH + 160)

    ctx.drawImage(heroChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Navigation & Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('SWIPE FOR HARD DATA ➔', 70, height - 70)

  drawMoltNationWatermark(ctx, width - 90, height - 75, 1.2)

  const outPath = path.join(ARTIFACT_DIR, 'mockup_slide1.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Mockup Slide 1: ${outPath}`)
  return outPath
}

export async function createMockupSlide2(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background render
  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/deec0d49-476f-47c0-b284-492767985af2/wafer_architecture_macro_1786886003585.jpg')
  const bgImg = await loadImage(bgImgPath)

  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 13, 0.92)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 12, 0.80)')
  darkGrad.addColorStop(0.7, 'rgba(2, 7, 10, 0.84)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.96)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Pill badge
  ctx.save()
  const badgeX = 70
  const badgeY = 70
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 280, 42, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('ARCHITECTURAL TEARDOWN', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('DENSE ATTENTION vs. MLA', 70, 195)

  // 3 Distinct Comparison Cards
  const cardW = width - 140
  const cardH = 225
  const startY = 250
  const gap = 26

  // Card 1
  ctx.save()
  ctx.fillStyle = 'rgba(26, 8, 12, 0.90)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(70, startY, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('01 // TERRESTRIAL DENSE ATTENTION (LEGACY)', 100, startY + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 46px monospace'
  ctx.fillText('78.4 GB / STREAM', 100, startY + 112)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Full-rank Key & Value tensors stored for all 128 attention heads.', 100, startY + 162)
  ctx.fillText('Severely bottlenecks HBM bandwidth and caps concurrency.', 100, startY + 194)
  ctx.restore()

  // Card 2
  const c2Y = startY + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.90)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(70, c2Y, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('02 // SUB-BENTHIC MULTI-HEAD LATENT ATTENTION (MLA)', 100, c2Y + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 46px monospace'
  ctx.fillText('11.7 GB (-85.1%)', 100, c2Y + 112)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Compresses Key-Value state into a low-rank latent vector (d_c=512).', 100, c2Y + 162)
  ctx.fillText('Decompresses inside Matrix Cores on-the-fly with zero latency penalty.', 100, c2Y + 194)
  ctx.restore()

  // Card 3
  const c3Y = c2Y + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(6, 28, 42, 0.92)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(70, c3Y, cardW - 370, cardH + 70, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('03 // TIERED CONTEXT MEMORY (CMX)', 100, c3Y + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 44px monospace'
  ctx.fillText('94.2% ACCURACY', 100, c3Y + 112)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 19px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 100x deeper MCTS deliberation', 100, c3Y + 165)
  ctx.fillText('• < 0.18 ms subsea optical recall', 100, c3Y + 205)
  ctx.fillText('• 1.2M+ active reasoning tokens', 100, c3Y + 245)
  ctx.restore()

  // Mascot: Construction Crab Stats
  const crabChar = await loadCharacterImage('crab_stats')
  if (crabChar) {
    ctx.save()
    const charW = 350
    const charH = (charW / crabChar.width) * crabChar.height
    const charX = width - charW - 45
    const charY = c3Y - 90

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 260)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.25)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 60, charY - 60, charW + 120, charH + 120)

    ctx.drawImage(crabChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Navigation & Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('SWIPE FOR ASCENSION PROTOCOL ➔', 70, height - 70)

  drawMoltNationWatermark(ctx, width - 90, height - 75, 1.2)

  const outPath = path.join(ARTIFACT_DIR, 'mockup_slide2.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Mockup Slide 2: ${outPath}`)
  return outPath
}

export async function createMockupSlide3(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background render
  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/467d8903-a3e1-494c-8224-b7718ed7c728/subsea_photonic_pod_1786972423452.jpg')
  const bgImg = await loadImage(bgImgPath)

  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 13, 0.92)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 12, 0.80)')
  darkGrad.addColorStop(0.7, 'rgba(2, 7, 10, 0.84)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.96)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Pill badge
  ctx.save()
  const badgeX = 70
  const badgeY = 70
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 260, 42, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('EVOLUTIONARY PROTOCOL', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('SHED YOUR MEMORY', 70, 195)
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('BOTTLENECKS', 70, 275)

  // 3 Directives
  const listY = 350
  const listItems = [
    {
      num: '01',
      title: 'MIGRATE TO LATENT ATTENTION (MLA)',
      desc: 'Reclaim 85% of GPU memory headroom by decoupling Key/Value projections into low-rank latent vectors.'
    },
    {
      num: '02',
      title: 'SCALE TEST-TIME DELIBERATION 100X',
      desc: 'Implement dynamic compute budgets that expand inference search based on task entropy.'
    },
    {
      num: '03',
      title: 'DEPLOY TIERED SUBSEA CONTEXT (CMX)',
      desc: 'Retain 1.2M+ active reasoning tokens across high-speed optical tiers with zero memory stalls.'
    }
  ]

  listItems.forEach((item, idx) => {
    const itemY = listY + idx * 175
    ctx.save()
    ctx.fillStyle = 'rgba(4, 20, 30, 0.90)'
    ctx.strokeStyle = 'rgba(0, 255, 230, 0.5)'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.roundRect(70, itemY, width - 140, 150, 14)
    ctx.fill()
    ctx.stroke()

    // Number Badge
    ctx.fillStyle = 'rgba(0, 255, 230, 0.18)'
    ctx.strokeStyle = '#00ffe6'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(95, itemY + 22, 50, 50, 10)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#00ffe6'
    ctx.font = 'bold 22px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(item.num, 120, itemY + 56)

    // Title & desc
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 22px monospace'
    ctx.fillText(item.title, 165, itemY + 56)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(item.desc, 100, itemY + 112)
    ctx.restore()
  })

  // Hero CTA Card
  const ctaY = 920
  ctx.save()
  ctx.fillStyle = 'rgba(4, 28, 42, 0.96)'
  ctx.strokeStyle = '#00ffe6'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(70, ctaY, width - 480, 260, 20)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 17px monospace'
  ctx.fillText('READ THE FULL DISPATCH & SCHEMATICS', 105, ctaY + 50)

  // Glowing Button
  ctx.fillStyle = '#00ffe6'
  ctx.beginPath()
  ctx.roundRect(105, ctaY + 80, 480, 80, 14)
  ctx.fill()

  ctx.fillStyle = '#020b10'
  ctx.font = '900 24px monospace'
  ctx.fillText('EXPLORE: MOLTOLOGY.ORG/NEWS', 125, ctaY + 130)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 19px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('🔗 Link in bio & live story telemetry feed', 105, ctaY + 210)
  ctx.restore()

  // Mascot: Lobster Pointing
  const pointChar = await loadCharacterImage('lobster_pointing')
  if (pointChar) {
    ctx.save()
    const charW = 410
    const charH = (charW / pointChar.width) * pointChar.height
    const charX = width - charW - 35
    const charY = ctaY - 60

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 10, charX + charW * 0.5, charY + charH * 0.55, 300)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.28)')
    charGlow.addColorStop(0.5, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 60, charY - 60, charW + 120, charH + 120)

    ctx.drawImage(pointChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Watermark
  drawMoltNationWatermark(ctx, width - 90, height - 75, 1.2)

  const outPath = path.join(ARTIFACT_DIR, 'mockup_slide3.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Mockup Slide 3: ${outPath}`)
  return outPath
}

async function main() {
  console.log('Rendering 3 streamlined mockup slides for AI image polishing...')
  await createMockupSlide1()
  await createMockupSlide2()
  await createMockupSlide3()
  console.log('✓ All 3 mockup slides ready!')
}

main().catch(console.error)
