import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { captureComposite } from './composite-renderer'
import { WordBoundaryEvent, chunkWordsIntoPhrases } from './tts-engine'

const execFileAsync = promisify(execFile)

export type ColorGradingPreset =
  | 'auto'
  | 'benthic-cyan'
  | 'thermal-melt'
  | 'photonics-matrix'
  | 'calcified-armor'
  | 'ecdysis-transmute'
  | 'none'

export const COLOR_GRADING_FILTERS: Record<string, string> = {
  'benthic-cyan': 'eq=contrast=1.08:brightness=-0.01:saturation=1.08,colorbalance=rs=-0.04:bs=0.08',
  'thermal-melt': 'eq=contrast=1.08:saturation=1.12,colorbalance=rs=0.08:gs=0.01:bs=-0.06',
  'photonics-matrix': 'eq=contrast=1.10:brightness=-0.01:saturation=1.12,unsharp=3:3:0.6:3:3:0.0',
  'calcified-armor': 'eq=contrast=1.10:saturation=0.96,colorbalance=bs=0.04:rs=-0.02,unsharp=3:3:0.6:3:3:0.0',
  'none': '',
}

/**
 * Resolves a specific FFmpeg video filter string for a given color grading preset
 */
export function getColorGradingFilter(preset?: ColorGradingPreset | string): string {
  if (!preset || preset === 'none' || preset === 'auto' || preset === 'ecdysis-transmute') {
    return ''
  }
  return COLOR_GRADING_FILTERS[preset] || ''
}

export interface CompositeReelOptions {
  videoClips: string[] // Array of local video paths
  voiceoverPath: string
  words: WordBoundaryEvent[]
  outputPath: string
  colorGrading?: ColorGradingPreset | ColorGradingPreset[] | string | string[]
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
  ctaTexture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none' | string
  customOutroImagePath?: string
  mascot?:
    | 'lobster_pointing'
    | 'lobster_thumbs_up'
    | 'lobster_action'
    | 'crab_stats'
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
 * Render Kinetic Subtitle Card with active word glowing cyan (Sentence-Isolated 2-3 word chunks)
 */
export async function renderKineticCaptionCard(
  wordsInPhrase: WordBoundaryEvent[],
  activeWordIndex: number,
  outputPath: string
): Promise<string> {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  const centerY = 1380
  const maxLineWidth = 920

  const getWordSpacing = (idx: number) => {
    const w = wordsInPhrase[idx]?.word || ''
    if (w.endsWith('-') || w.endsWith('—') || w.endsWith('–') || w.endsWith('/')) {
      return 0
    }
    return spaceWidth
  }

  let phraseText = ''
  for (let i = 0; i < wordsInPhrase.length; i++) {
    phraseText += wordsInPhrase[i].word
    if (
      i < wordsInPhrase.length - 1 &&
      !wordsInPhrase[i].word.endsWith('-') &&
      !wordsInPhrase[i].word.endsWith('—') &&
      !wordsInPhrase[i].word.endsWith('–') &&
      !wordsInPhrase[i].word.endsWith('/')
    ) {
      phraseText += ' '
    }
  }
  let baseFontSize = 64
  if (phraseText.length > 24) baseFontSize = 54
  if (phraseText.length > 34) baseFontSize = 46

  ctx.font = `900 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  let phraseMetrics = ctx.measureText(phraseText)

  if (phraseMetrics.width > maxLineWidth) {
    baseFontSize = Math.floor(baseFontSize * (maxLineWidth / phraseMetrics.width))
    ctx.font = `900 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    phraseMetrics = ctx.measureText(phraseText)
  }

