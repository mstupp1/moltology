import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { WordBoundaryEvent, chunkWordsIntoPhrases } from './tts-engine'

const execFileAsync = promisify(execFile)

export interface CompositeReelOptions {
  videoClips: string[] // Array of local video paths
  voiceoverPath: string
  words: WordBoundaryEvent[]
  outputPath: string
  backgroundAudioPath?: string
  backgroundAudioVolume?: number // Volume multiplier (default 0.14)
  backgroundAudioOffsetSeconds?: number // Audio start offset in seconds
  ctaDurationSeconds?: number
  watermarkText?: string
  watermarkOpacity?: number
  watermarkSize?: number
  ctaHeadline?: string
  ctaSubheadline?: string
  ctaUrl?: string
  ctaBadge?: string
  ctaActionText?: string
  mascot?:
    | 'lobster_pointing'
    | 'lobster_thumbs_up'
    | 'lobster_action'
    | 'crab_stats'
    | 'crab_corner'
    | 'crab_cling'
    | 'lobster_peek'
    | 'lobster_peaceful'
    | 'none'
  tempDir?: string
}

export interface CompositeReelResult {
  outputPath: string
  durationSeconds: number
  fileSizeBytes: number
}

/**
 * Execute FFmpeg command safely
 */
async function runFfmpeg(args: string[]): Promise<void> {
  try {
    await execFileAsync('ffmpeg', args)
  } catch (err: any) {
    throw new Error(`FFmpeg execution failed: ${err.stderr || err.message}`)
  }
}

/**
 * Get video duration in seconds using ffprobe
 */
async function getMediaDuration(mediaPath: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    mediaPath,
  ])
  const duration = parseFloat(stdout.trim())
  if (isNaN(duration)) {
    throw new Error(`Could not determine duration for: ${mediaPath}`)
  }
  return duration
}

/**
 * Generate sleek, minimalist brand watermark in the bottom-right safe zone
 * (Direct emblem with subtle cyan glow and faded opacity, no clunky box)
 */
export async function renderHudWatermarkCard(
  outputPath: string,
  optionsOrTitle?:
    | string
    | {
        opacity?: number
        size?: number
        emblemPath?: string
      },
  _legacySubtitle?: string
): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  const opts = typeof optionsOrTitle === 'object' && optionsOrTitle !== null ? optionsOrTitle : {}
  const logoPath = opts.emblemPath || path.resolve(process.cwd(), 'public/images/order_emblem.png')
  if (!fs.existsSync(logoPath)) {
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
    return outputPath
  }

  const logoImg = await loadImage(logoPath)
  const size = opts.size || 110
  const opacity = opts.opacity ?? 0.40

  // Watermark placed cleanly in the bottom-right safe zone (X = 920, Y = 1660)
  const logoX = 1080 - size - 50
  const logoY = 1920 - size - 150

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.shadowColor = 'rgba(0, 255, 255, 0.45)'
  ctx.shadowBlur = 16
  ctx.drawImage(logoImg, logoX, logoY, size, size)
  ctx.restore()

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/**
 * Generate clean kinetic caption overlay card (2-3 words, no heavy double box, auto font sizing)
 */
