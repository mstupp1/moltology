/**
 * How loud the voice is on each video frame, 0..1, measured from the narration audio. The 3D
 * character opens its mouth with it, so the lips move with the actual voice rather than a guess.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const RATE = 16000

/** Turn mono 16-bit samples into a per-frame speech level. Exported for tests. */
export function talkFromSamples(samples: Int16Array, fps: number, rate = RATE): number[] {
  const per = rate / fps
  const frames = Math.ceil(samples.length / per)
  const rms = new Array<number>(frames).fill(0)
  for (let f = 0; f < frames; f++) {
    const from = Math.floor(f * per)
    const to = Math.min(samples.length, Math.floor((f + 1) * per))
    let sum = 0
    for (let i = from; i < to; i++) sum += (samples[i] / 32768) ** 2
    rms[f] = Math.sqrt(sum / Math.max(1, to - from))
  }
  // Scale so ordinary speech peaks near 1 (the 95th percentile of voiced frames), and treat the
  // quietest part of the range as a closed mouth.
  const voiced = rms.filter((v) => v > 0.01).sort((a, b) => a - b)
  const peak = voiced.length ? voiced[Math.floor(voiced.length * 0.95)] : 1
  const floor = peak * 0.12
  const level = rms.map((v) => Math.min(1, Math.max(0, (v - floor) / Math.max(peak - floor, 1e-6))))
  // Mouths open fast and close a little slower, which reads as speech rather than flicker.
  const out = new Array<number>(frames).fill(0)
  let now = 0
  for (let f = 0; f < frames; f++) {
    const want = level[f]
    now += (want - now) * (want > now ? 0.75 : 0.45)
    out[f] = Math.round(now * 1000) / 1000
  }
  return out
}

export async function talkFromAudio(audioPath: string, fps: number): Promise<number[]> {
  const { stdout } = await execFileAsync('ffmpeg', ['-v', 'error', '-i', audioPath, '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], {
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 512,
  })
  const buffer = stdout as unknown as Buffer
  // Copied out so the samples start on a 2-byte boundary whatever the buffer's offset.
  const bytes = Math.floor(buffer.byteLength / 2) * 2
  const samples = new Int16Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + bytes))
  return talkFromSamples(samples, fps)
}
