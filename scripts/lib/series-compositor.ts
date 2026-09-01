import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { WordBoundaryEvent, chunkWordsIntoPhrases } from './tts-engine'
import {
  ColorGradingPreset,
  getColorGradingFilter,
  normalizeVideoClip,
  renderHudWatermarkCard,
  renderKineticCaptionCard,
  renderCtaOutroVideo,
  renderSimpleCtaOutroVideo,
  hasAudioStream,
} from './reel-compositor'

const execFileAsync = promisify(execFile)

export interface CompositeSeriesReelOptions {
  videoClips: string[] // 3-5 scene video paths
  voiceoverPath: string
  words: WordBoundaryEvent[]
  outputPath: string
  seriesName: string
  seriesShortBadge?: string
  seasonNumber: number
  episodeNumber: number
  episodeTitle?: string
  colorGrading?: ColorGradingPreset | ColorGradingPreset[] | string | string[]
  transitionType?: 'fade' | 'fadeblack' | 'dissolve' | 'none'
  transitionDuration?: number
  showEpisodicBadge?: boolean // default false (keep frame clean and immersive)
  preserveNativeAudio?: boolean // default true (mix original video sound effects)
  nativeAudioVolume?: number // default 0.85
  backgroundAudioPath?: string
  backgroundAudioVolume?: number // default 0.14
  backgroundAudioOffsetSeconds?: number
  ctaDurationSeconds?: number // default 2.5
  watermarkOpacity?: number // default 0.40
  watermarkSize?: number // default 110
  ctaHeadline?: string
  ctaSubheadline?: string
  ctaUrl?: string
  ctaBadge?: string
  ctaActionText?: string
  ctaTexture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none' | string
  customOutroImagePath?: string
  useSimpleOutro?: boolean // default true (sleek, minimalist fade-in: logo, Moltology, Synaptic Path, moltology.org)
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

export interface CompositeSeriesReelResult {
  outputPath: string
  durationSeconds: number
  fileSizeBytes: number
  numScenes: number
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
 * Render Episodic HUD Badge Overlay (Top Center / Upper-Third Safe Zone).
 * Series name and episode code are two separate fields (FIELD AUDIT · S01 EP.04).
 */
export async function renderEpisodicBadgeCard(
  outputPath: string,
  badgeText: string,
  episodeCode: string,
  options: {
    emblemPath?: string
  } = {}
): Promise<string> {
  const width = 1080
  const height = 1920
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Top Safe Zone Badge Container (y: 200px - 280px)
  const badgeW = 760
  const badgeH = 76
  const badgeX = (width - badgeW) / 2
  const badgeY = 220
  const radius = 8

  // Dark glassmorphic HUD pill
  ctx.save()
  const bgGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH)
  bgGrad.addColorStop(0, 'rgba(4, 20, 26, 0.88)')
  bgGrad.addColorStop(0.5, 'rgba(9, 44, 56, 0.88)')
  bgGrad.addColorStop(1, 'rgba(4, 20, 26, 0.88)')

  ctx.fillStyle = bgGrad
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius)
  ctx.fill()

  // Glowing cyan border
  ctx.strokeStyle = '#00c3ff'
  ctx.lineWidth = 1.5
  ctx.shadowColor = 'rgba(0, 195, 255, 0.65)'
  ctx.shadowBlur = 12
  ctx.stroke()
  ctx.restore()

  // Top subtle highlight line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.fillRect(badgeX + 8, badgeY + 2, badgeW - 16, 1)

