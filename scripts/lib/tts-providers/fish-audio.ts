import fs from 'node:fs'
import path from 'node:path'
import { alignWordsWithOriginalText, type WordBoundaryEvent } from '../tts-engine'
import { timeStretchMp3 } from '../time-stretch'
import type { ProviderGenerationOptions, ProviderGenerationResult, TTSProvider } from './types'

/** Fish Audio Voice Library preset — English male broadcaster (overridable via env). */
export const DEFAULT_FISH_VOICE_REFERENCE_ID = '9a9cf47702da476aa4629e2506d4a857'

/**
 * Curated Fish Audio voice catalog, selectable by name via `voice` on the TTS
 * options (or `--voice <name>` on the reel scripts). The default — and the
 * current FISH_VOICE_REFERENCE_ID in .env — is Ethan.
 */
export const FISH_VOICE_CATALOG = {
  Ethan: '536d3a5e000945adb7038665781a4aca',
  Mommy: '5233336f5f44460ea0902b0802375451',
  'Just Many': '52a238a0e70c4e589bd41561d26e7a08',
  'Twilight Sparkle': 'aaf2e6c3410d40d0b3d4bd9c242e5486',
  'Young Creative Voice': '08b7e97e3dcb46daa0c3d9fbff48ab83',
  'Friendly Young Woman': '30161b23154c4d2ab4c629aa8c9e415a',
  Laura: 'e3cd384158934cc9a01029cd7d278634',
  'BOOK RECORD REGULAR': 'f8dfe9c83081432386f143e2fe9767ef',
  'Friendly Young Female': '1b1286fcf2f44d8ba1405e0b71abca22',
} as const

export type FishVoiceName = keyof typeof FISH_VOICE_CATALOG

export const FISH_TTS_STREAM_URL = 'https://api.fish.audio/v1/tts/stream/with-timestamp'

interface FishAlignmentSegment {
  text: string
  start: number
  end: number
}

interface FishAlignmentSnapshot {
  audio_duration?: number
  segments: FishAlignmentSegment[]
}

interface FishStreamEvent {
  audio_base64?: string
  content?: string
  alignment?: FishAlignmentSnapshot | null
  chunk_seq?: number
  chunk_audio_offset_sec?: number
}

/**
 * Parse Edge-style rate strings (e.g. "+12%", "-5%") into Fish prosody speed (0.5–2.0).
 */
export function parseEdgeRate(rate?: string, fallback = 1.08): number {
  if (!rate) return fallback

  const match = rate.trim().match(/^([+-]?\d+(?:\.\d+)?)%$/)
  if (!match) return fallback

  const percent = Number.parseFloat(match[1])
  if (Number.isNaN(percent)) return fallback

  const speed = 1 + percent / 100
  return Math.min(2, Math.max(0.5, speed))
}

/**
 * Split phrase-level alignment segments into per-word boundary events with linear interpolation.
 */
export function segmentsToWordBoundaries(
  segments: Array<FishAlignmentSegment & { globalStartSec: number; globalEndSec: number }>
): WordBoundaryEvent[] {
  const words: WordBoundaryEvent[] = []

  for (const segment of segments) {
    const tokens = segment.text.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) continue

    const segmentStartMs = Math.round(segment.globalStartSec * 1000)
    const segmentEndMs = Math.round(segment.globalEndSec * 1000)
    const segmentDurationMs = Math.max(1, segmentEndMs - segmentStartMs)

    if (tokens.length === 1) {
      words.push({
        word: tokens[0],
        startMs: segmentStartMs,
        endMs: segmentEndMs,
        durationMs: segmentDurationMs,
      })
      continue
    }

    const msPerToken = segmentDurationMs / tokens.length
    for (let i = 0; i < tokens.length; i++) {
      const startMs = Math.round(segmentStartMs + i * msPerToken)
      const endMs = i === tokens.length - 1 ? segmentEndMs : Math.round(segmentStartMs + (i + 1) * msPerToken)
      words.push({
        word: tokens[i],
        startMs,
        endMs,
        durationMs: endMs - startMs,
      })
    }
  }

  return words
}

/**
 * Build a global timeline from Fish SSE alignment snapshots (latest-wins per chunk_seq).
 */
export function buildGlobalTimeline(
  alignmentByChunk: Map<number, { offsetSec: number; alignment: FishAlignmentSnapshot }>
): Array<FishAlignmentSegment & { globalStartSec: number; globalEndSec: number }> {
  const timeline: Array<FishAlignmentSegment & { globalStartSec: number; globalEndSec: number }> = []

  for (const [chunkSeq, item] of [...alignmentByChunk.entries()].sort(([a], [b]) => a - b)) {
    for (const segment of item.alignment.segments) {
      timeline.push({
        text: segment.text,
        start: segment.start,
        end: segment.end,
        globalStartSec: segment.start + item.offsetSec,
        globalEndSec: segment.end + item.offsetSec,
      })
    }
  }

  return timeline
}

/**
 * Parse Fish Audio SSE stream body into audio buffer and alignment snapshots.
 */
