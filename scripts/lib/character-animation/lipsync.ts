/**
 * Cartoon mouth shapes for a voice take (src/lib/avatar3d/mouth-shapes.ts), one letter per video
 * frame. Rhubarb Lip Sync (free, offline, MIT; github.com/DanielSWolf/rhubarb-lip-sync) listens to
 * the take with its script and picks the classic animator's shape for every sound. It is fetched
 * once into tmp/tools on first use. Without it (no network, unsupported machine, or a silent test)
 * the shapes are guessed from the words' spelling and timings instead, which still beats a mouth
 * that only opens and shuts.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { WordBoundaryEvent } from '../tts-engine'
import type { MouthShape } from '../../../src/lib/avatar3d/mouth-shapes'

const execFileAsync = promisify(execFile)
export const RHUBARB_VERSION = '1.14.0'
const TOOLS = path.resolve(process.cwd(), 'tmp', 'tools')

export interface MouthCue {
  start: number
  end: number
  value: MouthShape
}

/** One letter per frame from timed cues; anything not covered is rest (X). */
export function framesFromCues(cues: MouthCue[], fps: number, frames: number): string {
  const out = new Array<string>(frames).fill('X')
  for (const cue of cues) {
    const from = Math.max(0, Math.round(cue.start * fps))
    const to = Math.min(frames, Math.round(cue.end * fps))
    for (let f = from; f < to; f++) out[f] = cue.value
  }
  // A shape that would show for a single frame between two others is a flicker; hold the one before.
  for (let f = 1; f < frames - 1; f++) {
    if (out[f] !== out[f - 1] && out[f] !== out[f + 1] && out[f - 1] !== 'X' && out[f + 1] !== 'X') out[f] = out[f - 1]
  }
  return out.join('')
}

/**
 * Letter groups to mouth shapes, longest first, for guessing from spelling. Close enough for a
 * silent test or a fallback: the vowels carry the look, the lip and teeth consonants punctuate it.
 */
const SPELLING: [RegExp, MouthShape][] = [
  [/^(oo|ew|ue|wh|w|qu)/, 'F'],
  [/^(ou|ow|oa|oe|or|aw|au|o)/, 'E'],
  [/^(ph|f|v)/, 'G'],
  [/^(th|sh|ch|ee|ea|ie|s|z|t|d|k|c|g|j|n|r|y|x|h|e|i)/, 'B'],
  [/^(m|b|p)/, 'A'],
  [/^(l)/, 'H'],
  [/^(ai|ay|ei|ey|a)/, 'D'],
  [/^(u)/, 'C'],
]
const VOWEL = /[aeiouy]/

/** Mouth shapes guessed from word spellings spread over each word's timing. */
export function cuesFromWords(words: WordBoundaryEvent[]): MouthCue[] {
  const cues: MouthCue[] = []
  for (const w of words) {
    const letters = w.word.toLowerCase().replace(/[^a-z]/g, '')
    const units: { shape: MouthShape; weight: number }[] = []
    for (let i = 0; i < letters.length; ) {
      const rest = letters.slice(i)
      const hit = SPELLING.find(([re]) => re.test(rest))
      const len = hit ? rest.match(hit[0])![0].length : 1
      const unit = rest.slice(0, len)
      const shape = hit?.[1] ?? 'B'
      // Vowels hold longer than consonants; a silent final e is skipped.
      if (!(unit === 'e' && i + 1 === letters.length && letters.length > 2)) units.push({ shape, weight: VOWEL.test(unit) ? 2 : 1 })
      i += len
    }
    if (!units.length) continue
    const total = units.reduce((s, u) => s + u.weight, 0)
    const span = Math.max(0.05, (w.endMs - w.startMs) / 1000)
    let t = w.startMs / 1000
    for (const u of units) {
      const d = (u.weight / total) * span
      const last = cues[cues.length - 1]
      if (last && last.value === u.shape && Math.abs(last.end - t) < 1e-3) last.end = t + d
      else cues.push({ start: t, end: t + d, value: u.shape })
      t += d
    }
  }
  return cues
}

