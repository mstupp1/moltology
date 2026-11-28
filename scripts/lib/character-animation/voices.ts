/**
 * The soundtrack of a lesson: each run of lines by one speaker is voiced in that speaker's own Fish
 * voice (the narrator's, or a character's from content/characters/cast.json), then the takes are
 * joined with a short pause between speakers. Returns the joined audio, word timings on the joined
 * clock, and a speech level per frame for each cast member, so only the speaker's mouth moves.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { WordBoundaryEvent } from '../tts-engine'
import { castOf, estimateWords, loadCast, NARRATOR, speakerOf, talkFromWords, type ClipWindowMap, type Lesson, type SourceClip } from './lesson'
import { talkFromAudio } from './talk'
import { emphasisFrames, LEAD_FRAMES, mouthForTake } from './lipsync'
import { silentAudio } from './compose'

const execFileAsync = promisify(execFile)
/** Pause between one speaker and the next, in seconds. */
export const TURN_GAP = 0.35

export type Segment =
  | {
      kind: 'speech'
      speaker: string
      voice: string
      text: string
      scenes: number[]
    }
  | {
      kind: 'clip'
      speaker: string
      voice: string
      text: string
      sceneIndex: number
      sourceClip: SourceClip
      scenes: [number]
    }

/** Consecutive spoken scenes by the same speaker, split around any third-party source clips. */
export function segmentsOf(lesson: Lesson, narratorVoice: string, cast = loadCast()): Segment[] {
  const out: Segment[] = []
  lesson.scenes.forEach((scene, i) => {
    if (scene.sourceClip) {
      out.push({
        kind: 'clip',
        speaker: NARRATOR,
        voice: '',
        text: '',
        sceneIndex: i,
        sourceClip: scene.sourceClip,
        scenes: [i],
      })
      return
    }
    const speaker = speakerOf(lesson, scene)
    const voice = speaker === NARRATOR ? narratorVoice : (cast[speaker]?.voice ?? narratorVoice)
    const last = out[out.length - 1]
    if (last && last.kind === 'speech' && last.speaker === speaker) {
      last.text = `${last.text} ${scene.line.trim()}`
      last.scenes.push(i)
    } else out.push({ kind: 'speech', speaker, voice, text: scene.line.trim(), scenes: [i] })
  })
  return out
}

async function duration(file: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file])
  return parseFloat(stdout.trim())
}

