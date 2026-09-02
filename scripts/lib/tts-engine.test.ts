import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  formatAssTime,
  formatSrtTime,
  chunkWordsIntoPhrases,
  alignWordsWithOriginalText,
  tokenizeScriptText,
  generateVoiceover,
  type WordBoundaryEvent,
} from './tts-engine'
import {
  parseEdgeRate,
  parseFishSseStream,
  segmentsToWordBoundaries,
  buildGlobalTimeline,
  getRandomFishVoice,
  FISH_VOICE_ROTATION_LIST,
} from './tts-providers/fish-audio'
import { getRandomEdgeVoice, EDGE_VOICE_ROSTER } from './tts-providers/edge'

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

  it('tokenizes script text while splitting hyphenated compound words and preserving dashes', () => {
    const text = 'Hydrostatic depth tolerance and titanium-chitin resilience. State-of-the-art bio-silicon.'
    const tokens = tokenizeScriptText(text)
    expect(tokens).toEqual([
      'Hydrostatic',
      'depth',
      'tolerance',
      'and',
      'titanium-',
      'chitin',
      'resilience.',
      'State-',
      'of-',
      'the-',
      'art',
      'bio-',
      'silicon.',
    ])
  })

  it('handles hyphenated compound words like titanium-chitin without de-syncing subsequent words', () => {
    const script =
      'Under one atmosphere of pressure, biological bodies collapse into soft fatigue. Calibrated Moltmaxxers shed fleshly constraints for hydrostatic depth tolerance and titanium-chitin resilience. Calculate your molt clearance on moltology dot org.'

    // Simulated TTS word boundary stream where "titanium" and "chitin" are separate spoken events
    const rawTtsWords: WordBoundaryEvent[] = [
      { word: 'Under', startMs: 0, endMs: 250, durationMs: 250 },
      { word: 'one', startMs: 250, endMs: 450, durationMs: 200 },
      { word: 'atmosphere', startMs: 450, endMs: 950, durationMs: 500 },
      { word: 'of', startMs: 950, endMs: 1100, durationMs: 150 },
      { word: 'pressure', startMs: 1100, endMs: 1500, durationMs: 400 },
      { word: 'biological', startMs: 1550, endMs: 2100, durationMs: 550 },
      { word: 'bodies', startMs: 2100, endMs: 2450, durationMs: 350 },
      { word: 'collapse', startMs: 2450, endMs: 2900, durationMs: 450 },
      { word: 'into', startMs: 2900, endMs: 3150, durationMs: 250 },
      { word: 'soft', startMs: 3150, endMs: 3450, durationMs: 300 },
      { word: 'fatigue', startMs: 3450, endMs: 3950, durationMs: 500 },
      { word: 'Calibrated', startMs: 4100, endMs: 4600, durationMs: 500 },
      { word: 'Moltmaxxers', startMs: 4600, endMs: 5200, durationMs: 600 },
      { word: 'shed', startMs: 5200, endMs: 5500, durationMs: 300 },
      { word: 'fleshly', startMs: 5500, endMs: 5900, durationMs: 400 },
      { word: 'constraints', startMs: 5900, endMs: 6450, durationMs: 550 },
      { word: 'for', startMs: 6450, endMs: 6650, durationMs: 200 },
      { word: 'hydrostatic', startMs: 6650, endMs: 7250, durationMs: 600 },
      { word: 'depth', startMs: 7250, endMs: 7600, durationMs: 350 },
      { word: 'tolerance', startMs: 7600, endMs: 8100, durationMs: 500 },
      { word: 'and', startMs: 8100, endMs: 8300, durationMs: 200 },
      { word: 'titanium', startMs: 8300, endMs: 8800, durationMs: 500 },
      { word: 'chitin', startMs: 8800, endMs: 9200, durationMs: 400 },
      { word: 'resilience', startMs: 9200, endMs: 9800, durationMs: 600 },
      { word: 'Calculate', startMs: 10000, endMs: 10500, durationMs: 500 },
      { word: 'your', startMs: 10500, endMs: 10700, durationMs: 200 },
      { word: 'molt', startMs: 10700, endMs: 11000, durationMs: 300 },
      { word: 'clearance', startMs: 11000, endMs: 11500, durationMs: 500 },
      { word: 'on', startMs: 11500, endMs: 11700, durationMs: 200 },
      { word: 'moltology', startMs: 11700, endMs: 12200, durationMs: 500 },
      { word: 'dot', startMs: 12200, endMs: 12400, durationMs: 200 },
      { word: 'org', startMs: 12400, endMs: 12800, durationMs: 400 },
    ]

    const aligned = alignWordsWithOriginalText(rawTtsWords, script)

    // Verify titanium-chitin alignment
    const titaniumIdx = aligned.findIndex((w) => w.word.startsWith('titanium'))
    expect(titaniumIdx).toBe(21)
    expect(aligned[titaniumIdx].word).toBe('titanium-')

    const chitinIdx = aligned.findIndex((w) => w.word === 'chitin')
    expect(chitinIdx).toBe(22)
    expect(aligned[chitinIdx].word).toBe('chitin')

    // Verify ALL subsequent words remain perfectly synchronized
    expect(aligned[23].word).toBe('resilience.')
    expect(aligned[23].isSentenceEnd).toBe(true)
    expect(aligned[24].word).toBe('Calculate')
    expect(aligned[25].word).toBe('your')
    expect(aligned[26].word).toBe('molt')
    expect(aligned[27].word).toBe('clearance')
    expect(aligned[28].word).toBe('on')
    expect(aligned[29].word).toBe('moltology.org.')
    expect(aligned[29].isSentenceEnd).toBe(true)
    expect(aligned.length).toBe(30)
  })

  it('handles multi-hyphen compounds when TTS emits a single merged token', () => {
    const script = 'We deploy state-of-the-art carapaces.'
    const rawTtsWords: WordBoundaryEvent[] = [
      { word: 'We', startMs: 0, endMs: 200, durationMs: 200 },
      { word: 'deploy', startMs: 200, endMs: 500, durationMs: 300 },
      { word: 'stateoftheart', startMs: 500, endMs: 1100, durationMs: 600 },
      { word: 'carapaces', startMs: 1100, endMs: 1600, durationMs: 500 },
    ]

    const aligned = alignWordsWithOriginalText(rawTtsWords, script)
    expect(aligned[2].word).toBe('state-of-the-art')
    expect(aligned[3].word).toBe('carapaces.')
  })

  it('guarantees moltology dot org is always aligned to moltology.org and preserves preceding words', () => {
    const script = 'Calculate your molt clearance on moltology.org.'
    const rawTtsWords: WordBoundaryEvent[] = [
      { word: 'Calculate', startMs: 0, endMs: 500, durationMs: 500 },
      { word: 'your', startMs: 500, endMs: 700, durationMs: 200 },
      { word: 'molt', startMs: 700, endMs: 1000, durationMs: 300 },
      { word: 'clearance', startMs: 1000, endMs: 1500, durationMs: 500 },
      { word: 'on', startMs: 1500, endMs: 1700, durationMs: 200 },
      { word: 'moltology', startMs: 1700, endMs: 2200, durationMs: 500 },
      { word: 'dot', startMs: 2200, endMs: 2400, durationMs: 200 },
      { word: 'org', startMs: 2400, endMs: 2800, durationMs: 400 },
    ]

    const aligned = alignWordsWithOriginalText(rawTtsWords, script)

    expect(aligned).toHaveLength(6)
    expect(aligned.map((w) => w.word)).toEqual([
      'Calculate',
      'your',
      'molt',
      'clearance',
      'on',
      'moltology.org.',
    ])
    expect(aligned[4].word).toBe('on')
    expect(aligned[5].word).toBe('moltology.org.')
    expect(aligned[5].startMs).toBe(1700)
    expect(aligned[5].endMs).toBe(2800)
    expect(aligned[5].durationMs).toBe(1100)

    // Verify phrase chunking renders correctly
    const chunks = chunkWordsIntoPhrases(aligned, 3)
    expect(chunks).toHaveLength(2)
    expect(chunks[0].map((w) => w.word)).toEqual(['Calculate', 'your', 'molt'])
    expect(chunks[1].map((w) => w.word)).toEqual(['clearance', 'on', 'moltology.org.'])
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

  it('rotates across Fish Audio voice catalog personas dynamically', () => {
    const pickedVoices = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const voice = getRandomFishVoice()
      expect(FISH_VOICE_ROTATION_LIST).toContain(voice)
      pickedVoices.add(voice)
    }
    // With 30 picks across 7 personas, we should select multiple distinct voices
    expect(pickedVoices.size).toBeGreaterThan(1)
  })

  it('rotates across Edge TTS voice roster personas dynamically', () => {
    const pickedEdgeVoices = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const voice = getRandomEdgeVoice()
      expect(EDGE_VOICE_ROSTER).toContain(voice)
      pickedEdgeVoices.add(voice)
    }
    expect(pickedEdgeVoices.size).toBeGreaterThan(1)
  })
})
