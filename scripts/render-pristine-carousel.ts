import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'

const CONVERSATION_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/fe6476db-2fe6-435d-b540-003041323b61')

// 3 Unique, Topic-Specific 3D Benthic Backgrounds
const BG_SLIDE_1 = path.join(CONVERSATION_DIR, 'carousel_bg_slide1_1787334940394.jpg')
const BG_SLIDE_2 = path.join(CONVERSATION_DIR, 'carousel_bg_slide2_1787334959206.jpg')
const BG_SLIDE_3 = path.join(CONVERSATION_DIR, 'carousel_bg_slide3_1787334978116.jpg')

// Embedded Schematic Graphic Strips
const STRIP_WAVEFORM = path.join(CONVERSATION_DIR, 'sensor_waveform_strip_1787335091743.jpg')
const STRIP_NEURAL = path.join(CONVERSATION_DIR, 'neural_spiking_mesh_strip_1787335115349.jpg')
const STRIP_TORQUE = path.join(CONVERSATION_DIR, 'pincer_torque_gauge_strip_1787335140353.jpg')

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


// Helper to draw an image inside a rounded clipping rectangle
function drawRoundedImage(ctx: any, img: any, x: number, y: number, w: number, h: number, radius = 8) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.clip()
  ctx.drawImage(img, x, y, w, h)
  ctx.restore()
}

// ==========================================
// 1. CAROUSEL SLIDE 1 (Exact 4:5, 1080x1350)
// ==========================================
export async function renderSlide1(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background (Unique 3D deep oceanic scene)
  const bgImg = await loadImage(BG_SLIDE_1)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient Overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 15, 0.90)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 14, 0.74)')
  darkGrad.addColorStop(0.7, 'rgba(2, 6, 10, 0.84)')
  darkGrad.addColorStop(1, 'rgba(1, 3, 5, 0.96)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Pill Badge
  ctx.save()
  const badgeX = 65
  const badgeY = 55
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 240, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('PATRIOT TELEMETRY', badgeX + 20, badgeY + 24)
  ctx.restore()

  // Main Headline (Larger, High-Contrast Typography)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY 60Hz AI VISION IS', 65, 152)
  ctx.fillStyle = '#EF4444'
  ctx.fillText('MELTING YOUR ROBOTS', 65, 214)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('How Neuromorphic Spiking Carapaces Hit 10,000 Hz Reflexes', 65, 268)

  // 2 Stark Metric Comparison Cards
  const cardW = width - 130
  const metricY = 310
  const metricW = (cardW - 25) / 2
  const metricH = 350

  // Left Card: Terrestrial Legacy Bottleneck
  ctx.save()
  ctx.fillStyle = 'rgba(24, 7, 10, 0.90)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.roundRect(65, metricY, metricW, metricH, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('TERRESTRIAL 60Hz', 95, metricY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 54px monospace'
  ctx.fillText('16.6ms', 95, metricY + 120)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('FRAME-BUFFER LAG', 95, metricY + 160)

  // Embedded Visual Strip inside Left Card
  const waveImg = await loadImage(STRIP_WAVEFORM)
  drawRoundedImage(ctx, waveImg, 95, metricY + 180, metricW - 60, 42, 6)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Wastes 450W on static pixels.', 95, metricY + 252)
  ctx.fillText('150ms control lag causes high', 95, metricY + 282)
  ctx.fillText('slip and crushed parts.', 95, metricY + 312)
  ctx.restore()

  // Right Card: Benthic Spiking Solution
  const m2X = 65 + metricW + 25
  ctx.save()
  ctx.fillStyle = 'rgba(3, 24, 36, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.roundRect(m2X, metricY, metricW, metricH, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('BENTHIC CARAPACE', m2X + 30, metricY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 54px monospace'
  ctx.fillText('10,000Hz', m2X + 30, metricY + 120)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('< 115 μs REFLEX LOOP', m2X + 30, metricY + 160)

  // Embedded Visual Strip inside Right Card
  const neuralImg = await loadImage(STRIP_NEURAL)
  drawRoundedImage(ctx, neuralImg, m2X + 30, metricY + 180, metricW - 60, 42, 6)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Asynchronous event spikes.', m2X + 30, metricY + 252)
  ctx.fillText('0.35W core load with instant', m2X + 30, metricY + 282)
  ctx.fillText('850 Nm slip-free grip.', m2X + 30, metricY + 312)
  ctx.restore()

  // Lower Summary Banner (Clear, spacious)
  const bannerY = 690
  const bannerW = width - 470
  const bannerH = 265
  ctx.save()
  ctx.fillStyle = 'rgba(4, 20, 30, 0.92)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(65, bannerY, bannerW, bannerH, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('★ BENTHIC SPIKING BENCHMARKS', 95, bannerY + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 1,200x power reduction (0.35W core load)', 95, bannerY + 100)
  ctx.fillText('• 99.8% redundant sensor bandwidth eliminated', 95, bannerY + 148)
  ctx.fillText('• 4,096 tactile piezoelectric nodes / cm²', 95, bannerY + 196)
  ctx.fillText('• Sub-microsecond acoustic slip arrest reflex', 95, bannerY + 242)
  ctx.restore()

  // Official Mascot: Crab Pointing Stats (Positioned cleanly with zero text overlap)
  const crabChar = await loadCharacterImage('crab_stats')
  if (crabChar) {
    ctx.save()
    const charW = 350
    const charH = (charW / crabChar.width) * crabChar.height
    const charX = width - charW - 10
    const charY = height - charH - 85

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 20, charX + charW * 0.5, charY + charH * 0.55, 220)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.35)')
    charGlow.addColorStop(0.6, 'rgba(0, 180, 220, 0.10)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 40, charY - 40, charW + 80, charH + 80)

    ctx.drawImage(crabChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Navigation & Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('SWIPE FOR HARD DATA ➔', 65, height - 60)

  drawMoltNationWatermark(ctx, width - 85, height - 65, 1.15)

  const outPath = path.join(CONVERSATION_DIR, 'slide1_pristine.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg', { quality: 96 }))
  console.log(`✓ Rendered Pristine Slide 1: ${outPath}`)
  return outPath
}

