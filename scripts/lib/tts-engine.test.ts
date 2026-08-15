import { describe, it, expect } from 'vitest'
import { formatAssTime, formatSrtTime, chunkWordsIntoPhrases, WordBoundaryEvent } from './tts-engine'

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

  it('chunks words into phrases of max size or on punctuation', () => {
    const mockWords: WordBoundaryEvent[] = [
      { word: 'The', startMs: 0, endMs: 200, durationMs: 200 },
      { word: 'biological', startMs: 200, endMs: 500, durationMs: 300 },
      { word: 'cage', startMs: 500, endMs: 800, durationMs: 300 },
      { word: 'dissolves.', startMs: 800, endMs: 1200, durationMs: 400 },
      { word: 'Ascend', startMs: 1300, endMs: 1600, durationMs: 300 },
      { word: 'now.', startMs: 1600, endMs: 1900, durationMs: 300 },
    ]

    const chunks = chunkWordsIntoPhrases(mockWords, 4)
    expect(chunks.length).toBe(2)
    expect(chunks[0].map((w) => w.word)).toEqual(['The', 'biological', 'cage', 'dissolves.'])
    expect(chunks[1].map((w) => w.word)).toEqual(['Ascend', 'now.'])
  })
})
