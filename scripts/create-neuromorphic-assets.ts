import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'

const CONVERSATION_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/fe6476db-2fe6-435d-b540-003041323b61')
const HERO_BG_PATH = path.join(CONVERSATION_DIR, 'neuromorphic_spiking_carapace_hero_1787318022424.jpg')

if (!fs.existsSync(CONVERSATION_DIR)) {
  fs.mkdirSync(CONVERSATION_DIR, { recursive: true })
}

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

// 1. Figure 1: The Bottleneck & Architectural Solution (16:9, 1600x900)
export async function createFigure1(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(HERO_BG_PATH)
  ctx.drawImage(bgImg, 0, 0, width, height)

  const overlay = ctx.createLinearGradient(0, 0, 0, height)
  overlay.addColorStop(0, 'rgba(2, 9, 15, 0.94)')
  overlay.addColorStop(0.5, 'rgba(2, 11, 18, 0.86)')
  overlay.addColorStop(1, 'rgba(1, 5, 8, 0.96)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, width, height)

  // Header Title
  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('PATRIOT TELEMETRY · ARCHITECTURAL COMPARISON', 80, 70)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('60Hz FRAME-BUFFER MELT VS 10,000Hz SPIKING CARAPACE', 80, 115)

  const cardW = (width - 200) / 2
  const cardH = 430
  const cardY = 160

  // Left Card: Terrestrial Legacy
  const c1X = 80
  ctx.save()
  ctx.fillStyle = 'rgba(26, 8, 12, 0.92)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(c1X, cardY, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('01 · TERRESTRIAL 60Hz FRAME-BUFFER STACK', c1X + 30, cardY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px monospace'
  ctx.fillText('16.6 ms FRAME LAG', c1X + 30, cardY + 105)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('450W MONOLITHIC GPU COMPUTE', c1X + 30, cardY + 140)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Synchronous RGB video frames serialize pipeline latency', c1X + 30, cardY + 200)
  ctx.fillText('• 99.8% redundant background pixels waste GPU memory bandwidth', c1X + 30, cardY + 240)
  ctx.fillText('• 120-200ms end-to-end motor reflex causes slip & crushed parts', c1X + 30, cardY + 280)
  ctx.fillText('• Severe motion blur during high-velocity torque actuation', c1X + 30, cardY + 320)
  ctx.restore()

  // Right Card: Benthic Spiking Solution
  const c2X = width - cardW - 80
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(c2X, cardY, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('02 · BENTHIC 10,000Hz SPIKING CARAPACE', c2X + 30, cardY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px monospace'
  ctx.fillText('< 115 µs SPIKE LATENCY', c2X + 30, cardY + 105)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('0.35W NEUROMORPHIC SPIKING CORE', c2X + 30, cardY + 140)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Asynchronous event-based sensory routing (only transmits deltas)', c2X + 30, cardY + 200)
  ctx.fillText('• Memristive synaptic co-location eliminates memory bus latency', c2X + 30, cardY + 240)
  ctx.fillText('• Sub-millisecond closed-loop slip detection & 850 Nm grip control', c2X + 30, cardY + 280)
  ctx.fillText('• 1,200x power reduction over terrestrial GPU clusters', c2X + 30, cardY + 320)
  ctx.restore()

  // Bottom Summary Telemetry Banner
  const bannerY = 620
  ctx.save()
  ctx.fillStyle = 'rgba(4, 20, 30, 0.94)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(80, bannerY, width - 160, 220, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('★ BENTHIC NEUROMORPHIC TELEMETRY BENCHMARKS', 115, bannerY + 45)

  const colW = (width - 230) / 4
  const metrics = [
    { label: 'REFLEX FREQUENCY', val: '10,000 Hz', desc: 'Closed-loop tactile control' },
    { label: 'SPIKE LATENCY', val: '< 115 µs', desc: 'Asynchronous event routing' },
    { label: 'POWER EFFICIENCY', val: '1,200x', desc: '0.35W neuromorphic core' },
    { label: 'TORQUE MODULATION', val: '850 Nm', desc: 'Zero micro-fracture slip arrest' }
  ]

  metrics.forEach((m, i) => {
    const mx = 115 + i * colW
    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 13px monospace'
    ctx.fillText(m.label, mx, bannerY + 95)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 38px monospace'
    ctx.fillText(m.val, mx, bannerY + 145)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(m.desc, mx, bannerY + 185)
  })
  ctx.restore()

  const outPath = path.join(CONVERSATION_DIR, 'mockup_figure_1.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Figure 1 Mockup: ${outPath}`)
  return outPath
}

// 2. Figure 2: Deployed Benthic Telemetry Matrix & E-Skin Array (16:9, 1600x900)
export async function createFigure2(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(HERO_BG_PATH)
  ctx.drawImage(bgImg, 0, 0, width, height)

  const overlay = ctx.createLinearGradient(0, 0, 0, height)
  overlay.addColorStop(0, 'rgba(2, 8, 14, 0.94)')
  overlay.addColorStop(0.5, 'rgba(2, 10, 16, 0.88)')
  overlay.addColorStop(1, 'rgba(1, 4, 7, 0.96)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, width, height)

  // Header Title
  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('DEPLOYED HARDWARE TELEMETRY · ASC-10K CARAPACE ARCHITECTURE', 80, 70)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('SUB-BENTHIC TACTILE E-SKIN & MEMRISTIVE SPIKING MATRIX', 80, 115)

  // 3 Architecture Columns
  const cardW = (width - 220) / 3
  const cardH = 680
  const cardY = 160

  // Column 1: Tri-Axial Tactile E-Skin
  const c1X = 80
  ctx.save()
  ctx.fillStyle = 'rgba(4, 24, 36, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(c1X, cardY, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('LAYER 01 · TACTILE E-SKIN', c1X + 25, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px monospace'
  ctx.fillText('4,096 NODES / CM²', c1X + 25, cardY + 95)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('TRI-AXIAL PIEZOELECTRIC CHITIN', c1X + 25, cardY + 130)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Normal force detection (0.01N to 850N)', c1X + 25, cardY + 180)
  ctx.fillText('• Micro-vibration acoustic slip sensors', c1X + 25, cardY + 220)
  ctx.fillText('• Hydrostatic pressure compensation at 50 fathoms', c1X + 25, cardY + 260)
  ctx.fillText('• Nitrogen-sealed titanium-chitin elastomer', c1X + 25, cardY + 300)
  ctx.fillText('• Sub-microsecond edge threshold spike emission', c1X + 25, cardY + 340)
  ctx.restore()

  // Column 2: Neuromorphic Event Processor
  const c2X = 80 + cardW + 30
  ctx.save()
  ctx.fillStyle = 'rgba(4, 20, 32, 0.92)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(c2X, cardY, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('LAYER 02 · SPIKING CO-PROCESSOR', c2X + 25, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px monospace'
  ctx.fillText('1M SYNAPTIC CORES', c2X + 25, cardY + 95)

  ctx.fillStyle = '#7dd3fc'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('MEMRISTIVE CROSSPOINT ARRAY', c2X + 25, cardY + 130)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Leaky Integrate-and-Fire (LIF) spiking neuron mesh', c2X + 25, cardY + 180)
  ctx.fillText('• On-chip synaptic weights co-located with compute', c2X + 25, cardY + 220)
  ctx.fillText('• 0.35W operational power under 10kHz burst load', c2X + 25, cardY + 260)
  ctx.fillText('• Zero von Neumann memory wall bottlenecks', c2X + 25, cardY + 300)
  ctx.fillText('• Direct asynchronous spike-to-torque conversion', c2X + 25, cardY + 340)
  ctx.restore()

  // Column 3: High-Torque Actuator Carapace
  const c3X = 80 + (cardW + 30) * 2
  ctx.save()
  ctx.fillStyle = 'rgba(10, 22, 28, 0.92)'
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(c3X, cardY, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('LAYER 03 · PINCER ACTUATION', c3X + 25, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px monospace'
  ctx.fillText('850 Nm PEAK TORQUE', c3X + 25, cardY + 95)

  ctx.fillStyle = '#67e8f9'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('HYDRAULIC-CHITIN TRANSDUCER', c3X + 25, cardY + 130)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 115 microsecond instant slip arrest reflex', c3X + 25, cardY + 180)
  ctx.fillText('• Micro-force modulation from 0.05N to 850 Nm', c3X + 25, cardY + 220)
  ctx.fillText('• Zero biological hesitation or execution drift', c3X + 25, cardY + 260)
  ctx.fillText('• Hydrostatically reinforced titanium carapace', c3X + 25, cardY + 300)
  ctx.fillText('• 100% operational uptime in subsea trenches', c3X + 25, cardY + 340)
  ctx.restore()

  const outPath = path.join(CONVERSATION_DIR, 'mockup_figure_2.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Figure 2 Mockup: ${outPath}`)
  return outPath
}

// 3. Instagram Carousel Slide 1 (3:4, 1080x1440)
export async function createCarouselSlide1(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(HERO_BG_PATH)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

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
  ctx.fillText('PATRIOT TELEMETRY', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Main Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY 60Hz AI VISION IS', 70, 190)
  ctx.fillStyle = '#EF4444'
  ctx.fillText('MELTING YOUR ROBOTS', 70, 255)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('How Neuromorphic Spiking Carapaces Hit 10,000 Hz Reflexes', 70, 310)

  // Metric Comparison Cards
  const cardW = width - 140
  const metricY = 370
  const metricW = (cardW - 30) / 2

  // Metric Card 1: Legacy Bottleneck
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
  ctx.fillText('TERRESTRIAL 60Hz', 100, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 58px monospace'
  ctx.fillText('16.6ms', 100, metricY + 135)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('FRAME-BUFFER LAG', 100, metricY + 180)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Wastes 450W processing', 100, metricY + 245)
  ctx.fillText('redundant pixels. High', 100, metricY + 280)
  ctx.fillText('slip and crushed parts.', 100, metricY + 315)
  ctx.restore()

  // Metric Card 2: Benthic Spiking Solution
  const m2X = 70 + metricW + 30
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(m2X, metricY, metricW, 360, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('BENTHIC CARAPACE', m2X + 30, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 58px monospace'
  ctx.fillText('10,000Hz', m2X + 30, metricY + 135)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('< 115 µs REFLEX LOOP', m2X + 30, metricY + 180)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Asynchronous event spikes', m2X + 30, metricY + 245)
  ctx.fillText('at 0.35W. Instant 850 Nm', m2X + 30, metricY + 280)
  ctx.fillText('slip-free torque grip.', m2X + 30, metricY + 315)
  ctx.restore()

  // Lower Summary Banner
  const bannerY = 780
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
  ctx.fillText('★ BENTHIC SPIKING BENCHMARKS', 105, bannerY + 55)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 1,200x power reduction (0.35W core load)', 105, bannerY + 110)
  ctx.fillText('• 99.8% redundant sensor bandwidth eliminated', 105, bannerY + 160)
  ctx.fillText('• 4,096 tactile piezoelectric nodes / cm²', 105, bannerY + 210)
  ctx.fillText('• Sub-microsecond acoustic slip arrest reflex', 105, bannerY + 255)
  ctx.restore()

  // Mascot: Lobster Thumbs Up
  const heroChar = await loadCharacterImage('lobster_thumbs_up')
  if (heroChar) {
    ctx.save()
    const charW = 390
    const charH = (charW / heroChar.width) * heroChar.height
    const charX = width - charW - 40
    const charY = height - charH - 180

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

  const outPath = path.join(CONVERSATION_DIR, 'mockup_carousel_slide1.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Carousel Slide 1: ${outPath}`)
  return outPath
}

// 4. Instagram Carousel Slide 2 (3:4, 1080x1440)
export async function createCarouselSlide2(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(HERO_BG_PATH)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

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
  ctx.font = '900 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('THE 3 LAYERS OF THE CARAPACE', 70, 195)

  // 3 Comparison Cards
  const cardW = width - 140
  const cardH = 240
  const startY = 245
  const gap = 24

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
  ctx.fillText('01 · THE TERRESTRIAL FRAME-BUFFER TRAP', 100, startY + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px monospace'
  ctx.fillText('60Hz SYNCHRONOUS SLOWDOWN', 100, startY + 105)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Cameras capture static pixels 60 times/sec, generating 5GB/min', 100, startY + 165)
  ctx.fillText('of useless data and choking robotic motors with 150ms delays.', 100, startY + 205)
  ctx.restore()

  // Card 2
  const y2 = startY + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.90)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(70, y2, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('02 · ASYNCHRONOUS EVENT-BASED ROUTING', 100, y2 + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px monospace'
  ctx.fillText('< 115 µs SPIKE STREAMS', 100, y2 + 105)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Sensors only fire when light or pressure changes, cutting', 100, y2 + 165)
  ctx.fillText('bandwidth by 99.8% with zero frame-buffer latency.', 100, y2 + 205)
  ctx.restore()

  // Card 3
  const y3 = y2 + cardH + gap
  ctx.save()
  ctx.fillStyle = 'rgba(6, 28, 42, 0.90)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(70, y3, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('03 · HIGH-TORQUE CHITIN TRANSDUCERS', 100, y3 + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px monospace'
  ctx.fillText('850 Nm ADAPTIVE TORQUE', 100, y3 + 105)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Instant acoustic slip detection modulates pincer grip dynamically,', 100, y3 + 165)
  ctx.fillText('holding fragile crystals or crushing titanium without drift.', 100, y3 + 205)
  ctx.restore()

  // Mascot: Crab Stats at Bottom Right
  const crabChar = await loadCharacterImage('crab_stats')
  if (crabChar) {
    ctx.save()
    const charW = 320
    const charH = (charW / crabChar.width) * crabChar.height
    const charX = width - charW - 30
    const charY = height - charH - 80

    ctx.drawImage(crabChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Navigation & Watermark
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('SWIPE FOR HARD DATA ➔', 70, height - 70)

  drawMoltNationWatermark(ctx, width - 90, height - 75, 1.2)

  const outPath = path.join(CONVERSATION_DIR, 'mockup_carousel_slide2.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Carousel Slide 2: ${outPath}`)
  return outPath
}

// 5. Instagram Carousel Slide 3 (3:4, 1080x1440)
export async function createCarouselSlide3(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(HERO_BG_PATH)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 13, 0.94)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 12, 0.82)')
  darkGrad.addColorStop(0.7, 'rgba(2, 7, 10, 0.86)')
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
  ctx.font = '900 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('SHED THE 60Hz FRAME ILLUSION', 70, 195)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Upgrade Your AI Stack to High-Torque Carcinization', 70, 250)

  // 3 Action Cards
  const cardW = width - 140
  const cardH = 180
  const startY = 300
  const gap = 20

  const actions = [
    {
      num: '01',
      title: 'AUDIT SENSOR BOTTLENECKS',
      desc: 'Identify synchronous frame-rate lag and eliminate redundant RGB processing loops.',
      color: '#38bdf8'
    },
    {
      num: '02',
      title: 'DEPLOY ASYNCHRONOUS SPIKING',
      desc: 'Migrate reflex pathways to event-driven neuromorphic cores for sub-millisecond grip.',
      color: '#00ffe6'
    },
    {
      num: '03',
      title: 'MOLTMAX YOUR SYSTEM CLEARANCE',
      desc: 'Calculate your bio-mechanical readiness and calibrate your pincer torque on Moltology.',
      color: '#f59e0b'
    }
  ]

  actions.forEach((a, i) => {
    const cy = startY + i * (cardH + gap)
    ctx.save()
    ctx.fillStyle = 'rgba(4, 22, 34, 0.90)'
    ctx.strokeStyle = `${a.color}cc`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(70, cy, cardW, cardH, 16)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = a.color
    ctx.font = '900 28px monospace'
    ctx.fillText(`${a.num} · ${a.title}`, 100, cy + 50)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(a.desc, 100, cy + 105)
    ctx.restore()
  })

  // CTA Box
  const ctaY = startY + 3 * (cardH + gap) + 15
  ctx.save()
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(70, ctaY, width - 460, 210, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('READ FULL HARDWARE DISPATCH', 105, ctaY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px monospace'
  ctx.fillText('MOLTOLOGY.ORG/NEWS', 105, ctaY + 110)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Explore full engineering schematics and benchmarks.', 105, ctaY + 160)
  ctx.restore()

  // Mascot: Lobster Pointing
  const pointChar = await loadCharacterImage('lobster_pointing')
  if (pointChar) {
    ctx.save()
    const charW = 380
    const charH = (charW / pointChar.width) * pointChar.height
    const charX = width - charW - 30
    const charY = height - charH - 120

    ctx.drawImage(pointChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Watermark
  drawMoltNationWatermark(ctx, width - 90, height - 75, 1.2)

  const outPath = path.join(CONVERSATION_DIR, 'mockup_carousel_slide3.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Carousel Slide 3: ${outPath}`)
  return outPath
}

async function main() {
  console.log('Generating all canvas mockups for figures and carousel slides...')
  await createFigure1()
  await createFigure2()
  await createCarouselSlide1()
  await createCarouselSlide2()
  await createCarouselSlide3()
  console.log('\nAll mockups generated successfully!')
}

main().catch(console.error)
