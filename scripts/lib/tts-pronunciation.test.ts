import { describe, it, expect } from 'vitest'
import { applyPronunciations, restoreDisplaySpelling } from './tts-engine'

describe('applyPronunciations', () => {
  it('says maxx words with a single x', () => {
    expect(applyPronunciations('Calibrated Moltmaxxers love Moltmaxxing. MOLTMAXXING too.')).toBe(
      'Calibrated Moltmaxers love Moltmaxing. MOLTMAXING too.'
    )
  })

  it('leaves other words alone', () => {
    expect(applyPronunciations('Max out the maximum torque on moltology.org.')).toBe('Max out the maximum torque on moltology.org.')
  })
})

describe('restoreDisplaySpelling', () => {
  it('puts the brand spelling back on captions, keeping punctuation', () => {
    const words = [
      { word: 'Calibrated', startMs: 0, endMs: 300, durationMs: 300 },
      { word: 'Moltmaxers', startMs: 300, endMs: 800, durationMs: 500 },
      { word: 'love', startMs: 800, endMs: 1000, durationMs: 200 },
      { word: 'Moltmaxing.', startMs: 1000, endMs: 1500, durationMs: 500 },
    ]
    const restored = restoreDisplaySpelling(words, 'Calibrated Moltmaxxers love Moltmaxxing.')
    expect(restored.map((w) => w.word)).toEqual(['Calibrated', 'Moltmaxxers', 'love', 'Moltmaxxing.'])
    expect(restored[1].startMs).toBe(300)
  })
})