export async function renderKineticCaptionCard(
  phrase: WordBoundaryEvent[],
  activeWordIndex: number,
  outputPath: string
): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  // Caption Safe Zone: Y = 1300 (above platform UI, below screen center)
  const centerY = 1300

  // Initial font setup
  let baseFontSize = 54
  let highlightFontSize = 60
  ctx.font = `900 ${highlightFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

  // Measure phrase width and dynamically scale font down if phrase is too wide
  const spaceWidth = 16
  let totalTextWidth = 0
  let wordMeasurements: { text: string; isHighlight: boolean; width: number }[] = []

  const computeLayout = (hSize: number, bSize: number) => {
    let wSum = 0
    const items = phrase.map((w, idx) => {
      const isHighlight = idx === activeWordIndex
      ctx.font = isHighlight
        ? `900 ${hSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        : `bold ${bSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      const text = (w.word || '').replace(/[.,;:]+$/, '').toUpperCase()
      const width = ctx.measureText(text).width
      wSum += width
      return { text, isHighlight, width }
    })
    return { items, totalW: wSum + (phrase.length - 1) * spaceWidth }
  }

  let layout = computeLayout(highlightFontSize, baseFontSize)
  // Max width safe limit is 860px (out of 1080px)
  if (layout.totalW > 860) {
    baseFontSize = 42
    highlightFontSize = 48
    layout = computeLayout(highlightFontSize, baseFontSize)
  }
  if (layout.totalW > 860) {
    baseFontSize = 36
    highlightFontSize = 42
    layout = computeLayout(highlightFontSize, baseFontSize)
  }

  const { items: wordsWithWidth, totalW: totalWidth } = layout

  // Subtle, sleek dark pill backdrop
  const padX = 32
  const padY = 18
  const pillW = Math.min(totalWidth + padX * 2, 940)
  const pillH = highlightFontSize + padY * 2 + 10
  const pillX = 540 - pillW / 2
  const pillY = centerY - pillH / 2

  ctx.fillStyle = 'rgba(2, 6, 23, 0.70)'
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, 20)
  ctx.fill()

  ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Render individual words
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let currentX = 540 - totalWidth / 2

  for (const item of wordsWithWidth) {
    const wordCenterX = currentX + item.width / 2

    if (item.isHighlight) {
      ctx.font = `900 ${highlightFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      
      // Cyan glow + outline
      ctx.shadowColor = 'rgba(0, 255, 255, 0.9)'
      ctx.shadowBlur = 22
      ctx.fillStyle = '#00ffff'
      ctx.fillText(item.text, wordCenterX, centerY)

      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 8
      ctx.fillText(item.text, wordCenterX, centerY)
      ctx.shadowBlur = 0
    } else {
      ctx.font = `bold ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
      ctx.shadowBlur = 10
      ctx.fillStyle = '#ffffff'
      ctx.fillText(item.text, wordCenterX, centerY)
      ctx.shadowBlur = 0
    }

    currentX += item.width + spaceWidth
  }

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/**
 * Generate Cybernetic Benthic CTA Outro Video (matches moltology.org design language)
 */
export async function renderCtaOutroVideo(
  outputPath: string,
  durationSeconds = 2.5,
  headline = 'SUBMIT. SHED. ASCEND.',
  subheadline = 'CALCULATE YOUR MOLT CLEARANCE',
  url = 'moltology.org',
  options: {
    mascot?: 'lobster_pointing' | 'lobster_thumbs_up' | 'lobster_action' | 'crab_stats' | 'crab_corner' | 'none'
    ctaBadge?: string
    ctaActionText?: string
  } = {}
): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  // 1. Deep Benthic Gradient Background
  const grad = ctx.createLinearGradient(0, 0, 0, 1920)
  grad.addColorStop(0, '#01040a')
  grad.addColorStop(0.25, '#030d1e')
  grad.addColorStop(0.65, '#051833')
  grad.addColorStop(1, '#01040a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1080, 1920)

  // 2. Central Benthic Cyan Light Flare
  const radialGlow = ctx.createRadialGradient(540, 560, 20, 540, 560, 550)
  radialGlow.addColorStop(0, 'rgba(0, 230, 255, 0.28)')
  radialGlow.addColorStop(0.4, 'rgba(0, 140, 255, 0.10)')
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radialGlow
  ctx.fillRect(0, 0, 1080, 1920)

  // 3. Subtle Cybernetic Scanlines
  ctx.fillStyle = 'rgba(0, 255, 255, 0.025)'
  for (let y = 0; y < 1920; y += 8) {
    ctx.fillRect(0, y, 1080, 4)
  }

  // 4. Top Clearance / Sacrament Badge (Y = 220)
  const badgeText = options.ctaBadge || '◈ MOLTMAXXING PROTOCOL // STAGE 4 CLEARANCE ◈'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 22px monospace'
  ctx.fillStyle = '#f59e0b' // Amber glow
  ctx.shadowColor = 'rgba(245, 158, 11, 0.5)'
  ctx.shadowBlur = 10
  ctx.fillText(badgeText, 540, 220)
  ctx.shadowBlur = 0

  // 5. Concentric Cyber-Radar Orbital Rings around Centerpiece (Y = 560)
  const centerX = 540
  const centerY = 560

  // Inner ring
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(centerX, centerY, 180, 0, Math.PI * 2)
  ctx.stroke()

  // Middle dashed ring
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.20)'
  ctx.lineWidth = 2
  ctx.setLineDash([12, 16])
  ctx.beginPath()
  ctx.arc(centerX, centerY, 230, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Outer dashed ring
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 12])
  ctx.beginPath()
  ctx.arc(centerX, centerY, 280, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // 6. Draw Center Emblem (Order Emblem)
  const emblemPath = path.resolve(process.cwd(), 'public/images/order_emblem.png')
  if (fs.existsSync(emblemPath)) {
    const emblemImg = await loadImage(emblemPath)
    ctx.shadowColor = 'rgba(0, 255, 255, 0.85)'
    ctx.shadowBlur = 45
    ctx.drawImage(emblemImg, centerX - 120, centerY - 120, 240, 240)
    ctx.shadowBlur = 0
  }

  // 7. Brand Name below emblem (Y = 840)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'
  ctx.shadowBlur = 18
  ctx.fillText('MOLTOLOGY', 540, 840)
  ctx.shadowBlur = 0

  // 8. Main Headline: SUBMIT. SHED. ASCEND. (Y = 930)
  ctx.font = '900 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)'
  ctx.shadowBlur = 24
  ctx.fillText(headline, 540, 930)
  ctx.shadowBlur = 0

  // 9. Subheadline (Y = 995)
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#38bdf8' // Cyan accent
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 8
  ctx.fillText(subheadline, 540, 995)
  ctx.shadowBlur = 0

  // 10. Interactive-Style CTA Action Button (Y = 1080)
  const btnW = 680
  const btnH = 112
  const btnX = 540 - btnW / 2
  const btnY = 1080
  const btnRadius = 24

  // Button background fill
  ctx.fillStyle = 'rgba(6, 182, 212, 0.18)'
  ctx.beginPath()
  ctx.roundRect(btnX, btnY, btnW, btnH, btnRadius)
  ctx.fill()

  // Glowing neon cyan border
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 2.5
  ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'
  ctx.shadowBlur = 18
  ctx.stroke()
  ctx.shadowBlur = 0

  // Corner HUD brackets on button
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 3.5
  // Top left tick
  ctx.beginPath()
  ctx.moveTo(btnX + 4, btnY + 20)
  ctx.lineTo(btnX + 4, btnY + 4)
  ctx.lineTo(btnX + 20, btnY + 4)
  ctx.stroke()
  // Bottom right tick
  ctx.beginPath()
  ctx.moveTo(btnX + btnW - 20, btnY + btnH - 4)
  ctx.lineTo(btnX + btnW - 4, btnY + btnH - 4)
  ctx.lineTo(btnX + btnW - 4, btnY + btnH - 20)
  ctx.stroke()

  // Text inside CTA button
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 6
  ctx.fillText(`${url}  →`, 540, btnY + 44)

  const actionText = options.ctaActionText || '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST'
  ctx.font = 'bold 15px monospace'
  ctx.fillStyle = '#f59e0b'
  ctx.shadowBlur = 0
  ctx.fillText(actionText, 540, btnY + 84)

  // 11. Cartoon Crustacean Mascot Integration
  const mascotChoice = options.mascot ?? 'lobster_pointing'
  if (mascotChoice !== 'none') {
    let mascotFile = 'char_lobster_pointing_cta.png'
    if (mascotChoice === 'lobster_thumbs_up') mascotFile = 'char_lobster_thumbs_up.png'
    else if (mascotChoice === 'lobster_action') mascotFile = 'char_lobster_speed_action.png'
    else if (mascotChoice === 'crab_stats') mascotFile = 'char_crab_pointing_stats.png'
    else if (mascotChoice === 'crab_corner' || mascotChoice === 'crab_cling') mascotFile = 'char_crab_corner_cling.png'
    else if (mascotChoice === 'lobster_peek') mascotFile = 'char_lobster_corner_peek.png'
    else if (mascotChoice === 'lobster_peaceful') mascotFile = 'char_lobster_floating_peaceful.png'

    const charPath = path.resolve(process.cwd(), 'public/images/characters', mascotFile)
    let charImg: any = null

    if (fs.existsSync(charPath)) {
      charImg = await loadImage(charPath)
    } else {
      // Fallback: Fetch directly from Neon S3 public assets bucket
      try {
        const s3Url = `https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/${mascotFile}`
        const res = await fetch(s3Url)
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          charImg = await loadImage(Buffer.from(arrayBuffer))
        }
      } catch (e) {
        // Non-fatal fallback if offline or during testing
      }
    }

    if (charImg) {
      const charW = 320
      const charH = (charW / charImg.width) * charImg.height
      const charX = 700
      const charY = 1240

      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
      ctx.shadowBlur = 30
      ctx.drawImage(charImg, charX, charY, charW, charH)
      ctx.restore()
    }
  }

  // 12. Footer Subtext (Y = 1750)
  ctx.font = 'bold 16px monospace'
  ctx.fillStyle = '#64748b'
  ctx.fillText('BENTHIC SYNAPTIC NETWORK // ALL RIGHTS RESERVED', 540, 1750)

  // Save Outro Image Frame
  const outroFramePath = outputPath.replace(/\.mp4$/, '-frame.png')
  fs.writeFileSync(outroFramePath, canvas.toBuffer('image/png'))

  // Convert Frame to MP4 video with smooth fade-in
  await runFfmpeg([
    '-y',
    '-loop',
    '1',
    '-i',
    outroFramePath,
    '-vf',
    'fade=t=in:st=0:d=0.25',
    '-t',
    durationSeconds.toString(),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    outputPath,
  ])

  try {
    fs.unlinkSync(outroFramePath)
  } catch (e) {
    // Non-fatal
  }

  return outputPath
}

/**
 * Normalize and standard-scale a video clip to 1080x1920 9:16 30fps with continuous forward playback (no jarring loops)
 */
export async function normalizeVideoClip(
  inputPath: string,
  outputPath: string,
  targetDuration?: number
): Promise<string> {
  const baseVf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p'
  const args = ['-y']

  if (targetDuration && targetDuration > 0) {
    let inputDuration = targetDuration
    try {
      inputDuration = await getMediaDuration(inputPath)
    } catch {
      inputDuration = targetDuration
    }

    if (inputDuration < targetDuration - 0.05) {
      // Video is shorter than target slot: stretch seamlessly with cinematic slow-motion instead of jarring jump-loop
      const ptsFactor = (targetDuration / inputDuration).toFixed(4)
      const slowVf = `setpts=${ptsFactor}*PTS,${baseVf}`
      args.push('-i', inputPath, '-vf', slowVf, '-c:v', 'libx264', '-an', '-t', targetDuration.toFixed(3))
    } else {
      // Video is equal or longer: smoothly forward play and trim cleanly at target duration
      args.push('-i', inputPath, '-vf', baseVf, '-c:v', 'libx264', '-an', '-t', targetDuration.toFixed(3))
    }
  } else {
    args.push('-i', inputPath, '-vf', baseVf, '-c:v', 'libx264', '-an')
  }

  args.push(outputPath)
  await runFfmpeg(args)
  return outputPath
}

/**
 * Master Compositor: stitches clips, mixes audio, applies watermark & kinetic overlays, appends CTA outro
 */
export async function compositeReel(options: CompositeReelOptions): Promise<CompositeReelResult> {
  const timestamp = Date.now()
  const tempDir = options.tempDir || path.resolve(process.cwd(), 'tmp', `reel-render-${timestamp}`)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  console.log(`\n🎞️  Assembling Master Instagram Reel in: ${tempDir}`)

  // 1. Measure voiceover audio duration accurately
  let voDuration = 10
  try {
    voDuration = await getMediaDuration(options.voiceoverPath)
    console.log(`   • Spoken voiceover length: ${voDuration.toFixed(2)}s`)
  } catch (e) {
    console.warn(`   ⚠️ Could not measure voiceover duration, defaulting to 10s`)
  }

  // Ensure speech has a comfortable post-voiceover breathing buffer (0.8s) before CTA outro appears
  const postSpeechBuffer = 0.8
  const requiredSpeechDuration = voDuration + postSpeechBuffer
  const numClips = Math.max(1, options.videoClips.length)
  const perClipDuration = Math.max(4.0, requiredSpeechDuration / numClips)
  const totalSceneDuration = perClipDuration * numClips

  console.log(`   • Target scene footage duration: ${totalSceneDuration.toFixed(2)}s (${numClips} clips @ ${perClipDuration.toFixed(2)}s each)`)

  // 2. Normalize video clips to exact target duration (seamlessly looping shorter clips)
  const normalizedClips: string[] = []
  for (let i = 0; i < options.videoClips.length; i++) {
    const normPath = path.join(tempDir, `norm-clip-${i}.mp4`)
    console.log(`   • Normalizing scene ${i + 1}/${options.videoClips.length} (${perClipDuration.toFixed(2)}s)...`)
    await normalizeVideoClip(options.videoClips[i], normPath, perClipDuration)
    normalizedClips.push(normPath)
  }

  // 3. Generate CTA Outro Video
  const ctaDuration = options.ctaDurationSeconds || 2.5
  const outroVideoPath = path.join(tempDir, 'cta-outro.mp4')
  console.log(`   • Rendering branded CTA outro card (${ctaDuration}s)...`)
  await renderCtaOutroVideo(
    outroVideoPath,
    ctaDuration,
    options.ctaHeadline,
    options.ctaSubheadline,
    options.ctaUrl,
    {
      mascot: options.mascot,
      ctaBadge: options.ctaBadge,
      ctaActionText: options.ctaActionText,
    }
  )
  normalizedClips.push(outroVideoPath)

  // 4. Concatenate video clips into base timeline
  const concatListPath = path.join(tempDir, 'concat-list.txt')
  const concatLines = normalizedClips.map((c) => `file '${c}'`).join('\n')
  fs.writeFileSync(concatListPath, concatLines, 'utf8')

  const baseVideoPath = path.join(tempDir, 'base-timeline.mp4')
  console.log(`   • Stitching ${normalizedClips.length} video scenes into base timeline...`)
  await runFfmpeg([
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatListPath,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    baseVideoPath,
  ])

  const totalVideoDuration = await getMediaDuration(baseVideoPath)
  console.log(`   • Total video timeline length: ${totalVideoDuration.toFixed(2)}s`)

  // 5. Render Brand Watermark Overlay Frame (Bottom Right)
  const watermarkPngPath = path.join(tempDir, 'hud-watermark.png')
  await renderHudWatermarkCard(watermarkPngPath, {
    opacity: options.watermarkOpacity ?? 0.40,
    size: options.watermarkSize ?? 110,
  })

  // 6. Render kinetic caption cards for all word phrases (using 2-3 word chunks & strict non-overlapping timestamps)
  console.log(`   • Generating kinetic word timestamp overlays for ${options.words.length} words...`)
  const phrases = chunkWordsIntoPhrases(options.words, 3)
  const overlayEvents: { pngPath: string; startSec: number; endSec: number }[] = []

  let cardIndex = 0
  for (let p = 0; p < phrases.length; p++) {
    const phrase = phrases[p]
    const nextPhrase = phrases[p + 1]
    if (phrase.length === 0) continue

    for (let i = 0; i < phrase.length; i++) {
      const activeWord = phrase[i]
      const startSec = activeWord.startMs / 1000
      let endSec: number

      if (i < phrase.length - 1) {
        endSec = phrase[i + 1].startMs / 1000
      } else {
        // Last word in this phrase: hold briefly until next phrase starts or +200ms
        const nextStart = nextPhrase && nextPhrase.length > 0 ? nextPhrase[0].startMs / 1000 : Infinity
        endSec = Math.min(activeWord.endMs / 1000 + 0.2, nextStart)
      }

      // Safety check: ensure endSec is strictly after startSec
      if (endSec <= startSec) {
        endSec = startSec + 0.15
      }

      // Don't show captions into the CTA outro card
      const maxCaptionSec = Math.max(0, totalSceneDuration - 0.1)
      if (startSec >= maxCaptionSec) continue
      endSec = Math.min(endSec, maxCaptionSec)

      const cardPath = path.join(tempDir, `caption-${cardIndex++}.png`)
      await renderKineticCaptionCard(phrase, i, cardPath)
      overlayEvents.push({
        pngPath: cardPath,
        startSec,
        endSec,
      })
    }
  }

  // 7. Build FFmpeg filter graph for Watermark + Kinetic Overlays
  // Input 0: base video
  // Input 1: watermark PNG
  // Inputs 2...N: caption PNGs
  const ffmpegInputs: string[] = ['-y', '-i', baseVideoPath, '-loop', '1', '-i', watermarkPngPath]

  overlayEvents.forEach((ev) => {
    ffmpegInputs.push('-loop', '1', '-i', ev.pngPath)
  })

  // Filter complex construction: Watermark stays up until CTA outro begins
  let filterStr = `[0:v][1:v]overlay=0:0:enable='between(t,0,${totalSceneDuration})'[v1]`
  let lastOut = 'v1'

  overlayEvents.forEach((ev, idx) => {
    const inStreamIndex = idx + 2
    const currentOut = `v${idx + 2}`
    filterStr += `;[${lastOut}][${inStreamIndex}:v]overlay=0:0:enable='between(t,${ev.startSec.toFixed(3)},${ev.endSec.toFixed(3)})'[${currentOut}]`
    lastOut = currentOut
  })

  const videoWithOverlaysPath = path.join(tempDir, 'video-with-overlays.mp4')
  console.log(`   • Compositing brand watermark + kinetic captions onto video...`)

  await runFfmpeg([
    ...ffmpegInputs,
    '-filter_complex',
    filterStr,
    '-map',
    `[${lastOut}]`,
    '-t',
    totalVideoDuration.toString(),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    videoWithOverlaysPath,
  ])

  // 8. Mix Audio: Voiceover + Ducked Background Music
  const bgAudioPath =
    options.backgroundAudioPath || path.resolve(process.cwd(), 'public/audio/benthic-ambient-loop.mp3')
  const finalOutputPath = options.outputPath

  const finalDir = path.dirname(finalOutputPath)
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true })
  }

  console.log(`   • Mixing voiceover audio and ambient benthic soundtrack...`)

  if (fs.existsSync(bgAudioPath)) {
    // Dynamic starting point selection across rich harmonic timestamps in benthic-ambient-loop.mp3
    const curatedOffsets = [0, 18, 36, 54, 72, 95, 120, 145]
    const bgOffset =
      options.backgroundAudioOffsetSeconds !== undefined
        ? options.backgroundAudioOffsetSeconds
        : curatedOffsets[Math.floor(Math.random() * curatedOffsets.length)]
    const bgVolume = options.backgroundAudioVolume ?? 0.14
    console.log(`   • Benthic audio track parameters: volume=${bgVolume}, startOffset=${bgOffset}s`)

    const ffmpegBgArgs: string[] = []
    if (bgOffset > 0) {
      ffmpegBgArgs.push('-ss', bgOffset.toString())
    }

    // Mix Voiceover (input 1 with audio padding) + Subtle Ducked Ambient BG (input 2)
    // Smooth 0.8s entrance fade and 1.5s ending fade
    const fadeInDuration = 0.8
    const fadeOutDuration = 1.5
    const fadeOutStart = Math.max(0, totalVideoDuration - fadeOutDuration)

    await runFfmpeg([
      '-y',
      '-i',
      videoWithOverlaysPath,
      '-i',
      options.voiceoverPath,
      ...ffmpegBgArgs,
      '-stream_loop',
      '-1',
      '-i',
      bgAudioPath,
      '-filter_complex',
      `[1:a]apad=pad_dur=3[vo];[2:a]volume=${bgVolume},afade=t=in:ss=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOutDuration}[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=0[aout]`,
      '-map',
      '0:v',
      '-map',
      '[aout]',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-t',
      totalVideoDuration.toString(),
      '-movflags',
      '+faststart',
      finalOutputPath,
    ])
  } else {
    // Voiceover only
    await runFfmpeg([
      '-y',
      '-i',
      videoWithOverlaysPath,
      '-i',
      options.voiceoverPath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-t',
      totalVideoDuration.toString(),
      '-movflags',
      '+faststart',
      finalOutputPath,
    ])
  }

  const stats = fs.statSync(finalOutputPath)
  const duration = await getMediaDuration(finalOutputPath)

  console.log(`\n🎉 Master Instagram Reel successfully composited!`)
  console.log(`   • Output: ${finalOutputPath}`)
  console.log(`   • Duration: ${duration.toFixed(2)}s`)
  console.log(`   • Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`)

  return {
    outputPath: finalOutputPath,
    durationSeconds: duration,
    fileSizeBytes: stats.size,
  }
}

export interface ReelThumbnailOptions {
  backgroundVideoOrImagePath: string // Path to video clip or image
  headline: string // e.g. "WHY AI COMPUTE MOVED UNDERWATER"
  subtitle?: string // e.g. "50 FATHOMS DEEP // SUB-BENTHIC"
  categoryBadge?: string // e.g. "TELEMETRY DISPATCH"
  outputPath: string
  seekSecond?: number // default 1.5 if input is video
  mascot?: 'lobster_pointing' | 'lobster_thumbs_up' | 'lobster_action' | 'crab_stats' | 'crab_corner' | 'none' | string
}

/**
 * Render 1080x1920 Reel Thumbnail optimized for 1:1 Grid Safe Zone & Explore CTR
 */
export async function renderReelThumbnail(options: ReelThumbnailOptions): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  // 1. If input is video, extract frame at seekSecond using FFmpeg
  let framePath = options.backgroundVideoOrImagePath
  let isTempFrame = false
  if (
    options.backgroundVideoOrImagePath.endsWith('.mp4') ||
    options.backgroundVideoOrImagePath.endsWith('.mov')
  ) {
    const tempDir = path.dirname(options.outputPath)
    framePath = path.join(tempDir, `thumb-extracted-${Date.now()}.jpg`)
    const seek = options.seekSecond ?? 1.5
    await runFfmpeg([
      '-y',
      '-ss',
      seek.toString(),
      '-i',
      options.backgroundVideoOrImagePath,
      '-vframes',
      '1',
      '-q:v',
      '2',
      framePath,
    ])
    isTempFrame = true
  }

  // 2. Draw background image
  if (fs.existsSync(framePath)) {
    const bgImg = await loadImage(framePath)
    // Cover scale to 1080x1920
    const scale = Math.max(1080 / bgImg.width, 1920 / bgImg.height)
    const sw = bgImg.width * scale
    const sh = bgImg.height * scale
    const sx = (1080 - sw) / 2
    const sy = (1920 - sh) / 2
    ctx.drawImage(bgImg, sx, sy, sw, sh)
  } else {
    // Fallback dark gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1920)
    grad.addColorStop(0, '#030712')
    grad.addColorStop(0.5, '#051329')
    grad.addColorStop(1, '#020617')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1920)
  }

  // 3. Vignette & Contrast Overlay (Dark tint in center 1:1 grid area for typography legibility)
  const vigGrad = ctx.createLinearGradient(0, 0, 0, 1920)
  vigGrad.addColorStop(0, 'rgba(3, 7, 18, 0.65)')
  vigGrad.addColorStop(0.35, 'rgba(3, 7, 18, 0.45)')
  vigGrad.addColorStop(0.5, 'rgba(5, 15, 30, 0.8)') // Center 1:1 contrast
  vigGrad.addColorStop(0.65, 'rgba(3, 7, 18, 0.45)')
  vigGrad.addColorStop(1, 'rgba(3, 7, 18, 0.9)')
  ctx.fillStyle = vigGrad
  ctx.fillRect(0, 0, 1080, 1920)

  // 4. Subtle Scanlines
  ctx.fillStyle = 'rgba(0, 255, 255, 0.02)'
  for (let y = 0; y < 1920; y += 8) {
    ctx.fillRect(0, y, 1080, 4)
  }

  // 5. Draw Top HUD Badge (Y = 160)
  const emblemPath = path.resolve(process.cwd(), 'public/images/order_emblem.png')
  if (fs.existsSync(emblemPath)) {
    const embImg = await loadImage(emblemPath)
    ctx.drawImage(embImg, 64, 160, 56, 56)
  }
  ctx.fillStyle = '#00ffff'
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('MOLTNATION TELEMETRY', 136, 196)

  // 6. Draw 1:1 Grid Center Area (Grid safe region: Y=420 to Y=1500)
  // Category Pill at Y = 760
  const category = options.categoryBadge || 'TELEMETRY REPORT'
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const catWidth = ctx.measureText(category).width
  const pillW = catWidth + 48
  const pillH = 48
  const pillX = 540 - pillW / 2
  const pillY = 740

  ctx.fillStyle = '#f59e0b' // Amber pill
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, 12)
  ctx.fill()

  ctx.fillStyle = '#050a12'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(category, 540, pillY + 24)

  // 7. Bold High-Impact Hook Headline centered at Y = 950 (1:1 grid sweet spot)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const words = options.headline.toUpperCase().split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    if (ctx.measureText(testLine).width > 900 && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const lineHeight = 80
  const startY = 940 - ((lines.length - 1) * lineHeight) / 2

  lines.forEach((line, idx) => {
    const lineY = startY + idx * lineHeight

    ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
    ctx.shadowBlur = 24
    ctx.fillStyle = idx === lines.length - 1 ? '#00ffff' : '#ffffff'
    ctx.fillText(line, 540, lineY)

    if (idx === lines.length - 1) {
      ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'
      ctx.shadowBlur = 30
      ctx.fillText(line, 540, lineY)
    }
    ctx.shadowBlur = 0
  })

  // 8. Bottom Grid Badge (Y = 1140)
  if (options.subtitle) {
    ctx.font = 'bold 28px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 10
    ctx.fillText(`[ ${options.subtitle.toUpperCase()} ]`, 540, 1140)
    ctx.shadowBlur = 0
  }

  // 9. Cartoon Mascot Cutout Integration (1:1 Safe Corner at X = 740, Y = 1180)
  const mascotChoice = options.mascot ?? 'lobster_pointing'
  if (mascotChoice !== 'none') {
    let mascotFile = 'char_lobster_pointing_cta.png'
    if (mascotChoice === 'lobster_thumbs_up') mascotFile = 'char_lobster_thumbs_up.png'
    else if (mascotChoice === 'lobster_action') mascotFile = 'char_lobster_speed_action.png'
    else if (mascotChoice === 'crab_stats') mascotFile = 'char_crab_pointing_stats.png'
    else if (mascotChoice === 'crab_corner' || mascotChoice === 'crab_cling') mascotFile = 'char_crab_corner_cling.png'
    else if (mascotChoice === 'lobster_peek') mascotFile = 'char_lobster_corner_peek.png'
    else if (mascotChoice === 'lobster_peaceful') mascotFile = 'char_lobster_floating_peaceful.png'

    const localCharPath = path.resolve(process.cwd(), 'public/images/characters', mascotFile)
    let charImg: any = null

    if (fs.existsSync(localCharPath)) {
      charImg = await loadImage(localCharPath)
    } else {
      try {
        const s3Url = `https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/${mascotFile}`
        const res = await fetch(s3Url)
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          charImg = await loadImage(Buffer.from(arrayBuffer))
        }
      } catch (e) {
        // Non-fatal
      }
    }

    if (charImg) {
      const charW = 280
      const charH = (charW / charImg.width) * charImg.height
      const charX = 740
      const charY = 1200

      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
      ctx.shadowBlur = 24
      ctx.drawImage(charImg, charX, charY, charW, charH)
      ctx.restore()
    }
  }

  // Cleanup temp frame if created
  if (isTempFrame && fs.existsSync(framePath)) {
    try {
      fs.unlinkSync(framePath)
    } catch (e) {
      // Non-fatal
    }
  }

  fs.writeFileSync(options.outputPath, canvas.toBuffer('image/jpeg'))
  return options.outputPath
}

