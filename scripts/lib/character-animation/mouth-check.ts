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

const clock = (seconds: number) => {
  const cs = Math.round(seconds * 100)
  const h = Math.floor(cs / 360000)
  const m = Math.floor((cs % 360000) / 6000)
  const s = Math.floor((cs % 6000) / 100)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`
}

/** Subtitles (ASS) with each speaking member's current shape: big letter, the sounds it is for. */
export function mouthCheckSubtitles(mouthBy: string[], names: string[], fps: number, width: number, height: number): string {
  const size = Math.round(height * 0.045)
  const lines = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Shape,DejaVu Sans,${size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,3,2,0,7,40,40,40,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]
  mouthBy.forEach((letters, m) => {
    if (!/[^X]/.test(letters)) return
    const top = Math.round(height * 0.04 + m * size * 1.6)
    let from = 0
    for (let f = 1; f <= letters.length; f++) {
      if (f < letters.length && letters[f] === letters[from]) continue
      const shape = letters[from]
      const text = `${names[m]}  {\\b1}${shape}{\\b0}  ${SHAPE_SOUNDS[shape] ?? ''}`
      lines.push(`Dialogue: 0,${clock(from / fps)},${clock(f / fps)},Shape,,0,0,${top},,{\\pos(40,${top})}${text}`)
      from = f
    }
  })
  return `${lines.join('\n')}\n`
}

/** The close-up clip with the voice, the shape letters and the waveform strip, as one video. */
export async function finishMouthCheck(o: { clip: string; audio: string; subtitles: string; outPath: string; width: number; height: number }) {
  const ass = path.join(path.dirname(o.outPath), 'mouth-check.ass')
  fs.writeFileSync(ass, o.subtitles)
  const wave = `${o.width}x${Math.round(o.height * 0.12)}`
  // Paths inside a filter graph need ':' and '\' escaped.
  const assArg = ass.replace(/\\/g, '/').replace(/:/g, '\\:')
  const filter = [
    `[1:a]showwaves=s=${wave}:mode=cline:rate=30:colors=0x7fe3d6,format=rgba,colorchannelmixer=aa=0.85[w]`,
    `[0:v]scale=${o.width}:${o.height}[v0]`,
    `[v0][w]overlay=0:H-h-${Math.round(o.height * 0.03)}:shortest=1[v1]`,
    `[v1]ass='${assArg}'[v]`,
  ].join(';')
  await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', o.clip, '-i', o.audio, '-filter_complex', filter, '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', o.outPath])
  return o.outPath
}
