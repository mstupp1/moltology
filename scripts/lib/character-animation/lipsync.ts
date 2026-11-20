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

/**
 * How many frames the mouth runs ahead of the voice. Animators lead the sound by a frame or two:
 * the eye reads a mouth that is exactly on the sound as late, one a touch early as in sync.
 */
export const LEAD_FRAMES = 2

/**
 * Shapes the eye needs to catch or the word looks wrong: lips meeting (M, B, P), top teeth on the
 * lip (F, V) and the pucker (OO, W). They always get a frame, two when the sounds around them can
 * spare it, however short the sound itself is.
 */
const KEY_SHAPES: Partial<Record<string, number>> = { A: 2, G: 2, F: 2 }

interface Run {
  shape: string
  from: number
  to: number
}

/**
 * One letter per frame from timed cues; anything not covered is rest (X). The cues move `lead`
 * frames earlier, snap to whole frames, and are then tidied so each frame reads: a lip close, F or
 * pucker never rounds away, and any other shape that would flash for one frame between two others
 * holds the one before instead.
 */
export function framesFromCues(cues: MouthCue[], fps: number, frames: number, options: { lead?: number } = {}): string {
  const lead = options.lead ?? LEAD_FRAMES
  // Cues on whole frames, in order, with the gaps between them filled with rest.
  const runs: Run[] = []
  let at = Number.NEGATIVE_INFINITY
  for (const cue of [...cues].sort((a, b) => a.start - b.start)) {
    let from = Math.round(cue.start * fps) - lead
    const to = Math.round(cue.end * fps) - lead
    if (from < at) from = at
    if (from > at && runs.length) runs.push({ shape: 'X', from: at, to: from })
    if (to < from) continue
    runs.push({ shape: cue.value, from, to })
    at = to
  }
  const len = (r: Run) => r.to - r.from
  const least = (r: Run) => KEY_SHAPES[r.shape] ?? 1
  /** Frames a run can give up and still read. */
  const spare = (r: Run | undefined) => (r ? len(r) - least(r) : 0)

  // A key shape takes the frames it needs from whichever side can spare more (usually a vowel).
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i]
    const need = KEY_SHAPES[r.shape]
    if (!need) continue
    while (len(r) < need) {
      const prev = runs[i - 1]
      const next = runs[i + 1]
      const fromPrev = spare(prev) >= spare(next)
      if (Math.max(spare(prev), spare(next)) > 0) {
        if (fromPrev) prev.to = --r.from
        else next.from = ++r.to
      } else if (len(r) === 0) {
        // Nothing to spare: the close still shows for one frame, taken from the longer side.
        const side = (prev ? len(prev) : 0) >= (next ? len(next) : 0) ? prev : next
        if (!side || len(side) === 0) break
        if (side === prev) prev.to = --r.from
        else next.from = ++r.to
      } else break
    }
  }

  const out = new Array<string>(frames).fill('X')
  const kept = runs.filter((r) => len(r) > 0)
  for (const [i, r] of kept.entries()) {
    // Any other shape that would flash for a single frame between two ordinary spoken ones is a
    // flicker: the shape before holds through it. Next to a key shape it stays, since it is the
    // only opening between two closes ("mama").
    const prev = kept[i - 1]
    const next = kept[i + 1]
    const plain = (n: Run | undefined) => n && n.shape !== 'X' && !KEY_SHAPES[n.shape]
    const shape = len(r) === 1 && !KEY_SHAPES[r.shape] && plain(prev) && plain(next) && r.from > 0 ? out[r.from - 1] : r.shape
    for (let f = Math.max(0, r.from); f < Math.min(frames, r.to); f++) out[f] = shape
  }
  return out.join('')
}

/** Little words that never carry the stress of a line, however long the voice holds them. */
const LIGHT_WORDS = new Set(
  'a an the and or but so of to in on at by for with from as is are was were be been am it its this that these those i you he she we they me him her us them my your our their do does did has have had not if then than just very really because through without would could should will can about into'.split(' '),
)

/**
 * How strongly each word is said, 0..1 (0.5 ordinary), and a short accent pulse on the strongest
 * ones, per video frame (led like the mouth). Loudness against the take's typical word decides
 * most of it; the words themselves the rest (little words stay light, long words and numbers carry
 * weight, an exclamation lifts), so a silent test still has a shape to it.
 */