  // Pulsing live indicator dot
  const dotX = badgeX + 32
  const dotY = badgeY + badgeH / 2
  ctx.save()
  ctx.fillStyle = '#00ffff'
  ctx.shadowColor = 'rgba(0, 255, 255, 0.9)'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.arc(dotX, dotY, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Typography: Series Title + Episode Code
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Space Grotesk", "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 6
  ctx.fillText(badgeText.toUpperCase(), dotX + 18, dotY)

  // Episode Code Pill (Right side)
  ctx.textAlign = 'right'
  ctx.font = 'bold 20px monospace'
  ctx.fillStyle = '#38bdf8'
  ctx.shadowColor = 'rgba(0, 195, 255, 0.5)'
  ctx.shadowBlur = 8
  ctx.fillText(episodeCode.toUpperCase(), badgeX + badgeW - 24, dotY)

  const outDir = path.dirname(outputPath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/**
 * Stitch multiple normalized video clips with smooth transitions (xfade cross-dissolve / dip)
 */
export async function stitchClipsWithTransitions(
  clipPaths: string[],
  outputPath: string,
  options: {
    transitionDuration?: number
    transitionType?: 'fade' | 'fadeblack' | 'dissolve' | 'none'
  } = {}
): Promise<string> {
  const transitionDuration = options.transitionDuration ?? 0.20
  const transitionType = options.transitionType ?? 'fade'

  if (clipPaths.length <= 1 || transitionType === 'none') {
    const concatListPath = outputPath.replace(/\.mp4$/, '-concat-list.txt')
    const concatLines = clipPaths.map((c) => `file '${c}'`).join('\n')
    fs.writeFileSync(concatListPath, concatLines, 'utf8')
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
      outputPath,
    ])
    try {
      fs.unlinkSync(concatListPath)
    } catch {
      // Non-fatal
    }
    return outputPath
  }

  // Get durations of each clip to compute xfade offsets
  const durations: number[] = []
  for (const c of clipPaths) {
    durations.push(await getMediaDuration(c))
  }

  const inputs: string[] = []
  clipPaths.forEach((c) => {
    inputs.push('-i', c)
  })

  // Check if clips have audio to preserve native SFX during transition
  const hasAudio = await hasAudioStream(clipPaths[0])

  let filterGraph = ''
  let currentOffset = 0
  let lastOutputTag = '0:v'
  let lastAudioTag = '0:a'

  for (let i = 1; i < clipPaths.length; i++) {
    currentOffset += durations[i - 1] - (i > 1 ? transitionDuration : 0)
    const offset = Math.max(0.1, currentOffset - transitionDuration)
    const nextOutputTag = i === clipPaths.length - 1 ? 'vout' : `v${i}`
    const actualTransition = transitionType === 'dissolve' ? 'fade' : transitionType

    filterGraph += `[${lastOutputTag}][${i}:v]xfade=transition=${actualTransition}:duration=${transitionDuration}:offset=${offset.toFixed(3)}[${nextOutputTag}];`
    lastOutputTag = nextOutputTag

    if (hasAudio) {
      const nextAudioTag = i === clipPaths.length - 1 ? 'aout' : `a${i}`
      filterGraph += `[${lastAudioTag}][${i}:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[${nextAudioTag}];`
      lastAudioTag = nextAudioTag
    }
  }

  filterGraph = filterGraph.replace(/;$/, '')

  const mapArgs = hasAudio
    ? ['-map', `[${lastOutputTag}]`, '-map', `[${lastAudioTag}]`, '-c:a', 'aac', '-b:a', '192k']
    : ['-map', `[${lastOutputTag}]`]

  try {
    await runFfmpeg([
      '-y',
      ...inputs,
      '-filter_complex',
      filterGraph,
      ...mapArgs,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      outputPath,
    ])
  } catch (err: any) {
    console.warn(`   ⚠️ Smooth xfade transition fallback (${err.message}). Using standard concat list...`)
    const concatListPath = outputPath.replace(/\.mp4$/, '-concat-list.txt')
    const concatLines = clipPaths.map((c) => `file '${c}'`).join('\n')
    fs.writeFileSync(concatListPath, concatLines, 'utf8')
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
      '-c:a',
      'aac',
      '-pix_fmt',
      'yuv420p',
      outputPath,
    ])
    try {
      fs.unlinkSync(concatListPath)
    } catch {
      // Non-fatal
    }
  }

  return outputPath
}