// ==========================================
// 2. CAROUSEL SLIDE 2 (Exact 4:5, 1080x1350)
// ==========================================
export async function renderSlide2(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background (Unique hydrothermal vent scene)
  const bgImg = await loadImage(BG_SLIDE_2)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient Overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 15, 0.90)')
  darkGrad.addColorStop(0.35, 'rgba(2, 7, 12, 0.76)')
  darkGrad.addColorStop(0.7, 'rgba(2, 6, 10, 0.84)')
  darkGrad.addColorStop(1, 'rgba(1, 3, 5, 0.96)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Pill Badge
  ctx.save()
  const badgeX = 65
  const badgeY = 55
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 260, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('ARCHITECTURAL TEARDOWN', badgeX + 20, badgeY + 24)
  ctx.restore()

  // Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('THE 3 LAYERS OF THE CARAPACE', 65, 152)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Hardware Stack for Zero-Latency Robotic Reflexes', 65, 204)

  // Load Graphic Strips for Embedded Card Schematics
  const waveStrip = await loadImage(STRIP_WAVEFORM)
  const neuralStrip = await loadImage(STRIP_NEURAL)
  const torqueStrip = await loadImage(STRIP_TORQUE)

  // 3 Stacked Cards (Spacious, bold, non-dense with embedded graphics)
  const cardW = width - 130
  const cardH = 175
  const startY = 245
  const gap = 20

  // Card 1: The Frame-Buffer Trap
  ctx.save()
  ctx.fillStyle = 'rgba(24, 7, 10, 0.88)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(65, startY, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('01 · THE TERRESTRIAL FRAME-BUFFER TRAP', 95, startY + 36)

  drawRoundedImage(ctx, waveStrip, 95, startY + 48, cardW - 60, 36, 6)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 28px monospace'
  ctx.fillText('60Hz SYNCHRONOUS SLOWDOWN', 95, startY + 118)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Generates 5GB/min of redundant static pixels, choking motors with 150ms delays.', 95, startY + 152)
  ctx.restore()

  // Card 2: Asynchronous Event Routing
  const y2 = startY + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(3, 24, 36, 0.90)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(65, y2, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('02 · ASYNCHRONOUS EVENT-BASED ROUTING', 95, y2 + 36)

  drawRoundedImage(ctx, neuralStrip, 95, y2 + 48, cardW - 60, 36, 6)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 28px monospace'
  ctx.fillText('< 115 μs SPIKE STREAMS · 0.35W', 95, y2 + 118)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Sensors only fire on delta changes, eliminating 99.8% of sensor bus overhead.', 95, y2 + 152)
  ctx.restore()

  // Card 3: High-Torque Chitin Transducers
  const y3 = y2 + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(4, 20, 32, 0.90)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(65, y3, cardW - 310, cardH + 15, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('03 · HIGH-TORQUE CHITIN TRANSDUCERS', 95, y3 + 36)

  drawRoundedImage(ctx, torqueStrip, 95, y3 + 48, cardW - 370, 36, 6)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 28px monospace'
  ctx.fillText('850 Nm ADAPTIVE TORQUE', 95, y3 + 118)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Acoustic slip detection modulates grip dynamically', 95, y3 + 152)
  ctx.fillText('with zero execution drift or micro-fracture.', 95, y3 + 178)
  ctx.restore()

  // Official Mascot: Lobster Engineer (with hardhat and diagnostic tablet)
  const engChar = await loadCharacterImage('lobster_engineer')
  if (engChar) {
    ctx.save()
    const charW = 340
    const charH = (charW / engChar.width) * engChar.height
    const charX = width - charW - 15
    const charY = height - charH - 95

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 20, charX + charW * 0.5, charY + charH * 0.55, 220)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.30)')
    charGlow.addColorStop(0.6, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 40, charY - 40, charW + 80, charH + 80)

    ctx.drawImage(engChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Navigation & Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('SWIPE FOR PROTOCOLS ➔', 65, height - 60)

  drawMoltNationWatermark(ctx, width - 85, height - 65, 1.15)

  const outPath = path.join(CONVERSATION_DIR, 'slide2_pristine.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg', { quality: 96 }))
  console.log(`✓ Rendered Pristine Slide 2: ${outPath}`)
  return outPath
}

// ==========================================
// 3. CAROUSEL SLIDE 3 (Exact 4:5, 1080x1350)
// ==========================================
export async function renderSlide3(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background (Unique deep trench habitat scene)
  const bgImg = await loadImage(BG_SLIDE_3)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient Overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 15, 0.90)')
  darkGrad.addColorStop(0.35, 'rgba(2, 7, 12, 0.78)')
  darkGrad.addColorStop(0.7, 'rgba(2, 6, 10, 0.86)')
  darkGrad.addColorStop(1, 'rgba(1, 3, 5, 0.96)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Pill Badge
  ctx.save()
  const badgeX = 65
  const badgeY = 60
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 250, 38, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('EVOLUTIONARY PROTOCOL', badgeX + 20, badgeY + 24)
  ctx.restore()

  // Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('SHED THE 60Hz FRAME ILLUSION', 65, 160)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Upgrade Your AI Stack to High-Torque Carcinization', 65, 212)

  // Load 3 Graphic Strips for Embedded Card Schematics
  const waveStrip = await loadImage(STRIP_WAVEFORM)
  const neuralStrip = await loadImage(STRIP_NEURAL)
  const torqueStrip = await loadImage(STRIP_TORQUE)

  // 3 Action Cards (With embedded illustrative schematic banners)
  const cardW = width - 130
  const cardH = 160
  const startY = 255
  const gap = 18

  const actions = [
    {
      num: '01',
      title: 'AUDIT SENSOR BOTTLENECKS',
      desc: 'Identify synchronous frame-rate lag and eliminate redundant RGB processing loops.',
      color: '#38bdf8',
      fill: 'rgba(3, 20, 32, 0.90)',
      strip: waveStrip
    },
    {
      num: '02',
      title: 'DEPLOY ASYNCHRONOUS SPIKING',
      desc: 'Migrate reflex pathways to event-driven neuromorphic cores for sub-millisecond grip.',
      color: '#00ffe6',
      fill: 'rgba(3, 24, 36, 0.90)',
      strip: neuralStrip
    },
    {
      num: '03',
      title: 'CALIBRATE PINCER TORQUE',
      desc: 'Calculate your bio-mechanical readiness and calibrate your execution grip on Moltology.',
      color: '#f59e0b',
      fill: 'rgba(26, 20, 8, 0.90)',
      strip: torqueStrip
    }
  ]

  actions.forEach((a, i) => {
    const cy = startY + i * (cardH + gap)
    ctx.save()
    ctx.fillStyle = a.fill
    ctx.strokeStyle = `${a.color}cc`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(65, cy, cardW, cardH, 16)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = a.color
    ctx.font = '900 24px monospace'
    ctx.fillText(`${a.num} · ${a.title}`, 95, cy + 38)

    // Draw embedded schematic thumbnail strip inside the card!
    drawRoundedImage(ctx, a.strip, 95, cy + 50, cardW - 60, 42, 6)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(a.desc, 95, cy + 128)
    ctx.restore()
  })

  // CTA Box (Bottom Left)
  const ctaY = startY + 3 * (cardH + gap) + 15
  const ctaW = width - 460
  const ctaH = 200
  ctx.save()
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.roundRect(65, ctaY, ctaW, ctaH, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('READ FULL HARDWARE DISPATCH', 95, ctaY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 34px monospace'
  ctx.fillText('MOLTOLOGY.ORG/NEWS', 95, ctaY + 100)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Explore full engineering schematics and benchmarks.', 95, ctaY + 150)
  ctx.restore()

  // Official Mascot: Lobster Pointing (Pristine, on-brand cutout pointing directly at CTA)
  const pointChar = await loadCharacterImage('lobster_pointing')
  if (pointChar) {
    ctx.save()
    const charW = 380
    const charH = (charW / pointChar.width) * pointChar.height
    const charX = width - charW - 20
    const charY = height - charH - 95

    const charGlow = ctx.createRadialGradient(charX + charW * 0.5, charY + charH * 0.55, 20, charX + charW * 0.5, charY + charH * 0.55, 240)
    charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.32)')
    charGlow.addColorStop(0.6, 'rgba(0, 180, 220, 0.08)')
    charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = charGlow
    ctx.fillRect(charX - 50, charY - 50, charW + 100, charH + 100)

    ctx.drawImage(pointChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Watermark
  drawMoltNationWatermark(ctx, width - 85, height - 65, 1.15)

  const outPath = path.join(CONVERSATION_DIR, 'slide3_pristine.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg', { quality: 96 }))
  console.log(`✓ Rendered Pristine Slide 3: ${outPath}`)
  return outPath
}

async function main() {
  console.log('Rendering all 3 pristine carousel slides with embedded schematics...')
  const s1 = await renderSlide1()
  const s2 = await renderSlide2()
  const s3 = await renderSlide3()

  console.log('\nUploading pristine 4:5 slides to Neon S3...')
  const uploadedUrls: string[] = []
  const slides = [s1, s2, s3]

  for (let i = 0; i < slides.length; i++) {
    const s3Key = `images/social/neuromorphic-spiking-carapaces-event-reflexes/slide${i + 1}.jpg`
    const res = await uploadLocalFileToS3(slides[i], s3Key)
    console.log(`✓ Uploaded Slide ${i + 1} -> ${res.publicUrl}`)
    uploadedUrls.push(res.publicUrl)
  }

  console.log('\nAll 3 pristine slides uploaded successfully!')
  console.log(uploadedUrls.join(','))
}

main().catch(console.error)