export function emphasisFrames(words: WordBoundaryEvent[], level: number[], fps: number, frames: number, options: { lead?: number } = {}): { size: number[]; accent: number[] } {
  const lead = options.lead ?? LEAD_FRAMES
  const size = new Array<number>(frames).fill(0.5)
  const accent = new Array<number>(frames).fill(0)
  if (!words.length) return { size, accent }
  const spans = words.map((w) => {
    const from = Math.max(0, Math.round((w.startMs / 1000) * fps))
    const to = Math.max(from + 1, Math.round((w.endMs / 1000) * fps))
    let peak = 0
    let at = from
    for (let f = from; f < to && f < level.length; f++) if (level[f] > peak) [peak, at] = [level[f], f]
    return { w, from, to, peak, at }
  })
  const peaks = spans.map((s) => s.peak).filter((p) => p > 0).sort((a, b) => a - b)
  const typical = peaks.length ? peaks[Math.floor(peaks.length / 2)] : 0
  const scores = spans.map(({ w, peak }) => {
    const plain = w.word.toLowerCase().replace(/[^a-z0-9]/g, '')
    const loud = typical > 0 ? Math.min(1, Math.max(0, 0.5 + 1.1 * (peak / typical - 1))) : 0.5
    let said = LIGHT_WORDS.has(plain) ? 0.2 : /\d/.test(plain) || plain.length >= 7 ? 0.75 : plain.length >= 4 ? 0.55 : 0.4
    if (/!/.test(w.word)) said = Math.min(1, said + 0.25)
    return 0.6 * loud + 0.4 * said
  })
  // Size: each word's own, held across the little gaps between words until the next one starts.
  spans.forEach((s, k) => {
    const end = k + 1 < spans.length ? spans[k + 1].from : s.to + 3
    for (let f = s.from - lead; f < end - lead; f++) if (f >= 0 && f < frames) size[f] = Math.round(scores[k] * 100) / 100
  })
  // Accents: the strongest words, no closer than about two thirds of a second, peak on the loudest frame.
  let last = Number.NEGATIVE_INFINITY
  spans.forEach((s, k) => {
    if (scores[k] < 0.68 || s.at - last < fps * 0.65) return
    last = s.at
    const strength = Math.min(1, (scores[k] - 0.5) * 2.2)
    for (let d = -2; d <= 10; d++) {
      const f = s.at - lead + d
      if (f < 0 || f >= frames) continue
      // Rises over two frames to the hit, then settles over about a third of a second.
      const v = d < 0 ? (d + 3) / 3 : Math.exp(-d / 4)
      accent[f] = Math.max(accent[f], Math.round(strength * v * 100) / 100)
    }
  })
  return { size, accent }
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

/** How each key shape is spelled: lips meeting (M, B, P) and teeth on the lip (F, V, PH). */
const SPELT: Partial<Record<MouthShape, RegExp>> = { A: /[mbp]/, G: /f|v|ph/ }

/**
 * Rhubarb now and then hears a lip close or an F where the script has none (a hard TH, a breath),
 * and shown, that reads as a twitch of a grin mid-word. A key shape is kept only when a word said
 * around it is spelled with one; otherwise it becomes teeth together (B), the shape for most
 * consonants. Cues with no word near them (pauses) are left alone.
 */
export function trustKeyShapes(cues: MouthCue[], words: WordBoundaryEvent[], slack = 0.06): MouthCue[] {
  const out: MouthCue[] = []
  for (const cue of cues) {
    let value = cue.value
    const spelt = SPELT[value]
    if (spelt) {
      const near = words.filter((w) => w.startMs / 1000 - slack < cue.end && w.endMs / 1000 + slack > cue.start)
      if (near.length && !near.some((w) => spelt.test(w.word.toLowerCase()))) value = 'B'
    }
    const last = out[out.length - 1]
    if (last && last.value === value && Math.abs(last.end - cue.start) < 1e-3) last.end = cue.end
    else out.push({ ...cue, value })
  }
  return out
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
export async function mouthForTake(
  take: { file?: string; text: string; words: WordBoundaryEvent[] },
  fps: number,
  frames: number,
  options: { lead?: number } = {},
): Promise<{ frames: string; source: 'rhubarb' | 'words' }> {
  if (take.file) {
    const cache = take.file.replace(/\.[a-z0-9]+$/i, `.mouth-${RHUBARB_VERSION}.json`)
    let cues: MouthCue[] | null = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : null
    if (!cues) {
      cues = await rhubarbCues(take.file, take.text)
      if (cues) fs.writeFileSync(cache, JSON.stringify(cues))
    }
    if (cues) return { frames: framesFromCues(trustKeyShapes(cues, take.words), fps, frames, options), source: 'rhubarb' }
  }
  return { frames: framesFromCues(cuesFromWords(take.words), fps, frames, options), source: 'words' }
}