/** Joins takes and clip audio with per-transition gaps. */
async function joinTakes(files: string[], outPath: string, gaps: number[]): Promise<void> {
  if (files.length === 1) {
    fs.copyFileSync(files[0], outPath)
    return
  }
  const inputs = files.flatMap((f) => ['-i', f])
  const chain = files.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono${i < files.length - 1 && (gaps[i] ?? 0) > 0 ? `,apad=pad_dur=${gaps[i]}` : ''}[a${i}]`)
  const filter = `${chain.join(';')};${files.map((_, i) => `[a${i}]`).join('')}concat=n=${files.length}:v=0:a=1[out]`
  await execFileAsync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-q:a', '2', outPath])
}

export interface LessonVoice {
  audio: string
  words: WordBoundaryEvent[]
  /** Speech level per frame for each cast member, in cast order. */
  talkBy: number[][]
  /** Cartoon mouth shape per frame (one letter each) for each cast member, in cast order. */
  mouthBy: string[]
  /** How strongly each frame's word is said (0..1) and accent pulses on the strongest, in cast order. */
  emphasisBy: number[][]
  accentBy: number[][]
  /** Exact timeline windows for any `sourceClip` scenes, indexed by scene number. */
  clipWindows?: ClipWindowMap
}

export async function voiceLesson(
  lesson: Lesson,
  outDir: string,
  options: { silent: boolean; fps: number; narratorVoice: string; rate?: string; turnGap?: number; lessonDir?: string }
): Promise<LessonVoice> {
  const turnGap = options.turnGap ?? TURN_GAP
  const cast = castOf(lesson)
  const segments = segmentsOf(lesson, options.narratorVoice)
  const dir = path.join(outDir, 'voice')
  fs.mkdirSync(dir, { recursive: true })
  const takes: { file?: string; words: WordBoundaryEvent[]; seconds: number }[] = []
  for (const [k, seg] of segments.entries()) {
    if (seg.kind === 'clip') {
      if (options.silent) {
        takes.push({ words: [], seconds: seg.sourceClip.duration })
        continue
      }
      const cwdPath = path.resolve(process.cwd(), seg.sourceClip.path)
      const relPath = path.resolve(options.lessonDir ?? process.cwd(), seg.sourceClip.path)
      const srcPath = fs.existsSync(cwdPath) ? cwdPath : relPath
      if (!fs.existsSync(srcPath)) throw new Error(`Source clip not found: ${cwdPath} (or ${relPath})`)
      const mtimeMs = fs.statSync(srcPath).mtimeMs
      const key = crypto
        .createHash('sha1')
        .update(JSON.stringify(['fade-v1', srcPath, mtimeMs, seg.sourceClip.start, seg.sourceClip.duration, seg.sourceClip.volume ?? 1]))
        .digest('hex')
        .slice(0, 12)
      const file = path.join(dir, `clip-${key}.mp3`)
      if (!fs.existsSync(file)) {
        const vol = seg.sourceClip.volume !== undefined && seg.sourceClip.volume !== 1 ? `,volume=${seg.sourceClip.volume}` : ''
        const clipDur = seg.sourceClip.duration
        const fadeOutStart = Math.max(0, clipDur - 0.18)
        console.log(`🎬 Take ${k + 1}/${segments.length}: sourceClip (${seg.sourceClip.attribution})`)
        await execFileAsync('ffmpeg', [
          '-v', 'error', '-y',
          '-ss', seg.sourceClip.start.toFixed(3),
          '-t', clipDur.toFixed(3),
          '-i', srcPath,
          '-vn',
          '-af',
          `aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono,loudnorm=I=-16:TP=-1.5:LRA=11${vol},atrim=0:${clipDur.toFixed(3)},afade=t=in:st=0:d=0.05:curve=qsin,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.18:curve=qsin`,
          '-c:a', 'libmp3lame', '-q:a', '2',
          file,
        ])
      } else console.log(`🎬 Take ${k + 1}/${segments.length}: sourceClip (reused)`)
      takes.push({ file, words: [], seconds: await duration(file) })
      continue
    }
    if (options.silent) {
      const words = estimateWords(seg.text, 2.6 * 1.12)
      takes.push({ words, seconds: (words[words.length - 1]?.endMs ?? 0) / 1000 + 0.2 })
      continue
    }
    // Each take is cached by its words, voice and pace, so editing one line re-voices only that take.
    const key = crypto.createHash('sha1').update(JSON.stringify([seg.text, seg.voice, options.rate ?? '+12%'])).digest('hex').slice(0, 12)
    const file = path.join(dir, `take-${key}.mp3`)
    const wordsFile = path.join(dir, `take-${key}.json`)
    if (!fs.existsSync(file) || !fs.existsSync(wordsFile)) {
      const { generateVoiceover } = await import('../tts-engine')
      console.log(`🎙️  Take ${k + 1}/${segments.length}: ${seg.speaker} (${seg.voice})`)
      const result = await generateVoiceover(seg.text, { voice: seg.voice, rate: options.rate ?? '+12%', outputDir: dir, outputFilename: `take-${key}.mp3` })
      if (path.resolve(result.audioPath) !== path.resolve(file)) fs.copyFileSync(result.audioPath, file)
      fs.writeFileSync(wordsFile, JSON.stringify({ text: seg.text, voice: seg.voice, provider: result.providerUsed, words: result.words }, null, 2))
    } else console.log(`🎙️  Take ${k + 1}/${segments.length}: ${seg.speaker} (reused)`)
    takes.push({ file, words: JSON.parse(fs.readFileSync(wordsFile, 'utf8')).words, seconds: await duration(file) })
  }

  const clipGap = Math.min(turnGap, 0.16)
  const gaps = takes.slice(0, -1).map((_, k) =>
    segments[k].kind === 'clip' || segments[k + 1].kind === 'clip' ? clipGap : turnGap
  )

  // Lay the takes end to end on one clock.
  const words: WordBoundaryEvent[] = []
  const offsets: number[] = []
  const clipWindows: ClipWindowMap = {}
  let clock = 0
  takes.forEach((take, k) => {
    offsets.push(clock)
    const seg = segments[k]
    if (seg.kind === 'clip') {
      clipWindows[seg.sceneIndex] = { start: clock, end: clock + take.seconds }
    } else {
      for (const w of take.words) words.push({ ...w, startMs: w.startMs + clock * 1000, endMs: w.endMs + clock * 1000 })
    }
    clock += take.seconds + (k < takes.length - 1 ? gaps[k] : 0)
  })
  const total = clock
  const frames = Math.ceil((total + 1) * options.fps)
  const talkBy = cast.map(() => new Array<number>(frames).fill(0))
  const mouths = cast.map(() => new Array<string>(frames).fill('X'))
  const emphasisBy = cast.map(() => new Array<number>(frames).fill(0.5))
  const accentBy = cast.map(() => new Array<number>(frames).fill(0))
  const sources = new Set<string>()
  for (const [k, seg] of segments.entries()) {
    if (seg.kind === 'clip') continue
    const who = cast.findIndex((c) => c.id === seg.speaker)
    if (who < 0) continue // the narrator has no mouth
    const take = takes[k]
    const level = take.file ? await talkFromAudio(take.file, options.fps) : talkFromWords(take.words, options.fps, Math.ceil(take.seconds * options.fps))
    const at = Math.round(offsets[k] * options.fps)
    level.forEach((v, f) => {
      if (at + f < frames) talkBy[who][at + f] = v
    })
    // The mouth leads the voice by LEAD_FRAMES (lipsync.ts), so each take is laid that much early
    // on the shared clock: its first shapes may land in the gap before its own slot.
    const span = Math.ceil(take.seconds * options.fps)
    const mouth = await mouthForTake({ file: take.file, text: seg.text, words: take.words }, options.fps, span, { lead: 0 })
    sources.add(mouth.source)
    const said = emphasisFrames(take.words, level, options.fps, span, { lead: 0 })
    for (let f = 0; f < span; f++) {
      const g = at + f - LEAD_FRAMES
      if (g < 0 || g >= frames) continue
      // Rest from this take never paints over the end of the line before it.
      if (mouth.frames[f] !== 'X' || f >= LEAD_FRAMES) mouths[who][g] = mouth.frames[f]
      emphasisBy[who][g] = said.size[f]
      accentBy[who][g] = Math.max(accentBy[who][g], said.accent[f])
    }
  }
  if (sources.size) console.log(`👄 Mouth shapes from ${[...sources].map((s) => (s === 'rhubarb' ? 'Rhubarb Lip Sync' : 'the words (guessed)')).join(' and ')}`)

  const audio = path.join(outDir, options.silent ? 'voice-silent.mp3' : 'voice.mp3')
  if (options.silent) await silentAudio(total + 0.1, audio)
  else await joinTakes(takes.map((t) => t.file!), audio, gaps)
  const hasClips = Object.keys(clipWindows).length > 0
  fs.writeFileSync(path.join(outDir, 'words.json'), JSON.stringify({ segments, offsets, words, ...(hasClips ? { clipWindows } : {}) }, null, 2))
  return { audio, words, talkBy, mouthBy: mouths.map((m) => m.join('')), emphasisBy, accentBy, ...(hasClips ? { clipWindows } : {}) }
}