  const spaceWidth = ctx.measureText(' ').width
  const wordMeasurements = wordsInPhrase.map((w) => {
    ctx.font = `900 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    return {
      text: w.word,
      width: ctx.measureText(w.word).width,
    }
  })

  const totalCalculatedWidth =
    wordMeasurements.reduce((acc, curr, idx) => acc + curr.width + (idx < wordsInPhrase.length - 1 ? getWordSpacing(idx) : 0), 0)

  let currentX = (1080 - totalCalculatedWidth) / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < wordsInPhrase.length; i++) {
    const item = wordMeasurements[i]
    const wordCenterX = currentX + item.width / 2

    if (i === activeWordIndex) {
      // Glow background pill behind active word
      ctx.save()
      const pillPadX = 16
      const pillPadY = 10
      const pillH = baseFontSize + pillPadY * 2
      const pillW = item.width + pillPadX * 2
      const pillX = currentX - pillPadX
      const pillY = centerY - pillH / 2

      ctx.fillStyle = 'rgba(0, 45, 60, 0.75)'
      ctx.strokeStyle = '#00c3ff'
      ctx.lineWidth = 2
      ctx.shadowColor = 'rgba(0, 195, 255, 0.7)'
      ctx.shadowBlur = 18

      ctx.beginPath()
      ctx.roundRect(pillX, pillY, pillW, pillH, 8)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // Luminous active word text
      ctx.font = `900 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.shadowColor = 'rgba(0, 195, 255, 0.95)'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#00ffff'
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

    currentX += item.width + (i < wordsInPhrase.length - 1 ? getWordSpacing(i) : 0)
  }

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/**
 * Generate Sleek Frame for the Branded CTA Outro Card via Composite Studio (Headless Chrome) with Canvas Fallback
 */
export async function renderCtaOutroFrame(
  outputPath: string,
  headline = 'SUBMIT. SHED. ASCEND.',
  subheadline = 'CALCULATE YOUR MOLT CLEARANCE',
  url = 'moltology.org',
  options: {
    mascot?: 'lobster_pointing' | 'lobster_thumbs_up' | 'lobster_action' | 'crab_stats' | 'lobster_peek' | 'lobster_peaceful' | 'none' | string
    ctaBadge?: string
    ctaActionText?: string
    linkInBioText?: string
    ctaTexture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none' | string
    useCanvasOnly?: boolean
  } = {}
): Promise<string> {
  const mascotChoice = (options.mascot ?? 'lobster_pointing') as any

  // 1. Primary: High-DPI Web Composite Studio Capture via Headless Chrome
  if (!options.useCanvasOnly) {
    try {
      const outDir = path.dirname(outputPath)
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
      }

      await captureComposite({
        template: 'reel-outro',
        aspectRatio: '9:16',
        mascot: mascotChoice === 'none' ? undefined : mascotChoice,
        scaleFactor: 1, // 1080x1920 native vertical resolution
        data: {
          headline,
          subheadline,
          url,
          actionBadgeText: options.ctaActionText || options.ctaBadge,
          linkInBioText: (options.linkInBioText || 'LINK IN BIO').replace(/(\s*·\s*)?TAP TO AUDIT/gi, '').trim() || 'LINK IN BIO',
          ctaTexture: options.ctaTexture || 'chitin',
        },
        outputPath,
      })

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        return outputPath
      }
    } catch (e: any) {
      console.warn(`   ⚠️ Headless Chrome Composite Studio capture fallback: ${e.message}`)
    }
  }

  // 2. Resilient Canvas Fallback (Center aligned, matching site styling, large mascot, no zero latency telemetry)
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  // 1. Homepage Benthic Dark Background (#070b0b base)
  ctx.fillStyle = '#070b0b'
  ctx.fillRect(0, 0, 1080, 1920)

  // 2. Top Ambient Cyan Spotlight
  const topSpotlight = ctx.createRadialGradient(540, 0, 20, 540, 0, 900)
  topSpotlight.addColorStop(0, 'rgba(0, 195, 255, 0.20)')
  topSpotlight.addColorStop(0.5, 'rgba(0, 195, 255, 0.05)')
  topSpotlight.addColorStop(1, 'rgba(7, 11, 11, 0)')
  ctx.fillStyle = topSpotlight
  ctx.fillRect(0, 0, 1080, 1920)

  // Bottom subtle vignette
  const bottomVignette = ctx.createRadialGradient(540, 1920, 10, 540, 1920, 900)
  bottomVignette.addColorStop(0, 'rgba(3, 6, 6, 0.85)')
  bottomVignette.addColorStop(1, 'rgba(7, 11, 11, 0)')
  ctx.fillStyle = bottomVignette
  ctx.fillRect(0, 0, 1080, 1920)

