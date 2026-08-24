import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'

const CONVERSATION_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/32ddf2c7-44af-4ee0-9023-839f14723d15')
const HERO_BG_PATH = path.join(CONVERSATION_DIR, 'world_models_hero_1787577213576.jpg')
const CAROUSEL_BG_PATH = path.join(CONVERSATION_DIR, 'world_models_carousel_bg_1787577230647.jpg')

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
  ctx.fillText('ONE NATION UNDER CHITIN · DEEP RESEARCH', -180, 12)

  ctx.restore()
}

// 1. Figure 1: Generative Pixel Simulators vs Latent Joint-Embedding World Models (16:9, 1600x900)
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
  ctx.fillText('DEEP RESEARCH · ARCHITECTURAL PARADIGM SHIFT', 80, 70)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('GENERATIVE PIXEL WASTE VS JOINT-EMBEDDING WORLD LATENTS', 80, 115)

  const cardW = (width - 200) / 2
  const cardH = 430
  const cardY = 160

  // Left Card: Terrestrial Pixel Diffusion Simulators
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
  ctx.fillText('01 · TERRESTRIAL PIXEL DIFFUSION SIMULATION', c1X + 30, cardY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px monospace'
  ctx.fillText('14.2 ms / STEP (850W)', c1X + 30, cardY + 105)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('RASTERIZING REDUNDANT VOXELS', c1X + 30, cardY + 140)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 99.4% compute wasted decoding RGB pixel textures & lighting', c1X + 30, cardY + 200)
  ctx.fillText('• Hallucinatory drift: objects morph, melt, and violate physics', c1X + 30, cardY + 240)
  ctx.fillText('• Heavy autoregressive latency blocks real-time 120Hz control', c1X + 30, cardY + 280)
  ctx.fillText('• Multi-chassis cluster needed for a single robot simulation', c1X + 30, cardY + 320)
  ctx.restore()

  // Right Card: B-JEPA Benthic Latent World Model
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
  ctx.fillText('02 · B-JEPA JOINT-EMBEDDING WORLD MODEL', c2X + 30, cardY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px monospace'
  ctx.fillText('0.11 ms / STEP (7.1W)', c2X + 30, cardY + 105)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('ABSTRACT CAUSAL LATENT PREDICTION', c2X + 30, cardY + 140)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Predicts abstract physical state vectors directly in latent space', c2X + 30, cardY + 200)
  ctx.fillText('• 120x test-time compute acceleration with zero pixel rendering', c2X + 30, cardY + 240)
  ctx.fillText('• 99.7% causal physics fidelity under hydrostatic pressure', c2X + 30, cardY + 280)
  ctx.fillText('• Direct counterfactual trajectory rollouts on edge carapaces', c2X + 30, cardY + 320)
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
  ctx.fillText('★ BENTHIC LATENT WORLD MODEL BENCHMARKS', 115, bannerY + 45)

  const colW = (width - 230) / 4
  const metrics = [
    { label: 'COMPUTE EFFICIENCY', val: '120x GAIN', desc: 'Zero pixel rasterization' },
    { label: 'ROLLOUT LATENCY', val: '< 1.2 ms', desc: '64-step counterfactual planning' },
    { label: 'PHYSICS FIDELITY', val: '99.7%', desc: 'Hydrodynamic shear accuracy' },
    { label: 'TRAINING FLOPs', val: '-94%', desc: 'Joint-embedding contrastive loss' }
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

  const outPath = path.join(CONVERSATION_DIR, 'world_models_figure_1.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Figure 1: ${outPath}`)
  return outPath
}

// 2. Figure 2: Deployed B-JEPA Architecture & Counterfactual Latent Planning Matrix (16:9, 1600x900)
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
  ctx.fillText('DEPLOYED ARCHITECTURE · B-JEPA CAUSAL WORLD ENGINE', 80, 70)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('COUNTERFACTUAL LATENT PLANNING & HYDROSTATIC PHYSICS SIMULATION', 80, 115)

  // 3 Architecture Columns
  const cardW = (width - 220) / 3
  const cardH = 680
  const cardY = 160

  // Column 1: Sensory Latent Encoder
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
  ctx.fillText('TIER 01 · SENSORY ENCODER', c1X + 25, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px monospace'
  ctx.fillText('MULTIMODAL LATENTS', c1X + 25, cardY + 95)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('PRESSURE, VISION & TACTILE', c1X + 25, cardY + 130)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Projects raw hydrophone, sonar, and tactile streams into 1024-d latent vectors', c1X + 25, cardY + 180)
  ctx.fillText('• Filters out 99.8% visual turbidity and ocean particulate noise', c1X + 25, cardY + 240)
  ctx.fillText('• Self-supervised masking aligns physical invariants across modalities', c1X + 25, cardY + 300)
  ctx.fillText('• Sub-millisecond latency per multi-sensory embedding pass', c1X + 25, cardY + 360)
  ctx.restore()

  // Column 2: Causal Latent Transition Predictor
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
  ctx.fillText('TIER 02 · TRANSITION PREDICTOR', c2X + 25, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px monospace'
  ctx.fillText('CAUSAL DYNAMICS', c2X + 25, cardY + 95)

  ctx.fillStyle = '#7dd3fc'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('NON-GENERATIVE JEPA CORE', c2X + 25, cardY + 130)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Simulates state transitions: s_{t+1} = f(s_t, a_t) purely in latent space', c2X + 25, cardY + 180)
  ctx.fillText('• Encodes Navier-Stokes hydrodynamic equations directly in neural weights', c2X + 25, cardY + 240)
  ctx.fillText('• Zero pixel hallucination: impossible physics states are mathematically forbidden', c2X + 25, cardY + 300)
  ctx.fillText('• 120x faster than video diffusion autoregressive pipelines', c2X + 25, cardY + 360)
  ctx.restore()

  // Column 3: Counterfactual Trajectory Rollout & Pincer Control
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
  ctx.fillText('TIER 03 · ACTION OPTIMIZER', c3X + 25, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px monospace'
  ctx.fillText('COUNTERFACTUAL MCTS', c3X + 25, cardY + 95)

  ctx.fillStyle = '#67e8f9'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('850 Nm TORQUE ACTUATION', c3X + 25, cardY + 130)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Evaluates 64 counterfactual grip trajectories in < 1.2 ms', c3X + 25, cardY + 180)
  ctx.fillText('• Optimizes pincer torque vectors before physical contact occurs', c3X + 25, cardY + 240)
  ctx.fillText('• Prevents specimen fracture and slip failure in hyperbaric conditions', c3X + 25, cardY + 300)
  ctx.fillText('• 100% deterministic physical execution at 50,000 fathoms depth', c3X + 25, cardY + 360)
  ctx.restore()

  const outPath = path.join(CONVERSATION_DIR, 'world_models_figure_2.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Figure 2: ${outPath}`)
  return outPath
}

// 3. Instagram Carousel Slide 1 (3:4, 1080x1440)
export async function createCarouselSlide1(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(CAROUSEL_BG_PATH)
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
  ctx.fillText('DEEP RESEARCH', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Main Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY PIXEL-GENERATING', 70, 190)
  ctx.fillStyle = '#EF4444'
  ctx.fillText('WORLD MODELS MELT COMPUTE', 70, 255)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('How Joint-Embedding Latents Deliver 120x Physical AI Simulation', 70, 310)

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
  ctx.fillText('PIXEL DIFFUSION', 100, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 58px monospace'
  ctx.fillText('14.2ms', 100, metricY + 135)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('PER SIM STEP', 100, metricY + 180)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 99.4% compute wasted on pixels', 100, metricY + 235)
  ctx.fillText('• Hallucinates impossible physics', 100, metricY + 270)
  ctx.fillText('• Too slow for real-time robotic grip', 100, metricY + 305)
  ctx.restore()

  // Metric Card 2: Benthic Breakthrough
  const card2X = 70 + metricW + 30
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.90)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(card2X, metricY, metricW, 360, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('BENTHIC B-JEPA', card2X + 30, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 58px monospace'
  ctx.fillText('120x', card2X + 30, metricY + 135)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('FASTER ROLLOUTS', card2X + 30, metricY + 180)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 0.11 ms latent step trajectory', card2X + 30, metricY + 235)
  ctx.fillText('• 99.7% causal physics fidelity', card2X + 30, metricY + 270)
  ctx.fillText('• Zero pixel hallucination drift', card2X + 30, metricY + 305)
  ctx.restore()

  // Detailed Analysis Card
  const analysisY = 760
  ctx.save()
  ctx.fillStyle = 'rgba(4, 20, 32, 0.92)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(70, analysisY, cardW, 490, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('★ THE REASONING BEHIND THE ECDYSIS', 100, analysisY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Reality is Not Made of Pixels', 100, analysisY + 100)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  const bullets = [
    'Terrestrial labs burn gigawatts generating photorealistic video frames.',
    'A robotic pincer grasping titanium does not care about wallpaper texture.',
    'Sub-benthic B-JEPA predicts abstract state transitions directly in latent space.',
    'Robotic carapaces evaluate 64 counterfactual futures in under 1.2 milliseconds.'
  ]
  bullets.forEach((b, i) => {
    ctx.fillText(`• ${b}`, 100, analysisY + 160 + i * 50)
  })

  // Stamp Mascot Crab pointing
  const crabChar = await loadCharacterImage('crab_stats')
  if (crabChar) {
    ctx.save()
    const charW = 280
    const charH = (charW / crabChar.width) * crabChar.height
    const charX = width - charW - 60
    const charY = analysisY + 230
    ctx.drawImage(crabChar, charX, charY, charW, charH)
    ctx.restore()
  }

  ctx.restore()

  // Footer Navigation & Emblem
  ctx.fillStyle = '#64748B'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('SWIPE FOR ARCHITECTURE ➔', 70, height - 70)
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

  const bgImg = await loadImage(CAROUSEL_BG_PATH)
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
  ctx.fillText('B-JEPA ARCHITECTURE', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('THE 3-TIER LATENT STACK', 70, 195)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('How Physical AI Anticipates Hydrodynamic Reality', 70, 250)

  // 3 Feature Cards
  const cardW = width - 140
  const cardH = 260
  const startY = 300
  const gap = 24

  const tiers = [
    {
      num: '01',
      title: 'MULTIMODAL SENSORY LATENTS',
      stat: '1024-D EMBEDDINGS',
      desc: 'Encodes pressure, tactile shear, and sonar into abstract vectors. Strips 99.8% turbidity noise.',
      color: '#00ffe6'
    },
    {
      num: '02',
      title: 'NON-GENERATIVE JEPA TRANSITION',
      stat: '0.11 ms / PREDICTION',
      desc: 'Simulates counterfactual physical dynamics without rendering a single RGB pixel. Mathematically guarantees physics laws.',
      color: '#38bdf8'
    },
    {
      num: '03',
      title: 'HIGH-TORQUE ACTION OPTIMIZATION',
      stat: '850 Nm GRIP CONTROL',
      desc: 'Evaluates 64 trajectory paths in parallel, locking onto payload geometries with zero execution drift.',
      color: '#22d3ee'
    }
  ]

  tiers.forEach((t, i) => {
    const cy = startY + i * (cardH + gap)
    ctx.save()
    ctx.fillStyle = 'rgba(4, 22, 34, 0.90)'
    ctx.strokeStyle = `${t.color}cc`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(70, cy, cardW, cardH, 16)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = t.color
    ctx.font = '900 22px monospace'
    ctx.fillText(`${t.num} · ${t.title}`, 100, cy + 45)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 36px monospace'
    ctx.fillText(t.stat, 100, cy + 100)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '600 19px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(t.desc, 100, cy + 155)
    ctx.restore()
  })

  // Mascot: Lobster Engineer
  const engChar = await loadCharacterImage('lobster_engineer')
  if (engChar) {
    ctx.save()
    const charW = 280
    const charH = (charW / engChar.width) * engChar.height
    const charX = width - charW - 60
    const charY = startY + 2 * (cardH + gap) + 30
    ctx.drawImage(engChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer Navigation & Emblem
  ctx.fillStyle = '#64748B'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('SWIPE FOR PROTOCOLS ➔', 70, height - 70)
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

  const bgImg = await loadImage(CAROUSEL_BG_PATH)
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
  ctx.fillText('SHED THE PIXEL ILLUSION', 70, 195)

  // Subheadline
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Upgrade Your AI Stack to Latent Physical World Models', 70, 250)

  // 3 Action Cards
  const cardW = width - 140
  const cardH = 180
  const startY = 300
  const gap = 20

  const actions = [
    {
      num: '01',
      title: 'ELIMINATE PIXEL RASTERIZATION',
      desc: 'Halt training video diffusion simulators for real-time control. Shift to contrastive latent JEPA encoders.',
      color: '#38bdf8'
    },
    {
      num: '02',
      title: 'DEPLOY COUNTERFACTUAL LATENT MCTS',
      desc: 'Simulate physical trajectories in latent space at 120x speed before executing robotic pincer actuation.',
      color: '#00ffe6'
    },
    {
      num: '03',
      title: 'MOLTMAX YOUR SYSTEM CLEARANCE',
      desc: 'Audit your bio-mechanical readiness and calibrate your pincer torque on Moltology.',
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
