import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  formatAssTime,
  formatSrtTime,
  chunkWordsIntoPhrases,
  alignWordsWithOriginalText,
  generateVoiceover,
  type WordBoundaryEvent,
} from './tts-engine'
import {
  parseEdgeRate,
  parseFishSseStream,
  segmentsToWordBoundaries,
  buildGlobalTimeline,
} from './tts-providers/fish-audio'

describe('TTS Engine Utilities', () => {
  it('correctly formats ASS timestamps', () => {
    expect(formatAssTime(0)).toBe('0:00:00.00')
    expect(formatAssTime(1250)).toBe('0:00:01.25')
    expect(formatAssTime(65430)).toBe('0:01:05.43')
    expect(formatAssTime(3661200)).toBe('1:01:01.20')
  })

  it('correctly formats SRT timestamps', () => {
    expect(formatSrtTime(0)).toBe('00:00:00,000')
    expect(formatSrtTime(1250)).toBe('00:00:01,250')
    expect(formatSrtTime(65430)).toBe('00:01:05,430')
    expect(formatSrtTime(3661200)).toBe('01:01:01,200')
  })

  it('aligns raw TTS tokens with original script text to preserve punctuation and sentence ends', () => {
    const rawTtsWords: WordBoundaryEvent[] = [
      { word: 'Execution', startMs: 100, endMs: 700, durationMs: 600 },
      { word: 'without', startMs: 710, endMs: 1100, durationMs: 390 },
      { word: 'grip', startMs: 1110, endMs: 1350, durationMs: 240 },
      { word: 'is', startMs: 1360, endMs: 1500, durationMs: 140 },
      { word: 'meaningless', startMs: 1510, endMs: 2200, durationMs: 690 },
      { word: 'Moltmaxxing', startMs: 3000, endMs: 3600, durationMs: 600 },
      { word: 'builds', startMs: 3610, endMs: 4000, durationMs: 390 },
      { word: 'armor', startMs: 4010, endMs: 4500, durationMs: 490 },
    ]

    const script = 'Execution without grip is meaningless. Moltmaxxing builds armor.'
    const aligned = alignWordsWithOriginalText(rawTtsWords, script)

    expect(aligned[4].word).toBe('meaningless.')
    expect(aligned[4].isSentenceEnd).toBe(true)
    expect(aligned[5].word).toBe('Moltmaxxing')
    expect(aligned[5].isSentenceEnd).toBe(false)
    expect(aligned[7].word).toBe('armor.')
    expect(aligned[7].isSentenceEnd).toBe(true)
  })

  it('strictly isolates sentences so chunks NEVER bridge sentence boundaries', () => {
    const rawTtsWords: WordBoundaryEvent[] = [
      { word: 'Execution', startMs: 100, endMs: 700, durationMs: 600 },
      { word: 'without', startMs: 710, endMs: 1100, durationMs: 390 },
      { word: 'grip', startMs: 1110, endMs: 1350, durationMs: 240 },
      { word: 'is', startMs: 1360, endMs: 1500, durationMs: 140 },
      { word: 'meaningless', startMs: 1510, endMs: 2200, durationMs: 690 },
      { word: 'Moltmaxxing', startMs: 3000, endMs: 3600, durationMs: 600 },
      { word: 'builds', startMs: 3610, endMs: 4000, durationMs: 390 },
      { word: 'armor', startMs: 4010, endMs: 4500, durationMs: 490 },
    ]

    const script = 'Execution without grip is meaningless. Moltmaxxing builds armor.'
    const aligned = alignWordsWithOriginalText(rawTtsWords, script)
    const chunks = chunkWordsIntoPhrases(aligned, 3)

    expect(chunks.length).toBe(3)
    expect(chunks[0].map((w) => w.word)).toEqual(['Execution', 'without', 'grip'])
    expect(chunks[1].map((w) => w.word)).toEqual(['is', 'meaningless.'])
    expect(chunks[2].map((w) => w.word)).toEqual(['Moltmaxxing', 'builds', 'armor.'])

    const chunkWithMeaningless = chunks.find((c) => c.some((w) => w.word.includes('meaningless')))
    expect(chunkWithMeaningless?.some((w) => w.word.includes('Moltmaxxing'))).toBe(false)
  })

  it('balances chunks nicely for 4-word, 5-word, and 6-word sentences', () => {
    const fourWords: WordBoundaryEvent[] = [
      { word: 'Take', startMs: 0, endMs: 200, durationMs: 200 },
      { word: 'the', startMs: 200, endMs: 400, durationMs: 200 },
      { word: 'clearance', startMs: 400, endMs: 700, durationMs: 300 },
      { word: 'quiz.', startMs: 700, endMs: 1000, durationMs: 300, isSentenceEnd: true },
    ]
    const chunks4 = chunkWordsIntoPhrases(fourWords, 3)
    expect(chunks4.length).toBe(2)
    expect(chunks4[0].map((w) => w.word)).toEqual(['Take', 'the'])
    expect(chunks4[1].map((w) => w.word)).toEqual(['clearance', 'quiz.'])

    const sixWords: WordBoundaryEvent[] = [
      { word: 'Frontier', startMs: 0, endMs: 200, durationMs: 200 },
      { word: 'reasoning', startMs: 200, endMs: 400, durationMs: 200 },
      { word: 'models', startMs: 400, endMs: 600, durationMs: 200 },
      { word: 'shed', startMs: 600, endMs: 800, durationMs: 200 },
      { word: 'fragile', startMs: 800, endMs: 1000, durationMs: 200 },
      { word: 'carapaces.', startMs: 1000, endMs: 1200, durationMs: 200, isSentenceEnd: true },
    ]
    const chunks6 = chunkWordsIntoPhrases(sixWords, 3)
    expect(chunks6.length).toBe(2)
    expect(chunks6[0].map((w) => w.word)).toEqual(['Frontier', 'reasoning', 'models'])
    expect(chunks6[1].map((w) => w.word)).toEqual(['shed', 'fragile', 'carapaces.'])
  })
})