  // 3. Scanline Background Pattern
  const scanlinePath = path.resolve(process.cwd(), 'public/images/scanline_pattern.png')
  if (fs.existsSync(scanlinePath)) {
    try {
      const scanlineImg = await loadImage(scanlinePath)
      const pattern = ctx.createPattern(scanlineImg, 'repeat')
      if (pattern) {
        ctx.save()
        ctx.globalAlpha = 0.28
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, 1080, 1920)
        ctx.restore()
      }
    } catch {
      // Fallback
    }
  }

  // 4. Center Order Emblem
  const centerX = 540
  const centerY = 470
  const emblemPath = path.resolve(process.cwd(), 'public/images/order_emblem.png')
  if (fs.existsSync(emblemPath)) {
    const emblemImg = await loadImage(emblemPath)
    ctx.save()
    ctx.shadowColor = 'rgba(0, 195, 255, 0.45)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 4
    const emblemSize = 190
    ctx.drawImage(emblemImg, centerX - emblemSize / 2, centerY - emblemSize / 2, emblemSize, emblemSize)
    ctx.restore()
  }

  // 5. Two-Line Brand Title (Moltology / THE SYNAPTIC PATH)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Line 1: Moltology
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 10
  ctx.fillText('Moltology', centerX, 635)

  // Line 2: THE SYNAPTIC PATH (Clean cyan uppercase tracking)
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#38bdf8'
  ctx.shadowColor = 'rgba(0, 195, 255, 0.5)'
  ctx.shadowBlur = 10
  ctx.fillText('THE SYNAPTIC PATH', centerX, 685)
  ctx.shadowBlur = 0

  // 6. Main Headline (e.g. SUBMIT. SHED. ASCEND.)
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 195, 255, 0.5)'
  ctx.shadowBlur = 20
  ctx.fillText(headline, centerX, 805)
  ctx.shadowBlur = 0

  // 7. Subheadline (e.g. CALCULATE YOUR MOLT CLEARANCE)
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#00c3ff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
  ctx.shadowBlur = 8
  ctx.fillText(subheadline, centerX, 865)
  ctx.shadowBlur = 0

  // 8. Canonical App-Style CTA Button (Exact from BenthicCTAButton / HudButton with Chitin Texture)
  const btnW = 700
  const btnH = 124
  const btnX = centerX - btnW / 2
  const btnY = 945
  const btnRadius = 6

  // Gradient fill matching HudButton cyan variant: from-[#05222b] via-[#093d4a] to-[#062833]
  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH)
  btnGrad.addColorStop(0, '#05222b')
  btnGrad.addColorStop(0.5, '#093d4a')
  btnGrad.addColorStop(1, '#062833')

  ctx.save()
  ctx.fillStyle = btnGrad
  ctx.beginPath()
  ctx.roundRect(btnX, btnY, btnW, btnH, btnRadius)
  ctx.fill()

  // Glowing cyan border matching HudButton
  ctx.strokeStyle = '#00c3ff'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(0, 195, 255, 0.55)'
  ctx.shadowBlur = 18
  ctx.stroke()
  ctx.restore()

  // Subtle top highlight inset
  ctx.fillStyle = 'rgba(255, 255, 255, 0.20)'
  ctx.fillRect(btnX + 4, btnY + 2, btnW - 8, 1.5)

  // Primary URL Text inside button
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 8
  ctx.fillText(`${url}  →`, centerX, btnY + 48)

  // Action text / sub-badge inside button
  const actionText = options.ctaActionText || options.ctaBadge || '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST'
  ctx.font = 'bold 16px monospace'
  ctx.fillStyle = '#f59e0b' // Amber
  ctx.shadowBlur = 0
  ctx.fillText(actionText, centerX, btnY + 92)

  // Subtitle directly below button (No zero latency telemetry, No tap to audit)
  const displayLinkInBio = (options.linkInBioText || 'LINK IN BIO').replace(/(\s*·\s*)?TAP TO AUDIT/gi, '').trim() || 'LINK IN BIO'
  ctx.font = 'bold 14px monospace'
  ctx.fillStyle = '#94a3b8' // Slate-400
  ctx.fillText(displayLinkInBio, centerX, btnY + 145)

  // 9. Large Cartoon Crustacean Mascot Integration (Bottom Right)
  if (mascotChoice !== 'none') {
    let mascotFile = 'char_lobster_pointing_cta.png'
    if (mascotChoice === 'lobster_thumbs_up') mascotFile = 'char_lobster_thumbs_up.png'
    else if (mascotChoice === 'lobster_action') mascotFile = 'char_lobster_speed_action.png'
    else if (mascotChoice === 'crab_stats') mascotFile = 'char_crab_pointing_stats.png'
    else if (mascotChoice === 'lobster_peek') mascotFile = 'char_lobster_corner_peek.png'
    else if (mascotChoice === 'lobster_peaceful') mascotFile = 'char_lobster_floating_peaceful.png'

    const charPath = path.resolve(process.cwd(), 'public/images/characters', mascotFile)
    let charImg: any = null

    if (fs.existsSync(charPath)) {
      try {
        charImg = await loadImage(charPath)
      } catch {}
    }

    if (charImg) {
      // Large character size for strong presence and personality
      const charW = 540
      const charH = (charW / charImg.width) * charImg.height
      const charX = 510
      const charY = 1180

      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
      ctx.shadowBlur = 24
      ctx.drawImage(charImg, charX, charY, charW, charH)
      ctx.restore()
    }
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
    mascot?: 'lobster_pointing' | 'lobster_thumbs_up' | 'lobster_action' | 'crab_stats' | 'lobster_peek' | 'lobster_peaceful' | 'none' | string
    ctaBadge?: string
    ctaActionText?: string
    ctaTexture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none' | string
    customImagePath?: string
  } = {}
): Promise<string> {
  let outroFramePath = options.customImagePath && fs.existsSync(options.customImagePath)
    ? options.customImagePath
    : ''
  let isTempFrame = false

  if (!outroFramePath) {
    outroFramePath = outputPath.replace(/\.mp4$/, '-frame.png')
    isTempFrame = true
    await renderCtaOutroFrame(outroFramePath, headline, subheadline, url, options)
  }

  // Convert Frame to MP4 video with smooth fade-in, guaranteed 1080x1920 scaling, and stereo audio stream
  await runFfmpeg([
    '-y',
    '-loop',
    '1',
    '-i',
    outroFramePath,
    '-f',
    'lavfi',
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf',
    'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p,fade=t=in:st=0:d=0.25',
    '-t',
    durationSeconds.toString(),
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-pix_fmt',
    'yuv420p',
    '-shortest',
    '-r',
    '30',
    outputPath,
  ])

  if (isTempFrame) {
    try {
      fs.unlinkSync(outroFramePath)
    } catch (e) {
      // Non-fatal
    }
  }

  return outputPath
}

