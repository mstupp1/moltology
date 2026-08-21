import { describe, it, expect } from 'vitest'
import {
  formatAssTime,
  formatSrtTime,
  chunkWordsIntoPhrases,
  alignWordsWithOriginalText,
  WordBoundaryEvent,
} from './tts-engine'

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

    // Sentence 1 (5 words) -> ['Execution', 'without', 'grip'], ['is', 'meaningless.']
    // Sentence 2 (3 words) -> ['Moltmaxxing', 'builds', 'armor.']
    expect(chunks.length).toBe(3)
    expect(chunks[0].map((w) => w.word)).toEqual(['Execution', 'without', 'grip'])
    expect(chunks[1].map((w) => w.word)).toEqual(['is', 'meaningless.'])
    expect(chunks[2].map((w) => w.word)).toEqual(['Moltmaxxing', 'builds', 'armor.'])

    // Crucial check: "Moltmaxxing" is NEVER in the same chunk as "is meaningless."
    const chunkWithMeaningless = chunks.find((c) => c.some((w) => w.word.includes('meaningless')))
    expect(chunkWithMeaningless?.some((w) => w.word.includes('Moltmaxxing'))).toBe(false)
  })

  it('balances chunks nicely for 4-word, 5-word, and 6-word sentences', () => {
    // 4 words -> 2 + 2
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

    // 6 words -> 3 + 3
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