export function parseFishSseStream(sseBody: string): {
  audio: Buffer
  alignmentByChunk: Map<number, { offsetSec: number; alignment: FishAlignmentSnapshot }>
} {
  const audioChunks: Buffer[] = []
  const alignmentByChunk = new Map<number, { offsetSec: number; alignment: FishAlignmentSnapshot }>()

  const events = sseBody.split('\n\n').filter((block) => block.trim())

  for (const eventText of events) {
    const dataLine = eventText.split('\n').find((line) => line.startsWith('data: '))
    if (!dataLine) continue

    let event: FishStreamEvent
    try {
      event = JSON.parse(dataLine.slice(6)) as FishStreamEvent
    } catch {
      continue
    }

    if (event.audio_base64) {
      audioChunks.push(Buffer.from(event.audio_base64, 'base64'))
    }

    if (event.alignment != null && event.chunk_seq != null) {
      alignmentByChunk.set(event.chunk_seq, {
        offsetSec: event.chunk_audio_offset_sec ?? 0,
        alignment: event.alignment,
      })
    }
  }

  return { audio: Buffer.concat(audioChunks), alignmentByChunk }
}

export function resolveFishConfig(options: ProviderGenerationOptions): {
  apiKey: string
  referenceId: string
  model: string
} {
  const apiKey = process.env.FISH_API_KEY || process.env.FISH_AUDIO_API_KEY || ''
  const referenceId =
    options.referenceId ||
    (options.voice ? FISH_VOICE_CATALOG[options.voice as FishVoiceName] : undefined) ||
    process.env.FISH_VOICE_REFERENCE_ID ||
    DEFAULT_FISH_VOICE_REFERENCE_ID
  const model = options.model || process.env.FISH_TTS_MODEL || 's2.1-pro'

  return { apiKey, referenceId, model }
}

export function isFishConfigured(options: ProviderGenerationOptions = { outputDir: '' }): boolean {
  const { apiKey, referenceId } = resolveFishConfig(options)
  return Boolean(apiKey && referenceId)
}

export async function synthesizeWithFish(
  text: string,
  options: ProviderGenerationOptions
): Promise<ProviderGenerationResult> {
  const { apiKey, referenceId, model } = resolveFishConfig(options)

  if (!apiKey) {
    throw new Error('FISH_API_KEY is not set')
  }
  if (!referenceId) {
    throw new Error('FISH_VOICE_REFERENCE_ID is not set')
  }

  const speed = parseEdgeRate(options.rate, 1)
  const timestamp = Date.now()

  // Use the streaming /v1/tts/stream/with-timestamp endpoint. Always synthesize
  // at normal speed (1.0) for full site-quality audio with real word-boundary
  // alignment. If a faster pacing was requested (rate), apply a high-quality
  // Rubber Band time-stretch afterwards instead of Fish's prosody speed, which
  // preserves audio quality.
  const response = await fetch(FISH_TTS_STREAM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      model,
    },
    body: JSON.stringify({
      text,
      reference_id: referenceId,
      format: 'mp3',
      sample_rate: 44100,
      mp3_bitrate: 128,
      latency: 'normal',
      prosody: { speed: 1, volume: 0, normalize_loudness: true },
      temperature: 0.7,
      top_p: 0.7,
      repetition_penalty: 1.2,
      chunk_length: 300,
      min_chunk_length: 50,
      normalize: true,
      max_new_tokens: 1024,
      condition_on_previous_chunks: true,
      early_stop_threshold: 1,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Fish Audio TTS failed (${response.status}): ${errorBody.slice(0, 300)}`)
  }

  const sseBody = await response.text()
  const { audio, alignmentByChunk } = parseFishSseStream(sseBody)

  if (audio.length === 0) {
    throw new Error('Fish Audio TTS returned empty audio')
  }

  const timeline = buildGlobalTimeline(alignmentByChunk)
  if (timeline.length === 0) {
    throw new Error('Fish Audio TTS returned no alignment segments')
  }

  let words = segmentsToWordBoundaries(timeline)
  words = alignWordsWithOriginalText(words, text)

  let durationSeconds = 0
  if (words.length > 0) {
    durationSeconds = (words[words.length - 1].endMs + 300) / 1000
  }

  const finalAudioPath = options.outputFilename
    ? path.join(options.outputDir, options.outputFilename)
    : path.join(options.outputDir, `voiceover-fish-${timestamp}.mp3`)

  if (speed !== 1) {
    // Rubber Band time-stretch to target pacing, keeping pitch/formants clean.
    const durationRatio = 1 / speed
    await timeStretchMp3(audio, finalAudioPath, durationRatio)
    words = words.map((w) => ({
      ...w,
      startMs: Math.round(w.startMs * durationRatio),
      endMs: Math.round(w.endMs * durationRatio),
      durationMs: Math.round(w.durationMs * durationRatio),
    }))
    durationSeconds = durationSeconds * durationRatio
  } else {
    fs.writeFileSync(finalAudioPath, audio)
  }

  return { audioPath: finalAudioPath, durationSeconds, words }
}

export const fishProvider: TTSProvider = {
  name: 'fish',
  synthesize: synthesizeWithFish,
}
