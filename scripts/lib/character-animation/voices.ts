/**
 * The soundtrack of a lesson: each run of lines by one speaker is voiced in that speaker's own Fish
 * voice (the narrator's, or a character's from content/animation/cast.json), then the takes are
 * joined with a short pause between speakers. Returns the joined audio, word timings on the joined
 * clock, and a speech level per frame for each cast member, so only the speaker's mouth moves.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { WordBoundaryEvent } from '../tts-engine'
import { castOf, estimateWords, loadCast, NARRATOR, speakerOf, talkFromWords, type Lesson } from './lesson'
import { talkFromAudio } from './talk'
import { silentAudio } from './compose'

const execFileAsync = promisify(execFile)
/** Pause between one speaker and the next, in seconds. */
export const TURN_GAP = 0.35

export interface Segment {
  speaker: string
  voice: string
  text: string
  scenes: number[]
}

/** Consecutive scenes by the same speaker, voiced as one take so their delivery flows. */
export function segmentsOf(lesson: Lesson, narratorVoice: string, cast = loadCast()): Segment[] {
  const out: Segment[] = []
  lesson.scenes.forEach((scene, i) => {
    const speaker = speakerOf(lesson, scene)
    const voice = speaker === NARRATOR ? narratorVoice : (cast[speaker]?.voice ?? narratorVoice)
    const last = out[out.length - 1]
    if (last && last.speaker === speaker) {
      last.text = `${last.text} ${scene.line.trim()}`
      last.scenes.push(i)
    } else out.push({ speaker, voice, text: scene.line.trim(), scenes: [i] })
  })
  return out
}

async function duration(file: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file])
  return parseFloat(stdout.trim())
}

/** Joins takes with a pause after each one but the last. */
async function joinTakes(files: string[], outPath: string): Promise<void> {
  if (files.length === 1) {
    fs.copyFileSync(files[0], outPath)
    return
  }
  const inputs = files.flatMap((f) => ['-i', f])
  const chain = files.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono${i < files.length - 1 ? `,apad=pad_dur=${TURN_GAP}` : ''}[a${i}]`)
  const filter = `${chain.join(';')};${files.map((_, i) => `[a${i}]`).join('')}concat=n=${files.length}:v=0:a=1[out]`
  await execFileAsync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-q:a', '2', outPath])
}

export interface LessonVoice {
  audio: string
  words: WordBoundaryEvent[]
  /** Speech level per frame for each cast member, in cast order. */
  talkBy: number[][]
}

export async function voiceLesson(lesson: Lesson, outDir: string, options: { silent: boolean; fps: number; narratorVoice: string; rate?: string }): Promise<LessonVoice> {
  const cast = castOf(lesson)
  const segments = segmentsOf(lesson, options.narratorVoice)
  const dir = path.join(outDir, 'voice')
  fs.mkdirSync(dir, { recursive: true })
  const takes: { file?: string; words: WordBoundaryEvent[]; seconds: number }[] = []
  for (const [k, seg] of segments.entries()) {
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

  // Lay the takes end to end on one clock.
  const words: WordBoundaryEvent[] = []
  const offsets: number[] = []
  let clock = 0
  takes.forEach((take, k) => {
    offsets.push(clock)
    for (const w of take.words) words.push({ ...w, startMs: w.startMs + clock * 1000, endMs: w.endMs + clock * 1000 })
    clock += take.seconds + (k < takes.length - 1 ? TURN_GAP : 0)
  })
  const total = clock
  const frames = Math.ceil((total + 1) * options.fps)
  const talkBy = cast.map(() => new Array<number>(frames).fill(0))
  for (const [k, seg] of segments.entries()) {
    const who = cast.findIndex((c) => c.id === seg.speaker)
    if (who < 0) continue // the narrator has no mouth
    const take = takes[k]
    const level = take.file ? await talkFromAudio(take.file, options.fps) : talkFromWords(take.words, options.fps, Math.ceil(take.seconds * options.fps))
    const at = Math.round(offsets[k] * options.fps)
    level.forEach((v, f) => {
      if (at + f < frames) talkBy[who][at + f] = v
    })
  }

  const audio = path.join(outDir, options.silent ? 'voice-silent.mp3' : 'voice.mp3')
  if (options.silent) await silentAudio(total + 0.1, audio)
  else await joinTakes(takes.map((t) => t.file!), audio)
  fs.writeFileSync(path.join(outDir, 'words.json'), JSON.stringify({ segments, offsets, words }, null, 2))
  return { audio, words, talkBy }
}
