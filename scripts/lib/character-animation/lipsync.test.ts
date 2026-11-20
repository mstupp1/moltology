import { describe, expect, it } from 'vitest'
import { MOUTH_SHAPES } from '../../../src/lib/avatar3d/mouth-shapes'
import { estimateWords } from './lesson'
import { cuesFromWords, emphasisFrames, framesFromCues, LEAD_FRAMES, trustKeyShapes } from './lipsync'

describe('lip sync', () => {
  it('lays timed mouth shapes onto frames, rest where nothing is said', () => {
    const frames = framesFromCues(
      [
        { start: 0.1, end: 0.3, value: 'D' },
        { start: 0.3, end: 0.5, value: 'A' },
      ],
      30,
      20,
      { lead: 0 },
    )
    expect(frames).toHaveLength(20)
    expect(frames.slice(0, 3)).toBe('XXX')
    expect(frames.slice(3, 9)).toBe('DDDDDD')
    expect(frames.slice(9, 15)).toBe('AAAAAA')
    expect(frames.slice(15)).toBe('XXXXX')
  })

  it('holds a shape rather than flashing another for one frame', () => {
    const frames = framesFromCues(
      [
        { start: 0, end: 0.2, value: 'C' },
        { start: 0.2, end: 0.233, value: 'B' },
        { start: 0.233, end: 0.5, value: 'D' },
      ],
      30,
      15,
    )
    expect(frames).not.toContain('B')
  })

  it('guesses the classic shapes from spelling when there is no audio to listen to', () => {
    const words = estimateWords('Moe, bob, feel love, who knows? Light it up!')
    const cues = cuesFromWords(words)
    const shapes = new Set(cues.map((c) => c.value))
    for (const s of ['A', 'E', 'G', 'F', 'H', 'B']) expect(shapes, s).toContain(s)
    for (const c of cues) {
      expect(MOUTH_SHAPES).toContain(c.value)
      expect(c.end).toBeGreaterThan(c.start)
    }
    // Every cue sits inside a spoken word.
    for (const c of cues) expect(words.some((w) => c.start >= w.startMs / 1000 - 1e-6 && c.end <= w.endMs / 1000 + 1e-6)).toBe(true)
  })

  it('runs the mouth a couple of frames ahead of the voice', () => {
    const cues = [{ start: 0.2, end: 0.4, value: 'D' as const }]
    const on = framesFromCues(cues, 30, 20, { lead: 0 }).indexOf('D')
    expect(framesFromCues(cues, 30, 20).indexOf('D')).toBe(on - LEAD_FRAMES)
  })

  it('never loses a lip close, however short the sound', () => {
    // "a big": the B is 30 ms, under one frame at 30 fps, between two vowels.
    const frames = framesFromCues(
      [
        { start: 0, end: 0.3, value: 'C' },
        { start: 0.3, end: 0.33, value: 'A' },
        { start: 0.33, end: 0.6, value: 'B' },
      ],
      30,
      20,
      { lead: 0 },
    )
    // It takes two frames from the vowels around it.
    expect(frames.match(/A+/)?.[0]).toBe('AA')
    expect(frames.indexOf('A')).toBeGreaterThan(6)
  })

  it('keeps a one-frame opening between two closes ("mama")', () => {
    const frames = framesFromCues(
      [
        { start: 0, end: 0.06, value: 'A' },
        { start: 0.06, end: 0.1, value: 'D' },
        { start: 0.1, end: 0.16, value: 'A' },
        { start: 0.16, end: 0.4, value: 'D' },
      ],
      30,
      14,
      { lead: 0 },
    )
    expect(frames.slice(0, 6)).toMatch(/^A+D+A+D/)
  })

  it('fills the gaps between word-guessed cues with rest', () => {
    const frames = framesFromCues(
      [
        { start: 0, end: 0.2, value: 'D' },
        { start: 0.5, end: 0.7, value: 'C' },
      ],
      30,
      30,
      { lead: 0 },
    )
    expect(frames.slice(0, 6)).toBe('DDDDDD')
    expect(frames.slice(6, 15)).toBe('XXXXXXXXX')
    expect(frames.slice(15, 21)).toBe('CCCCCC')
  })

  it('opens stressed, louder words bigger and lands an accent on them', () => {
    const words = [
      { word: 'the', startMs: 0, endMs: 200 },
      { word: 'molt', startMs: 200, endMs: 500 },
      { word: 'changes', startMs: 500, endMs: 900 },
      { word: 'everything!', startMs: 900, endMs: 1500 },
    ].map((w) => ({ ...w, durationMs: w.endMs - w.startMs }))
    const level = new Array(50).fill(0)
    for (let f = 0; f < 6; f++) level[f] = 0.3
    for (let f = 6; f < 27; f++) level[f] = 0.6
    for (let f = 27; f < 45; f++) level[f] = 1
    const { size, accent } = emphasisFrames(words, level, 30, 50, { lead: 0 })
    expect(size[2]).toBeLessThan(size[10])
    expect(size[35]).toBeGreaterThan(size[10])
    expect(Math.max(...accent.slice(27, 45))).toBeGreaterThan(0.5)
    expect(Math.max(...accent.slice(0, 6))).toBe(0)
  })
})

describe('trusting Rhubarb', () => {
  const word = (w: string, startMs: number, endMs: number) => ({ word: w, startMs, endMs, durationMs: endMs - startMs })
  it('turns a lip close the script cannot have into teeth together', () => {
    const cues = trustKeyShapes(
      [
        { start: 0, end: 0.1, value: 'C' },
        { start: 0.1, end: 0.17, value: 'A' },
        { start: 0.17, end: 0.3, value: 'B' },
        { start: 0.4, end: 0.5, value: 'A' },
        { start: 0.5, end: 0.7, value: 'C' },
      ],
      [word("That's", 0, 200), word('the', 200, 300), word('problem', 400, 800)],
    )
    expect(cues.map((c) => c.value).join('')).toBe('CBAC')
    expect(cues[1]).toMatchObject({ start: 0.1, end: 0.3 })
  })

  it('keeps an F where the word has one and leaves pauses alone', () => {
    const cues = trustKeyShapes(
      [
        { start: 0, end: 0.1, value: 'G' },
        { start: 1, end: 1.1, value: 'A' },
      ],
      [word('five', 0, 300)],
    )
    expect(cues.map((c) => c.value).join('')).toBe('GA')
  })
})

describe('mouth check', () => {
  it('labels the shape of each speaker, frame by frame, as runs', async () => {
    const { mouthCheckLabels } = await import('./mouth-check')
    const runs = mouthCheckLabels(['XXDDDAX', 'XXXXXXX'], ['host-crab', 'junior-lobster'])
    // The silent member gets no line; runs add up to every frame.
    expect(runs.map((r) => r.frames)).toEqual([2, 3, 1, 1])
    expect(runs[1].lines).toEqual(['host-crab   D   AA'])
    expect(runs[2].lines).toEqual(['host-crab   A   M B P'])
  })
})
