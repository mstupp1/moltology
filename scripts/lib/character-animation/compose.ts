/**
 * Turns rendered character frames into the finished short: backdrop under the character, the
 * spoken-hook headline over the opening, one clip per scene, then the shared reel compositor
 * for subtitles, music, watermark and outro (the same finish as every other reel).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas'
import type { WordBoundaryEvent } from '../tts-engine'

const execFileAsync = promisify(execFile)
export const OUT_W = 1080
export const OUT_H = 1920
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

async function ffmpeg(args: string[]): Promise<void> {
  try {
    await execFileAsync('ffmpeg', ['-v', 'error', ...args], { maxBuffer: 1024 * 1024 * 64 })
  } catch (err: any) {
    throw new Error(`ffmpeg failed: ${err.stderr || err.message}`)
  }
}

/**
 * The default set when a lesson has no painted backdrop: deep water, a soft pool of light where
 * the character stands and a darker edge, in the site's colours. Painted ImageGen backdrops
 * replace it for real episodes.
 */
export async function defaultBackdrop(outPath: string): Promise<string> {
  const canvas = createCanvas(OUT_W, OUT_H)
  const ctx = canvas.getContext('2d')
  const sky = ctx.createLinearGradient(0, 0, 0, OUT_H)
  sky.addColorStop(0, '#0b3a4f')
  sky.addColorStop(0.45, '#08263a')
  sky.addColorStop(1, '#040d18')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, OUT_W, OUT_H)
  // Light falling from above, in three soft shafts.
  for (const [x, w, a] of [[300, 260, 0.07], [620, 180, 0.05], [820, 220, 0.04]] as const) {
    const g = ctx.createLinearGradient(0, 0, 0, OUT_H * 0.85)
    g.addColorStop(0, `rgba(160,235,255,${a})`)
    g.addColorStop(1, 'rgba(160,235,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(x - w * 0.3, 0)
    ctx.lineTo(x + w * 0.3, 0)
    ctx.lineTo(x + w - 60, OUT_H * 0.85)
    ctx.lineTo(x - w + 60, OUT_H * 0.85)
    ctx.closePath()
    ctx.fill()
  }
  // A pale sandy floor glow where the character stands.
  const pool = ctx.createRadialGradient(OUT_W / 2, OUT_H * 0.8, 40, OUT_W / 2, OUT_H * 0.8, OUT_W * 0.75)
  pool.addColorStop(0, 'rgba(90,170,190,0.32)')
  pool.addColorStop(1, 'rgba(90,170,190,0)')
  ctx.fillStyle = pool
  ctx.fillRect(0, 0, OUT_W, OUT_H)
  const edge = ctx.createRadialGradient(OUT_W / 2, OUT_H / 2, OUT_H * 0.3, OUT_W / 2, OUT_H / 2, OUT_H * 0.75)
  edge.addColorStop(0, 'rgba(0,0,0,0)')
  edge.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, OUT_W, OUT_H)
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'))
  return outPath
}

/** Wraps words into lines no wider than `max` at the current font. */
function wrap(ctx: SKRSContext2D, words: string[], max: number): string[][] {
  const lines: string[][] = [[]]
  for (const word of words) {
    const line = lines[lines.length - 1]
    const trial = [...line, word].join(' ')
    if (line.length && ctx.measureText(trial).width > max) lines.push([word])
    else line.push(word)
  }
  return lines
}

/**
 * The spoken-hook headline as one transparent card per spoken word: the words said so far turn
 * amber. Layout follows the reel rules: 80px or larger, inside x 120-900, y 460-900.
 */
