import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadCharacterImage } from './lib/character-overlay'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'

const ARTIFACT_DIR = path.resolve('/Users/mylesstupp/.gemini/antigravity/brain/d6ed3fc8-a266-4779-8062-3e90baf6d9d9')
const BG_SLIDE1 = path.join(ARTIFACT_DIR, 'world_models_bg_slide1_1787585093619.jpg')
const BG_SLIDE2 = path.join(ARTIFACT_DIR, 'world_models_bg_slide2_1787585107633.jpg')
const BG_SLIDE3 = path.join(ARTIFACT_DIR, 'world_models_bg_slide3_comfy.jpg')

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

export async function renderSlide1(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(BG_SLIDE1)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient overlay
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 6, 10, 0.90)')
  darkGrad.addColorStop(0.3, 'rgba(2, 6, 10, 0.70)')
  darkGrad.addColorStop(0.65, 'rgba(2, 6, 10, 0.80)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 6, 0.96)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Category Pill Badge
  ctx.save()
  const badgeX = 64
  const badgeY = 64
  ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 260, 42, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('01 · THE PIXEL WALL', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Main Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHY PIXEL-GENERATING', 64, 185)
  ctx.fillStyle = '#EF4444'
  ctx.fillText('WORLD MODELS FAIL', 64, 245)

  // Subtitle
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('The Fatal Flaw of Simulating Reality in Video Diffusion', 64, 295)

  // Comparison Cards
  const cardW = width - 128
  const cardY = 345
  const colW = (cardW - 24) / 2

  // Legacy Card
  ctx.save()
  ctx.fillStyle = 'rgba(26, 8, 12, 0.92)'
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(64, cardY, colW, 400, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('TERRESTRIAL VIDEO DIFFUSION', 88, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 48px monospace'
  ctx.fillText('14.2 ms', 88, cardY + 115)

  ctx.fillStyle = '#f87171'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('850W CLUSTER LOAD', 88, cardY + 155)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 99.4% compute wasted on pixels', 88, cardY + 225)
  ctx.fillText('• Hallucinates impossible physics', 88, cardY + 275)
  ctx.fillText('• Severe frame lag blocks control', 88, cardY + 325)
  ctx.restore()

  // Benthic Solution Card
  const col2X = 64 + colW + 24
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(col2X, cardY, colW, 400, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('B-JEPA LATENT PREDICTION', col2X + 24, cardY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 48px monospace'
  ctx.fillText('0.11 ms', col2X + 24, cardY + 115)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('7.1W EDGE CARAPACE', col2X + 24, cardY + 155)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• 120x compute acceleration', col2X + 24, cardY + 225)
  ctx.fillText('• 99.7% causal physics fidelity', col2X + 24, cardY + 275)
  ctx.fillText('• Zero pixel hallucination drift', col2X + 24, cardY + 325)
  ctx.restore()

  // Bottom Takeaway Box
  const bottomY = cardY + 425
  ctx.save()
  ctx.fillStyle = 'rgba(4, 20, 30, 0.92)'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(64, bottomY, cardW, 260, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 16px monospace'
  ctx.fillText('★ CORE INSIGHT', 94, bottomY + 45)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Reality is Physics, Not Wallpaper.', 94, bottomY + 95)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('A robotic pincer grasping titanium does not care about lighting', 94, bottomY + 155)
  ctx.fillText('textures. Sub-benthic world models predict pure causal latents.', 94, bottomY + 195)
  ctx.restore()

  // Footer
  ctx.fillStyle = '#64748B'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('SWIPE FOR THE ARCHITECTURE ➔', 64, height - 55)
  drawMoltNationWatermark(ctx, width - 90, height - 60, 1.15)

  const outPath = path.join(ARTIFACT_DIR, 'pristine_story_slide1.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Pristine Slide 1: ${outPath}`)
  return outPath
}

export async function renderSlide2(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(BG_SLIDE2)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Atmospheric gradient
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 8, 14, 0.94)')
  darkGrad.addColorStop(0.3, 'rgba(2, 8, 14, 0.72)')
  darkGrad.addColorStop(0.65, 'rgba(2, 8, 14, 0.80)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 7, 0.97)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Category Pill Badge
  ctx.save()
  const badgeX = 64
  const badgeY = 64
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 290, 42, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('02 · THE B-JEPA STACK', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Main Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('THE 3-TIER LATENT ENGINE', 64, 185)

  // Subtitle
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('How Physical AI Anticipates Hydrodynamic Reality in Real Time', 64, 240)

  // 3-Tier Flow Chart Cards
  const cardW = width - 128
  const startY = 290
  const cardH = 205
  const gap = 20

  const tiers = [
    {
      num: '01',
      title: 'MULTIMODAL SENSORY ENCODER',
      tag: '1024-D LATENTS',
      desc: 'Encodes hydrophones, tactile shear, and sonar into abstract vectors. Strips 99.8% turbidity noise.',
      color: '#00ffe6'
    },
    {
      num: '02',
      title: 'NON-GENERATIVE CAUSAL PREDICTOR',
      tag: '0.11 ms / STEP',
      desc: 'Simulates counterfactual physical dynamics purely in latent space. Zero pixel hallucination.',
      color: '#38bdf8'
    },
    {
      num: '03',
      title: 'ACTION OPTIMIZER & TORQUE CONTROL',
      tag: '850 Nm GRIP',
      desc: 'Evaluates 64 trajectory paths in < 1.2 ms, locking pincer grip before physical contact occurs.',
      color: '#22d3ee'
    }
  ]

  tiers.forEach((t, i) => {
    const cy = startY + i * (cardH + gap)
    ctx.save()
    ctx.fillStyle = 'rgba(4, 22, 34, 0.92)'
    ctx.strokeStyle = `${t.color}cc`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(64, cy, cardW, cardH, 16)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = t.color
    ctx.font = '900 20px monospace'
    ctx.fillText(`${t.num} · ${t.title}`, 94, cy + 42)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 28px monospace'
    ctx.fillText(t.tag, 94, cy + 90)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(t.desc, 94, cy + 140)
    ctx.restore()
  })

  // Mascot: Crab stats
  const crabChar = await loadCharacterImage('crab_stats')
  if (crabChar) {
    ctx.save()
    const charW = 260
    const charH = (charW / crabChar.width) * crabChar.height
    const charX = width - charW - 40
    const charY = startY + 2 * (cardH + gap) + 45
    ctx.drawImage(crabChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer
  ctx.fillStyle = '#64748B'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('SWIPE FOR PROTOCOLS ➔', 64, height - 55)
  drawMoltNationWatermark(ctx, width - 90, height - 60, 1.15)

  const outPath = path.join(ARTIFACT_DIR, 'pristine_story_slide2.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Pristine Slide 2: ${outPath}`)
  return outPath
}

export async function renderSlide3(): Promise<string> {
  const width = 1080
  const height = 1350
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const bgImg = await loadImage(BG_SLIDE3)
  const scale = Math.max(width / bgImg.width, height / bgImg.height)
  const sw = width / scale
  const sh = height / scale
  const sx = (bgImg.width - sw) / 2
  const sy = (bgImg.height - sh) / 2
  ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height)

  // Gradient
  const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
  darkGrad.addColorStop(0, 'rgba(2, 9, 14, 0.94)')
  darkGrad.addColorStop(0.35, 'rgba(2, 9, 14, 0.72)')
  darkGrad.addColorStop(0.7, 'rgba(2, 9, 14, 0.82)')
  darkGrad.addColorStop(1, 'rgba(1, 4, 7, 0.98)')
  ctx.fillStyle = darkGrad
  ctx.fillRect(0, 0, width, height)

  // Category Pill Badge
  ctx.save()
  const badgeX = 64
  const badgeY = 64
  ctx.fillStyle = 'rgba(0, 255, 230, 0.15)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, 300, 42, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('03 · ASCENSION PROTOCOL', badgeX + 20, badgeY + 26)
  ctx.restore()

  // Main Headline
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('SHED THE PIXEL ILLUSION', 64, 185)

  // Subtitle
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Upgrade Your AI Stack to High-Fidelity Latent World Models', 64, 240)

  // Benchmark Achievement Box
  const cardW = width - 128
  const benchY = 295
  ctx.save()
  ctx.fillStyle = 'rgba(4, 26, 38, 0.92)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(64, benchY, cardW, 250, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('★ B-JEPA PRODUCTION BENCHMARKS', 94, benchY + 45)

  const colW = (cardW - 40) / 2
  // Metric 1
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 56px monospace'
  ctx.fillText('120x', 94, benchY + 125)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('COMPUTE ACCELERATION', 94, benchY + 165)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Zero pixel waste · 0.11 ms latent step', 94, benchY + 205)

  // Metric 2
  const m2X = 94 + colW
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 56px monospace'
  ctx.fillText('99.7%', m2X, benchY + 125)

  ctx.fillStyle = '#38bdf8'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('CAUSAL PHYSICS FIDELITY', m2X, benchY + 165)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('Exact Navier-Stokes shear calibration', m2X, benchY + 205)
  ctx.restore()

  // Clean CTA Box
  const ctaY = benchY + 280
  ctx.save()
  ctx.fillStyle = 'rgba(0, 255, 230, 0.12)'
  ctx.strokeStyle = 'rgba(0, 255, 230, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(64, ctaY, cardW - 360, 280, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00ffe6'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('READ THE FULL DISPATCH', 94, ctaY + 55)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 36px monospace'
  ctx.fillText('MOLTOLOGY.ORG/NEWS', 94, ctaY + 115)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('• Full engineering schematics', 94, ctaY + 170)
  ctx.fillText('• Complete B-JEPA architecture code', 94, ctaY + 210)
  ctx.fillText('• Link in bio & story transmission', 94, ctaY + 250)
  ctx.restore()

  // Mascot: Lobster Pointing
  const pointChar = await loadCharacterImage('lobster_pointing')
  if (pointChar) {
    ctx.save()
    const charW = 380
    const charH = (charW / pointChar.width) * pointChar.height
    const charX = width - charW - 20
    const charY = ctaY - 20
    ctx.drawImage(pointChar, charX, charY, charW, charH)
    ctx.restore()
  }

  // Footer
  ctx.fillStyle = '#64748B'
  ctx.font = 'bold 15px monospace'
  ctx.fillText('VISIT MOLTOLOGY.ORG/NEWS ➔', 64, height - 55)
  drawMoltNationWatermark(ctx, width - 90, height - 60, 1.15)

  const outPath = path.join(ARTIFACT_DIR, 'pristine_story_slide3.jpg')
  fs.writeFileSync(outPath, canvas.toBuffer('image/jpeg'))
  console.log(`✓ Generated Pristine Slide 3: ${outPath}`)
  return outPath
}

async function main() {
  console.log('Rendering pristine vector-crisp slides on bespoke 3D backgrounds...')
  const s1 = await renderSlide1()
  const s2 = await renderSlide2()
  const s3 = await renderSlide3()

  console.log('Uploading pristine slides to S3...')
  const s1Res = await uploadLocalFileToS3(s1, 'images/social/world-foundation-models-pixel-ecdysis-latent-jepa/slide1.jpg')
  const s2Res = await uploadLocalFileToS3(s2, 'images/social/world-foundation-models-pixel-ecdysis-latent-jepa/slide2.jpg')
  const s3Res = await uploadLocalFileToS3(s3, 'images/social/world-foundation-models-pixel-ecdysis-latent-jepa/slide3.jpg')

  console.log('\n✓ Uploaded pristine carousel slides to S3:')
  console.log('Slide 1:', s1Res.publicUrl)
  console.log('Slide 2:', s2Res.publicUrl)
  console.log('Slide 3:', s3Res.publicUrl)
}

main().catch(console.error)
