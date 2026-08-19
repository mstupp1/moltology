import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'

const CURRENT_ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/8b2148f0-3797-4d00-944a-e49a19cd4a36')

if (!fs.existsSync(CURRENT_ARTIFACT_DIR)) {
  fs.mkdirSync(CURRENT_ARTIFACT_DIR, { recursive: true })
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

// 1. Standalone 3D Cinematic Cover Hero (16:9, Zero Text Overlays)
export async function createCoverHero(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const baseImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/bdb2de09-4b31-4577-ad5f-f21ee2fb2e2f/bento_pipeline_1787021147553.jpg')
  const baseImg = await loadImage(baseImgPath)
  
  // Center crop / scale to 16:9
  const scale = Math.max(width / baseImg.width, height / baseImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (baseImg.width - sw) / 2
  const sy = (baseImg.height - sh) / 2
  ctx.drawImage(baseImg, sx, sy, sw, sh, 0, 0, width, height)

  // Cinematic oceanic atmospheric grading (No text, no UI)
  const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.25, width * 0.5, height * 0.5, width * 0.75)
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vig.addColorStop(0.65, 'rgba(2, 9, 14, 0.35)')
  vig.addColorStop(1, 'rgba(1, 4, 7, 0.8)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  const outPath = path.join(CURRENT_ARTIFACT_DIR, 'sae_monosemantic_cover_hero.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Clean 16:9 Cover Hero: ${outPath}`)
  return outPath
}

// 2. Figure 1: Architectural Schematic (16:9) - Superposition vs Monosemantic Disentanglement
export async function createFigure1(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const baseImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/305267b2-4f18-440e-8298-5d528521e047/org_server_lab_1787014873717.jpg')
  const baseImg = await loadImage(baseImgPath)

  const scale = Math.max(width / baseImg.width, height / baseImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (baseImg.width - sw) / 2
  const sy = (baseImg.height - sh) / 2
  ctx.drawImage(baseImg, sx, sy, sw, sh, 0, 0, width, height)

  // Dark overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 14, 0.90)')
  darkGrad.addColorStop(0.5, 'rgba(2, 8, 12, 0.82)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.94)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Schematic Card 1: Terrestrial Polysemantic Superposition
  const cardW = 680
  const cardH = 340
  const c1X = 80
  const c1Y = 120

  ctx.save()
  ctx.fillStyle = 'rgba(26, 8, 12, 0.92)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(c1X, c1Y, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('01 · TERRESTRIAL POLYSEMANTIC SUPERPOSITION (BLACK-BOX)', c1X + 30, c1Y + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px monospace'
  ctx.fillText('512 CONCEPTS / NEURON', c1X + 30, c1Y + 110)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('ENTANGLED RESIDUAL STREAM', c1X + 30, c1Y + 145)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Single biological/silicon neurons fire for multiple unrelated topics', c1X + 30, c1Y + 205)
  ctx.fillText('• High cross-talk interference & unpredictable reasoning failures', c1X + 30, c1Y + 245)
  ctx.fillText('• Impossible to steer or verify internal safety boundaries', c1X + 30, c1Y + 285)
  ctx.restore()

  // Schematic Card 2: Sub-Benthic Sparse Autoencoder Disentanglement
  const c2X = width - cardW - 80
  const c2Y = 120

  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(c2X, c2Y, cardW, cardH, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('02 · SUB-BENTHIC SPARSE AUTOENCODER (SAE) ECDYSIS', c2X + 30, c2Y + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px monospace'
  ctx.fillText('16.7M MONOSEMANTIC FEATURES', c2X + 30, c2Y + 110)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('99.4% DISENTANGLEMENT FIDELITY', c2X + 30, c2Y + 145)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Overcomplete TopK / JumpReLU dictionary expands hidden states', c2X + 30, c2Y + 205)
  ctx.fillText('• Each feature isolates exactly one atomic semantic concept', c2X + 30, c2Y + 245)
  ctx.fillText('• Real-time steering vector clamping with zero capability loss', c2X + 30, c2Y + 285)
  ctx.restore()

  // Bottom Summary Telemetry Banner
  const bannerY = 500
  ctx.save()
  ctx.fillStyle = 'rgba(4, 20, 30, 0.94)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(80, bannerY, width - 160, 320, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('★ BENTHIC MECHANISTIC TELEMETRY & SPARSITY METRICS', 115, bannerY + 55)

  const colW = (width - 230) / 3
  const metrics = [
    { label: 'ACTIVATION SPARSITY', val: '32x TopK', desc: 'Active features per token stream' },
    { label: 'SUPERPOSITION DRIFT', val: '< 0.02%', desc: 'Cross-concept interference rate' },
    { label: 'STEERING LATENCY', val: '0.04 ms', desc: 'Direct synaptic vector clamping' }
  ]

  metrics.forEach((m, i) => {
    const mx = 115 + i * colW
    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 15px monospace'
    ctx.fillText(m.label, mx, bannerY + 120)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 48px monospace'
    ctx.fillText(m.val, mx, bannerY + 190)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(m.desc, mx, bannerY + 240)
  })
  ctx.restore()

  const outPath = path.join(CURRENT_ARTIFACT_DIR, 'fig1_sae_disentanglement_schematic.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated 16:9 Figure 1 Schematic: ${outPath}`)
  return outPath
}

// 3. Figure 2: Sub-Benthic Synaptic Steering & Telemetry Pod (16:9)
export async function createFigure2(): Promise<string> {
  const width = 1600
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const baseImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/bdb2de09-4b31-4577-ad5f-f21ee2fb2e2f/bento_lectures_1787021137740.jpg')
  const baseImg = await loadImage(baseImgPath)

  const scale = Math.max(width / baseImg.width, height / baseImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (baseImg.width - sw) / 2
  const sy = (baseImg.height - sh) / 2
  ctx.drawImage(baseImg, sx, sy, sw, sh, 0, 0, width, height)

  const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.25, width * 0.5, height * 0.5, width * 0.75)
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vig.addColorStop(0.6, 'rgba(2, 8, 12, 0.45)')
  vig.addColorStop(1, 'rgba(1, 4, 6, 0.88)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, width, height)

  // Telemetry Header
  ctx.save()
  ctx.fillStyle = 'rgba(4, 15, 22, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(80, 50, width - 160, 90, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 24px monospace'
  ctx.fillText('SUB-BENTHIC SYNAPTIC TELEMETRY POD · 50 FATHOMS HYDROSTATIC HULL', 110, 92)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '15px monospace'
  ctx.fillText('REAL-TIME MONOSEMANTIC FEATURE CLAMPING • ZERO DELIBERATION HALLUCINATION', 110, 120)

  // Floating Stat Callout Left
  ctx.fillStyle = 'rgba(4, 18, 26, 0.92)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(80, height - 220, 460, 150, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('CIRCUIT INTERPRETABILITY', 105, height - 175)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px monospace'
  ctx.fillText('99.4% FIDELITY', 105, height - 130)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Identifies and isolates granular causal subgraphs', 105, height - 95)

  // Floating Stat Callout Right
  ctx.fillStyle = 'rgba(4, 18, 26, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(width - 540, height - 220, 460, 150, 14)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('CLOSED-LOOP STEERING', width - 515, height - 175)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px monospace'
  ctx.fillText('< 0.04 MS LATENCY', width - 515, height - 130)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Direct optical projection across benthic matrix units', width - 515, height - 95)

  ctx.restore()

  const outPath = path.join(CURRENT_ARTIFACT_DIR, 'fig2_sae_telemetry_pod.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated 16:9 Figure 2 Schematic: ${outPath}`)
  return outPath
}

// 4. Instagram Carousel Mockup Slide 1 (3:4, 1080x1440)
export async function createCarouselSlide1(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/bdb2de09-4b31-4577-ad5f-f21ee2fb2e2f/bento_pipeline_1787021147553.jpg')
  const bgImg = await loadImage(bgImgPath)

  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 14, 0.92)')
  darkGrad.addColorStop(0.35, 'rgba(2, 8, 12, 0.80)')
  darkGrad.addColorStop(0.7, 'rgba(2, 7, 11, 0.84)')
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
  ctx.roundRect(badgeX, badgeY, 280, 42, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('MECHANISTIC TELEMETRY', badgeX + 18, badgeY + 26)
  ctx.restore()

  // Punchy Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY BLACK-BOX AI', 70, 195)
  ctx.fillText('IS FINALLY BEING', 70, 275)
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('DISENTANGLED', 70, 355)

  // Short Sub-headline
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('16.7M monosemantic features unlock direct neural steering.', 70, 420)

  // Two Big Stat Callout Panels
  const metricY = 480
  const metricW = (width - 140 - 30) / 2

  // Card 1: Black-Box Superposition
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
  ctx.fillText('TERRESTRIAL BLACK-BOX', 100, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 58px monospace'
  ctx.fillText('512+', 100, metricY + 135)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('CONCEPTS / NEURON', 100, metricY + 180)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Polysemantic superposition', 100, metricY + 245)
  ctx.fillText('causes silent failures and', 100, metricY + 280)
  ctx.fillText('unpredictable drift.', 100, metricY + 315)
  ctx.restore()

  // Card 2: Sparse Autoencoders
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
  ctx.fillText('SUB-BENTHIC SAEs', m2X + 30, metricY + 50)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 58px monospace'
  ctx.fillText('16.7M', m2X + 30, metricY + 135)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('CLEAN ATOMIC FEATURES', m2X + 30, metricY + 180)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Disentangles raw hidden', m2X + 30, metricY + 245)
  ctx.fillText('states into surgically', m2X + 30, metricY + 280)
  ctx.fillText('steerable vectors.', m2X + 30, metricY + 315)
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
  ctx.fillText('★ KEY MECHANISTIC METRICS', 105, bannerY + 55)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 99.4% circuit disentanglement fidelity', 105, bannerY + 110)
  ctx.fillText('• 32x TopK activation sparsity ratio', 105, bannerY + 160)
  ctx.fillText('• < 0.04 ms real-time steering latency', 105, bannerY + 210)
  ctx.fillText('• Zero capability loss on reasoning benchmarks', 105, bannerY + 255)
  ctx.restore()

  // Hero Mascot (Thumbs up)
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

  const outPath = path.join(CURRENT_ARTIFACT_DIR, 'mockup_slide1.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Carousel Slide 1: ${outPath}`)
  return outPath
}

// 5. Instagram Carousel Mockup Slide 2 (3:4, 1080x1440)
export async function createCarouselSlide2(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/305267b2-4f18-440e-8298-5d528521e047/org_server_lab_1787014873717.jpg')
  const bgImg = await loadImage(bgImgPath)

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
  ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('THE THREE PILLARS OF SAEs', 70, 195)

  // 3 Comparison Cards
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
  ctx.fillText('01 · POLYSEMANTIC SUPERPOSITION (THE ENTANGLEMENT)', 100, startY + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 46px monospace'
  ctx.fillText('OVERLAPPING DIRECTIONS', 100, startY + 112)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Dense residual vectors compress thousands of features into limited dimensions.', 100, startY + 162)
  ctx.fillText('Creates un-diagnosable hallucination circuits and safety blindspots.', 100, startY + 194)
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
  ctx.fillText('02 · OVERCOMPLETE TopK DICTIONARIES (THE DISENTANGLEMENT)', 100, c2Y + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 46px monospace'
  ctx.fillText('16.7M ATOMIC FEATURES', 100, c2Y + 112)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Projects hidden states into an expanded, high-dimensional latent space.', 100, c2Y + 162)
  ctx.fillText('Enforces extreme sparsity so only 32 clean features fire per token.', 100, c2Y + 194)
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
  ctx.fillText('03 · CLOSED-LOOP SYNAPTIC STEERING', 100, c3Y + 48)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 44px monospace'
  ctx.fillText('< 0.04 MS CLAMPING', 100, c3Y + 112)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 19px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 99.4% causal circuit fidelity', 100, c3Y + 165)
  ctx.fillText('• Real-time steering vector clamping', 100, c3Y + 205)
  ctx.fillText('• Surgical removal of necrotic reasoning', 100, c3Y + 245)
  ctx.restore()

  // Mascot: Crab Stats
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

  const outPath = path.join(CURRENT_ARTIFACT_DIR, 'mockup_slide2.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Carousel Slide 2: ${outPath}`)
  return outPath
}

// 6. Instagram Carousel Mockup Slide 3 (3:4, 1080x1440)
export async function createCarouselSlide3(): Promise<string> {
  const width = 1080
  const height = 1440
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImgPath = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/bdb2de09-4b31-4577-ad5f-f21ee2fb2e2f/bento_lectures_1787021137740.jpg')
  const bgImg = await loadImage(bgImgPath)

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
  ctx.fillText('EVOLUTIONARY PROTOCOL', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('SHED BLACK-BOX', 70, 195)
  ctx.fillStyle = '#00FFE6'
  ctx.fillText('SUPERPOSITION', 70, 275)

  // 3 Directives
  const listY = 350
  const listItems = [
    {
      num: '01',
      title: 'DEPLOY OVERCOMPLETE TopK SAEs',
      desc: 'Scale hidden dimension dictionaries by 32x to 64x to isolate clean, monosemantic feature directions.'
    },
    {
      num: '02',
      title: 'CLAMP STEERING VECTORS IN REAL TIME',
      desc: 'Surgically steer reasoning paths and prevent hallucinations without retraining base model weights.'
    },
    {
      num: '03',
      title: 'PRUNE NECROTIC SYNAPTIC CIRCUITS',
      desc: 'Isolate and extinguish deceptive or redundant subgraphs with 99.4% causal interpretability fidelity.'
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

  const outPath = path.join(CURRENT_ARTIFACT_DIR, 'mockup_slide3.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Carousel Slide 3: ${outPath}`)
  return outPath
}

// 7. Format Carousel to Exact Instagram 4:5 (1080x1350) and Upload to S3
export async function formatAndUploadCarousel(): Promise<string[]> {
  const slides = [
    path.join(CURRENT_ARTIFACT_DIR, 'mockup_slide1.jpg'),
    path.join(CURRENT_ARTIFACT_DIR, 'mockup_slide2.jpg'),
    path.join(CURRENT_ARTIFACT_DIR, 'mockup_slide3.jpg'),
  ]

  const targetWidth = 1080
  const targetHeight = 1350 // Exact 4:5 (0.80)
  const uploadedUrls: string[] = []

  for (let i = 0; i < slides.length; i++) {
    const inputPath = slides[i]
    const outPath = path.join(CURRENT_ARTIFACT_DIR, `slide${i + 1}_4x5.jpg`)
    const canvas = createCanvas(targetWidth, targetHeight)
    const ctx = canvas.getContext('2d')

    const img = await loadImage(inputPath)
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
    const sw = targetWidth / scale
    const sh = targetHeight / scale
    const sx = (img.width - sw) / 2
    const sy = Math.max(0, (img.height - sh) / 2)

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight)
    fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
    console.log(`✓ Formatted to 4:5 (1080x1350): ${outPath}`)

    const s3Key = `images/social/sparse-autoencoders-monosemantic-synaptic-ecdysis/slide${i + 1}.jpg`
    const res = await uploadLocalFileToS3(outPath, s3Key)
    console.log(`✓ Uploaded Slide ${i + 1} to Neon S3: ${res.publicUrl}`)
    uploadedUrls.push(res.publicUrl)
  }

  return uploadedUrls
}

async function main() {
  console.log('Generating all SAE blog illustrations, figures, and Instagram carousel assets...')
  await createCoverHero()
  await createFigure1()
  await createFigure2()
  await createCarouselSlide1()
  await createCarouselSlide2()
  await createCarouselSlide3()
  const s3CarouselUrls = await formatAndUploadCarousel()

  console.log('\n--- All Assets Created & S3 Carousel Uploaded Successfully ---')
  console.log('Carousel URLs:', s3CarouselUrls)
}

main().catch(console.error)