/**
 * Composite Multi-Scene Episodic Viral Reel Timeline
 */
export async function compositeSeriesReel(
  options: CompositeSeriesReelOptions
): Promise<CompositeSeriesReelResult> {
  const tempDir = options.tempDir || path.resolve(process.cwd(), 'tmp/series-composite', `${Date.now()}`)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  console.log(`\n🎬 Initiating Episodic Viral Reel Compositor...`)
  console.log(`   • Series: ${options.seriesName} (Season ${options.seasonNumber}, Ep ${options.episodeNumber})`)
  console.log(`   • Input Video Scenes: ${options.videoClips.length} scenes`)

  // 1. Calculate durations based on voiceover audio
  const voDuration = await getMediaDuration(options.voiceoverPath)
  const postSpeechBuffer = 0.8
  const requiredSpeechDuration = voDuration + postSpeechBuffer
  const numClips = Math.max(1, options.videoClips.length)
  const perClipDuration = Math.max(3.5, requiredSpeechDuration / numClips)
  const totalSceneDuration = perClipDuration * numClips

  console.log(`   • Voiceover Duration: ${voDuration.toFixed(2)}s`)
  console.log(
    `   • Total Narrative Footage: ${totalSceneDuration.toFixed(2)}s (${numClips} scenes @ ${perClipDuration.toFixed(
      2
    )}s each)`
  )

  // 2. Normalize and color grade all video scenes (3 to 5 scenes)
  const normalizedClips: string[] = []
  const gradingOpt = options.colorGrading || 'auto'

  for (let i = 0; i < options.videoClips.length; i++) {
    const normPath = path.join(tempDir, `norm-scene-${i + 1}.mp4`)
    let clipPreset: string | undefined

    if (Array.isArray(gradingOpt)) {
      clipPreset = gradingOpt[i] || gradingOpt[0] || 'none'
    } else if (gradingOpt === 'auto' || gradingOpt === 'ecdysis-transmute') {
      // Dynamic multi-scene cinematic progression:
      // Scene 1 (The Hook/Melt Problem): Warm thermal glow
      // Scene 2 (The Real-world Friction): Calcified dark amber
      // Scene 3 (The Benthic Transmutation): Deep ocean cyan
      // Scene 4 (The Hardware Ecdysis / Latent Physics): Coherent photonics matrix
      // Scene 5 (Climax): Deep ocean cyan
      const progression = ['thermal-melt', 'calcified-armor', 'benthic-cyan', 'photonics-matrix', 'benthic-cyan']
      clipPreset = progression[i % progression.length]
    } else {
      clipPreset = gradingOpt
    }

    const presetLabel = clipPreset && clipPreset !== 'none' ? ` [Grade: ${clipPreset}]` : ''
    console.log(
      `   • Normalizing scene ${i + 1}/${options.videoClips.length} (${perClipDuration.toFixed(2)}s)${presetLabel}...`
    )
    await normalizeVideoClip(options.videoClips[i], normPath, perClipDuration, clipPreset)
    normalizedClips.push(normPath)
  }

  // 3. Render CTA Outro Card Video (Simplified fade-in ending by default for viral series)
  const ctaDuration = options.ctaDurationSeconds || 2.5
  const outroVideoPath = path.join(tempDir, 'cta-outro.mp4')
  const useSimple = options.useSimpleOutro !== false

  if (useSimple) {
    console.log(`   • Rendering Simplified CTA Outro Card (${ctaDuration}s, clean moltology.org fade-in)...`)
    await renderSimpleCtaOutroVideo(
      outroVideoPath,
      ctaDuration,
      options.ctaUrl || 'moltology.org',
      {
        customImagePath: options.customOutroImagePath,
      }
    )
  } else {
    console.log(`   • Rendering 3D CTA Outro Card (${ctaDuration}s)...`)
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
  }
  normalizedClips.push(outroVideoPath)

  // 4. Stitch narrative scenes with smooth quick transitions, then append CTA outro
  const baseVideoPath = path.join(tempDir, 'base-stitched-video.mp4')
  const transitionType = options.transitionType ?? 'fade'
  const transitionDuration = options.transitionDuration ?? 0.20

  console.log(`   • Stitching ${normalizedClips.length} scenes into base timeline (Transition: ${transitionType}, ${transitionDuration}s)...`)
  await stitchClipsWithTransitions(normalizedClips, baseVideoPath, {
    transitionDuration,
    transitionType,
  })

  const totalVideoDuration = await getMediaDuration(baseVideoPath)
  console.log(`   • Stitched timeline duration: ${totalVideoDuration.toFixed(2)}s`)

  // 5. Render Brand Watermark Overlay (and optional Episodic Badge Overlay)
  const showBadge = options.showEpisodicBadge === true
  let badgePngPath: string | null = null
  if (showBadge) {
    badgePngPath = path.join(tempDir, 'episodic-badge.png')
    const badgeLabel = options.seriesShortBadge || options.seriesName
    const epFormatted = `S${String(options.seasonNumber).padStart(2, '0')} EP.${String(options.episodeNumber).padStart(
      2,
      '0'
    )}`
    await renderEpisodicBadgeCard(badgePngPath, badgeLabel, epFormatted)
  }

  const watermarkPngPath = path.join(tempDir, 'hud-watermark.png')
  await renderHudWatermarkCard(watermarkPngPath, {
    opacity: options.watermarkOpacity ?? 0.4,
    size: options.watermarkSize ?? 110,
  })

  // 6. Generate sentence-isolated kinetic caption overlays
  console.log(`   • Generating kinetic captions for ${options.words.length} words...`)
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
        const nextStart = nextPhrase && nextPhrase.length > 0 ? nextPhrase[0].startMs / 1000 : Infinity
        endSec = Math.min(activeWord.endMs / 1000 + 0.2, nextStart)
      }

      if (endSec <= startSec) {
        endSec = startSec + 0.15
      }

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

  // 7. Assemble FFmpeg filter graph:
  // Input 0: base video
  // Input 1: watermark PNG
  // (Optional Input 2: episodic badge PNG)
  // Inputs 2/3...N: caption PNGs
  const ffmpegInputs: string[] = [
    '-y',
    '-i',
    baseVideoPath,
    '-loop',
    '1',
    '-i',
    watermarkPngPath,
  ]

  let filterStr = `[0:v][1:v]overlay=0:0:enable='between(t,0,${totalSceneDuration})'[v_wm]`
  let lastOut = 'v_wm'
  let captionStartIdx = 2

  if (showBadge && badgePngPath) {
    ffmpegInputs.push('-loop', '1', '-i', badgePngPath)
    filterStr += `;[${lastOut}][2:v]overlay=0:0:enable='between(t,0,${totalSceneDuration})'[v_badge]`
    lastOut = 'v_badge'
    captionStartIdx = 3
  }

  overlayEvents.forEach((ev, idx) => {
    const inStreamIndex = idx + captionStartIdx
    ffmpegInputs.push('-loop', '1', '-i', ev.pngPath)
    const currentOut = `v_cap_${idx}`
    filterStr += `;[${lastOut}][${inStreamIndex}:v]overlay=0:0:enable='between(t,${ev.startSec.toFixed(
      3
    )},${ev.endSec.toFixed(3)})'[${currentOut}]`
    lastOut = currentOut
  })

  const videoWithOverlaysPath = path.join(tempDir, 'video-with-overlays.mp4')
  console.log(`   • Compositing brand watermark & kinetic captions onto video...`)

  await runFfmpeg([
    ...ffmpegInputs,
    '-filter_complex',
    filterStr,
    '-map',
    `[${lastOut}]`,
    '-map',
    '0:a?',
    '-t',
    totalVideoDuration.toString(),
    '-c:v',
    'libx264',
    '-c:a',
    'copy',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    videoWithOverlaysPath,
  ])

  // 8. Multi-Track Audio Mixing (Native Video SFX + Voiceover + Ducked Ambient Benthic Score)
  const bgAudioPath =
    options.backgroundAudioPath || path.resolve(process.cwd(), 'assets/audio/benthic-ambient-loop.mp3')
  const finalOutputPath = options.outputPath

  const finalDir = path.dirname(finalOutputPath)
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true })
  }

  const hasNativeSfx =
    options.preserveNativeAudio !== false && (await hasAudioStream(videoWithOverlaysPath))
  const nativeSfxVolume = options.nativeAudioVolume ?? 0.85

  console.log(
    `   • Mixing multi-track audio (Native SFX: ${hasNativeSfx ? `volume=${nativeSfxVolume}` : 'none'}, Voiceover, and Ducked Benthic Score)...`
  )

  if (fs.existsSync(bgAudioPath)) {
    const curatedOffsets = [0, 18, 36, 54, 72, 95, 120, 145]
    const bgOffset =
      options.backgroundAudioOffsetSeconds !== undefined
        ? options.backgroundAudioOffsetSeconds
        : curatedOffsets[Math.floor(Math.random() * curatedOffsets.length)]
    const bgVolume = options.backgroundAudioVolume ?? 0.14
    console.log(`   • Benthic audio score parameters: volume=${bgVolume}, startOffset=${bgOffset}s`)

    const ffmpegBgArgs: string[] = []
    if (bgOffset > 0) {
      ffmpegBgArgs.push('-ss', bgOffset.toString())
    }

    const fadeInDuration = 0.8
    const fadeOutDuration = 1.5
    const fadeOutStart = Math.max(0, totalVideoDuration - fadeOutDuration)

    let audioFilter: string
    if (hasNativeSfx) {
      audioFilter = `[0:a]volume=${nativeSfxVolume}[sfx];[1:a]apad=pad_dur=3,volume=1.0[vo];[2:a]volume=${bgVolume},afade=t=in:ss=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart.toFixed(
        3
      )}:d=${fadeOutDuration}[bg];[sfx][vo][bg]amix=inputs=3:duration=first:dropout_transition=0[aout]`
    } else {
      audioFilter = `[1:a]apad=pad_dur=3,volume=1.0[vo];[2:a]volume=${bgVolume},afade=t=in:ss=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart.toFixed(
        3
      )}:d=${fadeOutDuration}[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=0[aout]`
    }

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
      audioFilter,
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
    let audioFilter: string
    if (hasNativeSfx) {
      audioFilter = `[0:a]volume=${nativeSfxVolume}[sfx];[1:a]apad=pad_dur=3,volume=1.0[vo];[sfx][vo]amix=inputs=2:duration=first:dropout_transition=0[aout]`
    } else {
      audioFilter = `[1:a]apad=pad_dur=3,volume=1.0[vo];[vo]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[aout]`
    }

    await runFfmpeg([
      '-y',
      '-i',
      videoWithOverlaysPath,
      '-i',
      options.voiceoverPath,
      '-filter_complex',
      audioFilter,
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
  }

  const finalDuration = await getMediaDuration(finalOutputPath)
  const stats = fs.statSync(finalOutputPath)

  console.log(`\n✨ Episodic Viral Reel Masterpiece Ready!`)
  console.log(`   • Output: ${finalOutputPath}`)
  console.log(`   • Duration: ${finalDuration.toFixed(2)}s | Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`)

  return {
    outputPath: finalOutputPath,
    durationSeconds: finalDuration,
    fileSizeBytes: stats.size,
    numScenes: options.videoClips.length,
  }
}
