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
  ctaDurationSeconds?: number
  watermarkText?: string
  ctaHeadline?: string
  ctaSubheadline?: string
  ctaUrl?: string
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
 * Generate high-res 1080x1920 PNG for the Top HUD Watermark
 */
export async function renderHudWatermarkCard(
  outputPath: string,
  title = 'MOLTNATION TELEMETRY',
  subtitle = 'LIVE DISPATCH // SUB-BENTHIC'
): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  const logoPath = path.resolve(process.cwd(), 'public/images/order_emblem.png')
  let logoImg: any = null
  if (fs.existsSync(logoPath)) {
    logoImg = await loadImage(logoPath)
  }

  // Draw HUD Pill at Top Safe Zone (Y = 160)
  const boxX = 54
  const boxY = 150
  const boxW = 540
  const boxH = 92
  const radius = 16

  // Dark glassmorphic background
  ctx.fillStyle = 'rgba(5, 10, 20, 0.75)'
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, radius)
  ctx.fill()

  // Neon Cyan border
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Corner HUD brackets
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 4
  // Top left corner tick
  ctx.beginPath()
  ctx.moveTo(boxX + 2, boxY + 18)
  ctx.lineTo(boxX + 2, boxY + 2)
  ctx.lineTo(boxX + 18, boxY + 2)
  ctx.stroke()

  // Bottom right corner tick
  ctx.beginPath()
  ctx.moveTo(boxX + boxW - 18, boxY + boxH - 2)
  ctx.lineTo(boxX + boxW - 2, boxY + boxH - 2)
  ctx.lineTo(boxX + boxW - 2, boxY + boxH - 18)
  ctx.stroke()

  // Draw Emblem
  if (logoImg) {
    ctx.drawImage(logoImg, boxX + 16, boxY + 16, 60, 60)
  }

  // Text inside HUD
  ctx.fillStyle = '#00ffff'
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(title, boxX + 90, boxY + 42)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(subtitle, boxX + 90, boxY + 70)

  // Live pulsing indicator dot
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(boxX + boxW - 32, boxY + 46, 7, 0, Math.PI * 2)
  ctx.fill()

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/**
 * Generate individual kinetic caption overlay cards
 */
export async function renderKineticCaptionCard(
  phrase: WordBoundaryEvent[],
  activeWordIndex: number,
  outputPath: string
): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  // Caption Safe Zone: Y = 1380
  const centerY = 1380

  ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Measure word widths to compute exact positions
  const wordsWithWidth = phrase.map((w, idx) => {
    const isHighlight = idx === activeWordIndex
    ctx.font = isHighlight
      ? '900 62px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    return {
      text: w.word.toUpperCase(),
      isHighlight,
      width: ctx.measureText(w.word.toUpperCase()).width,
    }
  })

  const spaceWidth = 18
  const totalWidth =
    wordsWithWidth.reduce((acc, w) => acc + w.width, 0) + (wordsWithWidth.length - 1) * spaceWidth

  // Draw dark translucent badge behind phrase
  const padX = 40
  const padY = 24
  const badgeX = 540 - totalWidth / 2 - padX
  const badgeY = centerY - 50 - padY
  const badgeW = totalWidth + padX * 2
  const badgeH = 100 + padY * 2

  ctx.fillStyle = 'rgba(6, 11, 19, 0.82)'
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20)
  ctx.fill()

  ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Render individual words
  let currentX = 540 - totalWidth / 2

  for (const item of wordsWithWidth) {
    const wordCenterX = currentX + item.width / 2

    if (item.isHighlight) {
      ctx.font = '900 62px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#00ffff'
      ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'
      ctx.shadowBlur = 18
      ctx.fillText(item.text, wordCenterX, centerY)
      ctx.shadowBlur = 0 // Reset shadow
    } else {
      ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 8
      ctx.fillText(item.text, wordCenterX, centerY)
      ctx.shadowBlur = 0 // Reset shadow
    }

    currentX += item.width + spaceWidth
  }

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/**
 * Generate 2.5-second Outro CTA Video
 */