export function renderHeadlineCards(headline: string, outDir: string): string[] {
  const words = headline.trim().split(/\s+/)
  const canvas = createCanvas(OUT_W, OUT_H)
  const ctx = canvas.getContext('2d')
  let size = 104
  let lines: string[][] = []
  for (; size >= 80; size -= 4) {
    ctx.font = `800 ${size}px ${FONT}`
    lines = wrap(ctx, words, 760)
    if (lines.length * size * 1.12 <= 440) break
  }
  const lineHeight = size * 1.12
  const top = 460 + (440 - lines.length * lineHeight) / 2 + lineHeight / 2
  const cards: string[] = []
  fs.mkdirSync(outDir, { recursive: true })
  for (let active = 0; active <= words.length; active++) {
    ctx.clearRect(0, 0, OUT_W, OUT_H)
    ctx.font = `800 ${size}px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    let k = 0
    lines.forEach((line, row) => {
      const y = top + row * lineHeight
      const width = ctx.measureText(line.join(' ')).width
      let x = (OUT_W - width) / 2
      for (const word of line) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 14
        ctx.shadowOffsetY = 4
        ctx.lineWidth = 10
        ctx.strokeStyle = 'rgba(8,12,18,0.92)'
        ctx.strokeText(word, x, y)
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        ctx.fillStyle = k < active ? '#f59e0b' : '#ffffff'
        ctx.fillText(word, x, y)
        x += ctx.measureText(`${word} `).width
        k++
      }
    })
    const file = path.join(outDir, `headline-${active}.png`)
    fs.writeFileSync(file, canvas.toBuffer('image/png'))
    cards.push(file)
  }
  return cards
}

/** A centred line of text near the top of the frame, for the outro. */
export function renderOutroText(lines: string[], outPath: string): string {
  const canvas = createCanvas(OUT_W, OUT_H)
  const ctx = canvas.getContext('2d')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  lines.forEach((text, i) => {
    const size = i === 0 ? 76 : 96
    ctx.font = `800 ${size}px ${FONT}`
    const y = 500 + i * 130
    ctx.lineWidth = 10
    ctx.strokeStyle = 'rgba(8,12,18,0.92)'
    ctx.strokeText(text, OUT_W / 2, y)
    ctx.fillStyle = i === lines.length - 1 ? '#f59e0b' : '#ffffff'
    ctx.fillText(text, OUT_W / 2, y)
  })
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'))
  return outPath
}

export interface SceneClipOptions {
  framesDir: string
  fps: number
  /** First frame and number of frames of this scene. */
  start: number
  count: number
  backdrop: string
  outPath: string
  /** Timed overlays (full-frame transparent PNGs) in seconds from the scene start. */
  overlays?: { png: string; from: number; to: number }[]
}

/** One scene: the character frames over the backdrop, plus any timed overlays, at 1080x1920. */
export async function renderSceneClip(o: SceneClipOptions): Promise<string> {
  const inputs = ['-loop', '1', '-framerate', String(o.fps), '-i', o.backdrop, '-framerate', String(o.fps), '-start_number', String(o.start), '-i', path.join(o.framesDir, '%05d.png')]
  const overlays = o.overlays ?? []
  for (const ov of overlays) inputs.push('-loop', '1', '-framerate', String(o.fps), '-i', ov.png)
  const fit = `scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=increase,crop=${OUT_W}:${OUT_H}`
  const chain = [`[0:v]${fit},setsar=1[bg]`, `[1:v]scale=${OUT_W}:${OUT_H}:flags=lanczos,format=rgba[ch]`, `[bg][ch]overlay=0:0:format=auto[v0]`]
  overlays.forEach((ov, i) => {
    chain.push(`[v${i}][${i + 2}:v]overlay=0:0:enable='between(t,${ov.from.toFixed(3)},${ov.to.toFixed(3)})'[v${i + 1}]`)
  })
  await ffmpeg([
    '-y',
    ...inputs,
    '-filter_complex',
    chain.join(';'),
    '-map',
    `[v${overlays.length}]`,
    '-frames:v',
    String(o.count),
    '-r',
    String(o.fps),
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    o.outPath,
  ])
  return o.outPath
}

/** Silent audio of a given length, standing in for the voice in silent test renders. */
export async function silentAudio(seconds: number, outPath: string): Promise<string> {
  await ffmpeg(['-y', '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-t', seconds.toFixed(3), '-c:a', 'libmp3lame', outPath])
  return outPath
}

/** Timed headline overlays for the spoken hook: the word cards switch as each word is spoken. */
export function headlineOverlays(cards: string[], words: WordBoundaryEvent[], hookEnd: number): { png: string; from: number; to: number }[] {
  const n = cards.length - 1
  const out: { png: string; from: number; to: number }[] = []
  for (let i = 0; i <= n; i++) {
    const from = i === 0 ? 0 : words[i - 1].startMs / 1000
    const to = i < n ? words[i].startMs / 1000 : hookEnd
    if (to > from) out.push({ png: cards[i], from, to })
  }
  return out
}

/** Copies a backdrop to a known size so ffmpeg never meets an odd image format. */
export async function normaliseBackdrop(input: string, outPath: string): Promise<string> {
  const image = await loadImage(fs.readFileSync(input))
  const canvas = createCanvas(OUT_W, OUT_H)
  const ctx = canvas.getContext('2d')
  const scale = Math.max(OUT_W / image.width, OUT_H / image.height)
  const w = image.width * scale
  const h = image.height * scale
  ctx.drawImage(image, (OUT_W - w) / 2, (OUT_H - h) / 2, w, h)
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'))
  return outPath
}