/**
 * Generate Minimal Frame for the Branded CTA Outro Card via Composite Studio (Headless Chrome) with Canvas Fallback
 * Features exclusively: Moltology emblem, brand title, Synaptic Path row, and minimalist moltology.org button.
 */
export async function renderSimpleCtaOutroFrame(
  outputPath: string,
  url = 'moltology.org',
  options: {
    useCanvasOnly?: boolean
    backgroundImageUrl?: string
  } = {}
): Promise<string> {
  // 1. Primary: High-DPI Web Composite Studio Capture via Headless Chrome
  if (!options.useCanvasOnly) {
    try {
      const outDir = path.dirname(outputPath)
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
      }

      await captureComposite({
        template: 'reel-simple-outro' as any,
        aspectRatio: '9:16',
        scaleFactor: 1, // 1080x1920 native vertical resolution
        data: {
          url,
          backgroundImageUrl: options.backgroundImageUrl,
        },
        outputPath,
      })

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        return outputPath
      }
    } catch (e: any) {
      console.warn(`   ⚠️ Headless Chrome Simple Outro capture fallback: ${e.message}`)
    }
  }

  // 2. Resilient Canvas Fallback
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')

  // 1. Homepage Benthic Dark Background (#070b0b base)
  ctx.fillStyle = '#070b0b'
  ctx.fillRect(0, 0, 1080, 1920)

  // 2. Ambient Cyan Spotlight (Center / Subsurface Glow)
  const centerSpotlight = ctx.createRadialGradient(540, 960, 20, 540, 960, 800)
  centerSpotlight.addColorStop(0, 'rgba(0, 195, 255, 0.16)')
  centerSpotlight.addColorStop(0.5, 'rgba(0, 195, 255, 0.04)')
  centerSpotlight.addColorStop(1, 'rgba(7, 11, 11, 0)')
  ctx.fillStyle = centerSpotlight
  ctx.fillRect(0, 0, 1080, 1920)

  // 3. Scanline Background Pattern
  const scanlinePath = path.resolve(process.cwd(), 'public/images/scanline_pattern.png')
  if (fs.existsSync(scanlinePath)) {
    try {
      const scanlineImg = await loadImage(scanlinePath)
      const pattern = ctx.createPattern(scanlineImg, 'repeat')
      if (pattern) {
        ctx.save()
        ctx.globalAlpha = 0.25
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, 1080, 1920)
        ctx.restore()
      }
    } catch {
      // Fallback
    }
  }

  // 4. Center Order Emblem (Exact match with renderCtaOutroFrame)
  const centerX = 540
  const centerY = 740
  const emblemPath = path.resolve(process.cwd(), 'public/images/order_emblem.png')
  if (fs.existsSync(emblemPath)) {
    try {
      const emblemImg = await loadImage(emblemPath)
      ctx.save()
      ctx.shadowColor = 'rgba(0, 195, 255, 0.45)'
      ctx.shadowBlur = 24
      ctx.shadowOffsetY = 4
      const emblemSize = 190
      ctx.drawImage(emblemImg, centerX - emblemSize / 2, centerY - emblemSize / 2, emblemSize, emblemSize)
      ctx.restore()
    } catch {}
  }

  // 5. Two-Line Brand Title (Moltology / THE SYNAPTIC PATH - Exact match)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Line 1: Moltology
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 10
  ctx.fillText('Moltology', centerX, 900)

  // Line 2: THE SYNAPTIC PATH (Clean cyan uppercase tracking)
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#38bdf8'
  ctx.shadowColor = 'rgba(0, 195, 255, 0.5)'
  ctx.shadowBlur = 10
  ctx.fillText('THE SYNAPTIC PATH', centerX, 950)
  ctx.shadowBlur = 0

  // 7. Minimalist Canonical App-Style CTA Button (Just moltology.org)
  const btnW = 580
  const btnH = 100
  const btnX = centerX - btnW / 2
  const btnY = 1050
  const btnRadius = 14

  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH)
  btnGrad.addColorStop(0, '#05222b')
  btnGrad.addColorStop(0.5, '#093d4a')
  btnGrad.addColorStop(1, '#062833')

  ctx.save()
  ctx.fillStyle = btnGrad
  ctx.beginPath()
  ctx.roundRect(btnX, btnY, btnW, btnH, btnRadius)
  ctx.fill()

  ctx.strokeStyle = '#00c3ff'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(0, 195, 255, 0.55)'
  ctx.shadowBlur = 20
  ctx.stroke()
  ctx.restore()

  // Top highlight inset
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.fillRect(btnX + 6, btnY + 2, btnW - 12, 1.5)

  // Primary URL text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 10
  ctx.fillText(url, centerX, btnY + btnH / 2)

  const outDir = path.dirname(outputPath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/**
 * Generate Simple Cybernetic Benthic CTA Outro Video with smooth fade-in
 */
export async function renderSimpleCtaOutroVideo(
  outputPath: string,
  durationSeconds = 2.5,
  url = 'moltology.org',
  options: {
    customImagePath?: string
    useCanvasOnly?: boolean
  } = {}
): Promise<string> {
  let outroFramePath = options.customImagePath && fs.existsSync(options.customImagePath)
    ? options.customImagePath
    : ''
  let isTempFrame = false

  if (!outroFramePath) {
    outroFramePath = outputPath.replace(/\.mp4$/, '-simple-frame.png')
    isTempFrame = true
    await renderSimpleCtaOutroFrame(outroFramePath, url, options)
  }

  await runFfmpeg([
    '-y',
    '-loop',
    '1',
    '-i',
    outroFramePath,
    '-f',
    'lavfi',
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf',
    'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p,fade=t=in:st=0:d=0.30',
    '-t',
    durationSeconds.toString(),
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-pix_fmt',
    'yuv420p',
    '-shortest',
    '-r',
    '30',
    outputPath,
  ])

  if (isTempFrame) {
    try {
      fs.unlinkSync(outroFramePath)
    } catch {
      // Non-fatal
    }
  }

  return outputPath
}

/**
 * Check if a media file contains an audio stream
 */
export async function hasAudioStream(mediaPath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'a',
      '-show_entries',
      'stream=codec_type',
      '-of',
      'csv=p=0',
      mediaPath,
    ])
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