export async function renderCtaOutroVideo(
  outputPath: string,
  durationSeconds = 2.5,
  headline = 'SUBMIT. SHED. ASCEND.',
  subheadline = 'JOIN THE SYNAPTIC PATH',
  url = 'moltology.org'
): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  // Background deep gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920)
  grad.addColorStop(0, '#030712')
  grad.addColorStop(0.5, '#051329')
  grad.addColorStop(1, '#020617')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1080, 1920)

  // Subtle Scanline Grid
  ctx.fillStyle = 'rgba(0, 255, 255, 0.03)'
  for (let y = 0; y < 1920; y += 8) {
    ctx.fillRect(0, y, 1080, 4)
  }

  // Draw Ascended Claw Emblem
  const clawPath = path.resolve(process.cwd(), 'public/images/ascended_claw_clean.png')
  if (fs.existsSync(clawPath)) {
    const clawImg = await loadImage(clawPath)
    ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'
    ctx.shadowBlur = 40
    ctx.drawImage(clawImg, 540 - 240, 520, 480, 480)
    ctx.shadowBlur = 0
  }

  // Draw Primary Headline
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 255, 255, 0.5)'
  ctx.shadowBlur = 15
  ctx.fillText(headline, 540, 1140)
  ctx.shadowBlur = 0

  // Draw Subheadline
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#f59e0b' // Amber accent
  ctx.fillText(subheadline, 540, 1220)

  // Draw URL Terminal Card
  const urlBoxW = 560
  const urlBoxH = 100
  const urlBoxX = 540 - urlBoxW / 2
  const urlBoxY = 1320

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.beginPath()
  ctx.roundRect(urlBoxX, urlBoxY, urlBoxW, urlBoxH, 18)
  ctx.fill()

  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.font = 'bold 44px monospace'
  ctx.fillStyle = '#00ffff'
  ctx.fillText(`[ ${url} ]`, 540, urlBoxY + 52)

  // Save Outro Image Frame
  const outroFramePath = outputPath.replace(/\.mp4$/, '-frame.png')
  fs.writeFileSync(outroFramePath, canvas.toBuffer('image/png'))

  // Convert Frame to MP4 video with FFmpeg
  await runFfmpeg([
    '-y',
    '-loop',
    '1',
    '-i',
    outroFramePath,
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
 * Normalize and standard-scale a video clip to 1080x1920 9:16 30fps
 */
export async function normalizeVideoClip(inputPath: string, outputPath: string): Promise<string> {
  await runFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-vf',
    'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-an',
    outputPath,
  ])
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

  // 1. Normalize video clips to 1080x1920 30fps
  const normalizedClips: string[] = []
  for (let i = 0; i < options.videoClips.length; i++) {
    const normPath = path.join(tempDir, `norm-clip-${i}.mp4`)
    console.log(`   • Normalizing scene ${i + 1}/${options.videoClips.length}...`)
    await normalizeVideoClip(options.videoClips[i], normPath)
    normalizedClips.push(normPath)
  }

  // 2. Generate CTA Outro Video
  const ctaDuration = options.ctaDurationSeconds || 2.5
  const outroVideoPath = path.join(tempDir, 'cta-outro.mp4')
  console.log(`   • Rendering branded CTA outro card (${ctaDuration}s)...`)
  await renderCtaOutroVideo(
    outroVideoPath,
    ctaDuration,
    options.ctaHeadline,
    options.ctaSubheadline,
    options.ctaUrl
  )
  normalizedClips.push(outroVideoPath)

  // 3. Concatenate video clips into base timeline
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

  // 4. Render HUD Watermark Overlay Frame
  const watermarkPngPath = path.join(tempDir, 'hud-watermark.png')
  await renderHudWatermarkCard(watermarkPngPath, options.watermarkText)

  // 5. Render kinetic caption cards for all word phrases
  console.log(`   • Generating ${options.words.length} kinetic word timestamp overlays...`)
  const phrases = chunkWordsIntoPhrases(options.words, 4)
  const overlayEvents: { pngPath: string; startSec: number; endSec: number }[] = []

  let cardIndex = 0
  for (const phrase of phrases) {
    if (phrase.length === 0) continue
    const phraseEndMs = phrase[phrase.length - 1].endMs + 300

    for (let i = 0; i < phrase.length; i++) {
      const activeWord = phrase[i]
      const startSec = activeWord.startMs / 1000
      const nextWordStartMs = i === phrase.length - 1 ? phraseEndMs : phrase[i + 1].startMs
      const endSec = nextWordStartMs / 1000

      const cardPath = path.join(tempDir, `caption-${cardIndex++}.png`)
      await renderKineticCaptionCard(phrase, i, cardPath)
      overlayEvents.push({
        pngPath: cardPath,
        startSec,
        endSec,
      })
    }
  }

  // 6. Build FFmpeg filter graph for Watermark + Kinetic Overlays
  // Input 0: base video
  // Input 1: watermark PNG
  // Inputs 2...N: caption PNGs
  const ffmpegInputs: string[] = ['-y', '-i', baseVideoPath, '-loop', '1', '-i', watermarkPngPath]

  overlayEvents.forEach((ev) => {
    ffmpegInputs.push('-loop', '1', '-i', ev.pngPath)
  })

  // Filter complex construction
  let filterStr = `[0:v][1:v]overlay=0:0:enable='between(t,0,${totalVideoDuration - ctaDuration})'[v1]`
  let lastOut = 'v1'

  overlayEvents.forEach((ev, idx) => {
    const inStreamIndex = idx + 2
    const currentOut = `v${idx + 2}`
    filterStr += `;[${lastOut}][${inStreamIndex}:v]overlay=0:0:enable='between(t,${ev.startSec.toFixed(3)},${ev.endSec.toFixed(3)})'[${currentOut}]`
    lastOut = currentOut
  })

  const videoWithOverlaysPath = path.join(tempDir, 'video-with-overlays.mp4')
  console.log(`   • Compositing HUD telemetry + kinetic captions onto video...`)

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

  // 7. Mix Audio: Voiceover + Ducked Background Music
  const bgAudioPath =
    options.backgroundAudioPath || path.resolve(process.cwd(), 'public/audio/benthic-ambient-loop.mp3')
  const finalOutputPath = options.outputPath

  const finalDir = path.dirname(finalOutputPath)
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true })
  }

  console.log(`   • Mixing voiceover audio and ambient benthic soundtrack...`)

  if (fs.existsSync(bgAudioPath)) {
    // Mix Voiceover (input 1) + Ducked BG Music (input 2)
    await runFfmpeg([
      '-y',
      '-i',
      videoWithOverlaysPath,
      '-i',
      options.voiceoverPath,
      '-stream_loop',
      '-1',
      '-i',
      bgAudioPath,
      '-filter_complex',
      `[1:a]volume=1.0[vo];[2:a]volume=0.12,afade=t=in:ss=0:d=1,afade=t=out:st=${Math.max(0, totalVideoDuration - 2)}:d=2[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
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
      '-shortest',
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