/** Where a working Rhubarb binary is: RHUBARB_PATH, one fetched before, or a fresh download. */
async function rhubarbBinary(): Promise<string | null> {
  if (process.env.RHUBARB_PATH) return process.env.RHUBARB_PATH
  const platform = process.platform === 'darwin' ? 'macOS' : process.platform === 'linux' ? 'Linux' : process.platform === 'win32' ? 'Windows' : null
  if (!platform) return null
  const name = `Rhubarb-Lip-Sync-${RHUBARB_VERSION}-${platform}`
  const binary = path.join(TOOLS, name, process.platform === 'win32' ? 'rhubarb.exe' : 'rhubarb')
  if (fs.existsSync(binary)) return binary
  const url = `https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v${RHUBARB_VERSION}/${name}.zip`
  console.log(`👄 Fetching Rhubarb Lip Sync ${RHUBARB_VERSION} (one time) into ${path.relative(process.cwd(), TOOLS)}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed (${res.status})`)
  fs.mkdirSync(TOOLS, { recursive: true })
  const zip = path.join(TOOLS, `${name}.zip`)
  fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()))
  await execFileAsync('unzip', ['-q', '-o', zip, '-d', TOOLS])
  fs.rmSync(zip, { force: true })
  if (!fs.existsSync(binary)) throw new Error(`no rhubarb binary in ${name}.zip`)
  fs.chmodSync(binary, 0o755)
  return binary
}

let rhubarb: Promise<string | null> | null = null
let warned = false

/** Rhubarb's cues for one take, or null when it cannot run here (the caller falls back). */
export async function rhubarbCues(audioPath: string, text: string): Promise<MouthCue[] | null> {
  rhubarb ??= rhubarbBinary().catch((e) => {
    console.log(`⚠️  Rhubarb Lip Sync unavailable (${(e as Error).message}); guessing mouth shapes from the words.`)
    warned = true
    return null
  })
  const binary = await rhubarb
  if (!binary) return null
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'lipsync-'))
  try {
    const wav = path.join(work, 'take.wav')
    const dialog = path.join(work, 'dialog.txt')
    await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', audioPath, '-ac', '1', '-ar', '16000', wav])
    fs.writeFileSync(dialog, text)
    const { stdout } = await execFileAsync(binary, ['-q', '-f', 'json', '--extendedShapes', 'GHX', '-d', dialog, wav], { maxBuffer: 64 * 1024 * 1024 })
    const cues = (JSON.parse(stdout).mouthCues ?? []) as MouthCue[]
    return cues
  } catch (e) {
    if (!warned) console.log(`⚠️  Rhubarb Lip Sync failed (${(e as Error).message.split('\n')[0]}); guessing mouth shapes from the words.`)
    warned = true
    return null
  } finally {
    fs.rmSync(work, { recursive: true, force: true })
  }
}

/**
 * Mouth shapes per frame for one take: Rhubarb on the audio when there is audio and it runs,
 * otherwise a guess from the words. Rhubarb's answer is cached beside the take.
 */
export async function mouthForTake(take: { file?: string; text: string; words: WordBoundaryEvent[] }, fps: number, frames: number): Promise<{ frames: string; source: 'rhubarb' | 'words' }> {
  if (take.file) {
    const cache = take.file.replace(/\.[a-z0-9]+$/i, `.mouth-${RHUBARB_VERSION}.json`)
    let cues: MouthCue[] | null = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : null
    if (!cues) {
      cues = await rhubarbCues(take.file, take.text)
      if (cues) fs.writeFileSync(cache, JSON.stringify(cues))
    }
    if (cues) return { frames: framesFromCues(cues, fps, frames), source: 'rhubarb' }
  }
  return { frames: framesFromCues(cuesFromWords(take.words), fps, frames), source: 'words' }
}