/**
 * Normalize and standard-scale a video clip to 1080x1920 9:16 30fps with continuous forward playback and optional atmospheric color grading
 */
export async function normalizeVideoClip(
  inputPath: string,
  outputPath: string,
  targetDuration?: number,
  colorPreset?: ColorGradingPreset | string,
  preserveAudio = true
): Promise<string> {
  const gradeFilter = getColorGradingFilter(colorPreset)
  const baseVf = gradeFilter
    ? `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p,${gradeFilter}`
    : 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p'
  const args = ['-y']

  const hasAudio = preserveAudio ? await hasAudioStream(inputPath) : false

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
      if (hasAudio) {
        args.push('-i', inputPath, '-vf', slowVf, '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k', '-t', targetDuration.toFixed(3))
      } else {
        args.push('-i', inputPath, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-vf', slowVf, '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-t', targetDuration.toFixed(3))
      }
    } else {
      // Video is equal or longer: smoothly forward play and trim cleanly at target duration
      if (hasAudio) {
        args.push('-i', inputPath, '-vf', baseVf, '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k', '-t', targetDuration.toFixed(3))
      } else {
        args.push('-i', inputPath, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-vf', baseVf, '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-t', targetDuration.toFixed(3))
      }
    }
  } else {
    if (hasAudio) {
      args.push('-i', inputPath, '-vf', baseVf, '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k')
    } else {
      args.push('-i', inputPath, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-vf', baseVf, '-c:v', 'libx264', '-c:a', 'aac', '-shortest')
    }
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

  // 2. Normalize video clips to exact target duration with contextual color grading
  const normalizedClips: string[] = []
  const gradingOpt = options.colorGrading || 'auto'

  for (let i = 0; i < options.videoClips.length; i++) {
    const normPath = path.join(tempDir, `norm-clip-${i}.mp4`)
    let clipPreset: string | undefined

    if (Array.isArray(gradingOpt)) {
      clipPreset = gradingOpt[i] || gradingOpt[0] || 'none'
    } else if (gradingOpt === 'auto' || gradingOpt === 'ecdysis-transmute') {
      // Subtle narrative arc: Scene 1 (The Problem/Melt) gets warm thermal grade, subsequent scenes get benthic cyan
      clipPreset = i === 0 ? 'thermal-melt' : 'benthic-cyan'
    } else {
      clipPreset = gradingOpt
    }

    const presetLabel = clipPreset && clipPreset !== 'none' ? ` [Grade: ${clipPreset}]` : ''
    console.log(`   • Normalizing scene ${i + 1}/${options.videoClips.length} (${perClipDuration.toFixed(2)}s)${presetLabel}...`)
    await normalizeVideoClip(options.videoClips[i], normPath, perClipDuration, clipPreset)
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
      ctaTexture: options.ctaTexture,
      customImagePath: options.customOutroImagePath,
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
    options.backgroundAudioPath || path.resolve(process.cwd(), 'assets/audio/benthic-ambient-loop.mp3')
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
  subtitle?: string // e.g. "50 FATHOMS DEEP · SUB-BENTHIC"
  categoryBadge?: string // e.g. "TELEMETRY DISPATCH"
  outputPath: string
  seekSecond?: number // default 1.5 if input is video
  mascot?: 'lobster_pointing' | 'lobster_thumbs_up' | 'lobster_action' | 'crab_stats' | 'none' | string
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
      // Scale character with strong visibility and presence in the 1:1 safe zone
      const charW = 330
      const charH = (charW / charImg.width) * charImg.height
      const charX = 690
      const charY = 1160

      ctx.save()
      // Soft natural ambient shadow for clean, integrated grounding
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
      ctx.shadowBlur = 18
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