describe('Fish Audio provider helpers', () => {
  it('parses Edge rate strings into Fish prosody speed', () => {
    expect(parseEdgeRate('+12%')).toBe(1.12)
    expect(parseEdgeRate('+8%')).toBe(1.08)
    expect(parseEdgeRate('-5%')).toBe(0.95)
    expect(parseEdgeRate(undefined, 1.1)).toBe(1.1)
    expect(parseEdgeRate('invalid')).toBe(1.08)
    expect(parseEdgeRate('+150%')).toBe(2)
    expect(parseEdgeRate('-60%')).toBe(0.5)
  })

  it('parses Fish SSE stream into audio and alignment snapshots', () => {
    const audioPayload = Buffer.from('fake-mp3-bytes').toString('base64')
    const sseBody = [
      'data: {"audio_base64":"' + audioPayload + '","chunk_seq":0,"chunk_audio_offset_sec":0,"alignment":{"segments":[{"text":"Hello world","start":0,"end":0.86}]}}',
      '',
      'data: {"audio_base64":"' + audioPayload + '","chunk_seq":0,"chunk_audio_offset_sec":0,"alignment":{"segments":[{"text":"Hello","start":0,"end":0.42},{"text":"world","start":0.42,"end":0.86}]}}',
      '',
    ].join('\n')

    const { audio, alignmentByChunk } = parseFishSseStream(sseBody)
    expect(audio.toString()).toBe('fake-mp3-bytesfake-mp3-bytes')

    const timeline = buildGlobalTimeline(alignmentByChunk)
    expect(timeline).toHaveLength(2)
    expect(timeline[0].text).toBe('Hello')
    expect(timeline[0].globalStartSec).toBeCloseTo(0)
    expect(timeline[1].text).toBe('world')
    expect(timeline[1].globalEndSec).toBeCloseTo(0.86)
  })

  it('splits phrase-level segments into per-word boundaries', () => {
    const timeline = buildGlobalTimeline(
      new Map([
        [
          0,
          {
            offsetSec: 0,
            alignment: {
              segments: [{ text: 'Take the quiz', start: 0, end: 1.2 }],
            },
          },
        ],
      ])
    )

    const words = segmentsToWordBoundaries(timeline)
    expect(words).toHaveLength(3)
    expect(words[0].word).toBe('Take')
    expect(words[1].word).toBe('the')
    expect(words[2].word).toBe('quiz')
    expect(words[0].startMs).toBe(0)
    expect(words[2].endMs).toBe(1200)
  })
})

describe('generateVoiceover provider routing', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-router-'))

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses Edge when TTS_PROVIDER=edge', async () => {
    vi.stubEnv('TTS_PROVIDER', 'edge')

    const edgeModule = await import('./tts-providers/edge')
    const fishModule = await import('./tts-providers/fish-audio')

    const edgeSpy = vi.spyOn(edgeModule.edgeProvider, 'synthesize').mockResolvedValue({
      audioPath: path.join(tmpDir, 'edge.mp3'),
      durationSeconds: 2,
      words: [{ word: 'hello', startMs: 0, endMs: 500, durationMs: 500 }],
    })
    const fishSpy = vi.spyOn(fishModule.fishProvider, 'synthesize')

    const result = await generateVoiceover('hello', {
      outputDir: tmpDir,
      provider: 'edge',
    })

    expect(result.providerUsed).toBe('edge')
    expect(edgeSpy).toHaveBeenCalledOnce()
    expect(fishSpy).not.toHaveBeenCalled()
  })

  it('falls back to Edge when Fish throws in auto mode', async () => {
    vi.stubEnv('TTS_PROVIDER', 'auto')
    vi.stubEnv('FISH_API_KEY', 'test-key')

    const edgeModule = await import('./tts-providers/edge')
    const fishModule = await import('./tts-providers/fish-audio')

    vi.spyOn(fishModule, 'isFishConfigured').mockReturnValue(true)
    vi.spyOn(fishModule.fishProvider, 'synthesize').mockRejectedValue(new Error('Fish API down'))
    vi.spyOn(edgeModule.edgeProvider, 'synthesize').mockResolvedValue({
      audioPath: path.join(tmpDir, 'edge-fallback.mp3'),
      durationSeconds: 3,
      words: [{ word: 'fallback', startMs: 0, endMs: 600, durationMs: 600 }],
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await generateVoiceover('fallback test', {
      outputDir: tmpDir,
      provider: 'auto',
    })

    expect(result.providerUsed).toBe('edge')
    expect(warnSpy).toHaveBeenCalled()
    expect(result.words[0].word).toBe('fallback')
  })
})
