/**
 * The mouth check: the lesson re-shot as face close-ups on whoever is speaking, with each mouth
 * shape's letter on screen and the voice's waveform along the bottom. Shapes are shown on the
 * frames they are drawn (already leading the voice), so the gap between a shape and its sound in
 * the waveform is the lead. Made by `anim:create --mouth-check`; for judging sync frame by frame.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { NARRATOR, type Lesson } from './lesson'

const execFileAsync = promisify(execFile)

/** What each shape is for, as the animator's chart names it. */
export const SHAPE_SOUNDS: Record<string, string> = {
  X: 'rest',
  A: 'M B P',
  B: 'K S T EE',
  C: 'EH AE',
  D: 'AA',
  E: 'AO ER',
  F: 'OO W',
  G: 'F V',
  H: 'L',
}

/** The same lesson with every scene a cut to a face close-up on its speaker (the host for the narrator). */
export function mouthCheckLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    scenes: lesson.scenes.map((scene) => {
      const speaker = scene.speaker ?? lesson.host
      return { ...scene, shot: 'extreme' as const, move: 'cut' as const, focus: speaker === NARRATOR ? lesson.host : speaker }
    }),
  }
}

/** One stretch of frames with the same shape labels on screen: one label line per speaking member. */
export interface LabelRun {
  lines: string[]
  frames: number
}

/**
 * The label lines frame by frame, as runs: each member who speaks at all gets a line with their
 * current shape letter and the sounds it is for. Exported for tests.
 */
export function mouthCheckLabels(mouthBy: string[], names: string[]): LabelRun[] {
  const speakers = mouthBy.map((letters, m) => ({ letters, name: names[m] })).filter((s) => /[^X]/.test(s.letters))
  const length = Math.max(0, ...speakers.map((s) => s.letters.length))
  const runs: LabelRun[] = []
  for (let f = 0; f < length; f++) {
    const lines = speakers.map(({ letters, name }) => {
      const shape = letters[f] ?? 'X'
      return `${name}   ${shape}   ${SHAPE_SOUNDS[shape] ?? ''}`
    })
    const last = runs[runs.length - 1]
    if (last && last.lines.join('|') === lines.join('|')) last.frames++
    else runs.push({ lines, frames: 1 })
  }
  return runs
}

/**
 * The close-up clip with the voice, the shape labels and the waveform strip, as one video. Labels
 * are drawn as images and played as an image sequence, so this works with any ffmpeg build (the
 * Mac's Homebrew one has no subtitle filter).
 */
export async function finishMouthCheck(o: { clip: string; audio: string; labels: LabelRun[]; fps: number; outPath: string; width: number; height: number }) {
  const { createCanvas } = await import('@napi-rs/canvas')
  const dir = path.resolve(path.dirname(o.outPath), 'labels')
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const size = Math.round(o.height * 0.03)
  const pad = Math.round(size * 0.5)
  const stripH = Math.max(1, ...o.labels.map((r) => r.lines.length)) * Math.round(size * 1.5) + pad * 2
  const drawn = new Map<string, string>()
  const list: string[] = []
  for (const run of o.labels) {
    const key = run.lines.join('|')
    let file = drawn.get(key)
    if (!file) {
      const canvas = createCanvas(o.width, stripH)
      const ctx = canvas.getContext('2d')
      ctx.font = `700 ${size}px -apple-system, "Helvetica Neue", "DejaVu Sans", sans-serif`
      ctx.textBaseline = 'top'
      run.lines.forEach((line, i) => {
        const y = pad + i * Math.round(size * 1.5)
        const w = ctx.measureText(line).width
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(pad - 12, y - 8, w + 24, size + 16)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(line, pad, y)
      })
      file = path.join(dir, `${drawn.size}.png`)
      fs.writeFileSync(file, canvas.toBuffer('image/png'))
      drawn.set(key, file)
    }
    list.push(`file '${file.replace(/'/g, "'\\''")}'`, `duration ${(run.frames / o.fps).toFixed(6)}`)
  }
  // The concat format holds the last image only if it is listed again.
  if (list.length) list.push(list[list.length - 2])
  const concat = path.join(dir, 'labels.txt')
  fs.writeFileSync(concat, `${list.join('\n')}\n`)
  const wave = `${o.width}x${Math.round(o.height * 0.12)}`
  const filter = [
    `[1:a]showwaves=s=${wave}:mode=cline:rate=${o.fps}:colors=0x7fe3d6,format=rgba,colorchannelmixer=aa=0.85[w]`,
    `[2:v]fps=${o.fps},format=rgba[l]`,
    `[0:v]scale=${o.width}:${o.height}[v0]`,
    `[v0][w]overlay=0:H-h-${Math.round(o.height * 0.03)}:shortest=1[v1]`,
    `[v1][l]overlay=0:${Math.round(o.height * 0.03)}:eof_action=repeat[v]`,
  ].join(';')
  await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', o.clip, '-i', o.audio, '-f', 'concat', '-safe', '0', '-i', concat, '-filter_complex', filter, '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', o.outPath])
  return o.outPath
}
