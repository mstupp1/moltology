import { describe, expect, it } from 'vitest'
import { MOUTH_SHAPES } from '../../../src/lib/avatar3d/mouth-shapes'
import { estimateWords } from './lesson'
import { cuesFromWords, framesFromCues } from './lipsync'

describe('lip sync', () => {
  it('lays timed mouth shapes onto frames, rest where nothing is said', () => {
    const frames = framesFromCues(
      [
        { start: 0.1, end: 0.3, value: 'D' },
        { start: 0.3, end: 0.5, value: 'A' },
      ],
      30,
      20,
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
})
