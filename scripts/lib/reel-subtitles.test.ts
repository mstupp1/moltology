import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { renderKineticCaptionCard } from './reel-compositor'

async function pixels(file: string) {
  const canvas = createCanvas(1080, 1920)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(await loadImage(file), 0, 0)
  return ctx.getImageData(0, 0, 1080, 1920).data
}

describe('Clean reel subtitles', () => {
  it('keeps glyphs stationary across highlights and preserves source words and timing', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-subtitles-'))
    try {
      const words = ['One', 'small', 'step.'].map((word, i) => ({ word, startMs: i * 300, endMs: (i + 1) * 300, durationMs: 300 }))
      const original = structuredClone(words)
      const cards = []
      for (let i = 0; i < words.length; i++) {
        const file = path.join(directory, `${i}.png`)
        await renderKineticCaptionCard(words, i, file)
        cards.push(await pixels(file))
      }
      // Skia's color-dependent antialiasing can vary alpha by up to three levels.
      // A font/position change would move entire glyph edges and exceed this tolerance.
      for (const data of cards.slice(1)) {
        let totalDifference = 0, maximumDifference = 0
        for (let i = 3; i < data.length; i += 4) {
          const difference = Math.abs(data[i] - cards[0][i])
          totalDifference += difference
          maximumDifference = Math.max(maximumDifference, difference)
        }
        expect(maximumDifference).toBeLessThanOrEqual(3)
        expect(totalDifference).toBeLessThan(2500)
      }
      for (const data of cards) {
        let amber = 0, white = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] === 245 && data[i + 1] === 158 && data[i + 2] === 11) amber++
          if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) white++
        }
        expect(amber).toBeGreaterThan(100)
        expect(white).toBeGreaterThan(100)
      }
      expect(words).toEqual(original)
    } finally { fs.rmSync(directory, { recursive: true, force: true }) }
  })

  it('fits long, punctuated phrases inside the subtitle safe area', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-subtitles-'))
    try {
      const words = ['Sub-benthic', 'transformation,', 'deliberately.'].map((word, i) => ({ word, startMs: i * 300, endMs: (i + 1) * 300, durationMs: 300 }))
      const file = path.join(directory, 'long.png')
      await renderKineticCaptionCard(words, 1, file)
      const data = await pixels(file)
      let left = 1080, right = 0, top = 1920, bottom = 0
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 5) continue
        const x = ((i - 3) / 4) % 1080, y = Math.floor((i - 3) / 4 / 1080)
        left = Math.min(left, x); right = Math.max(right, x)
        top = Math.min(top, y); bottom = Math.max(bottom, y)
      }
      expect(left).toBeGreaterThanOrEqual(130)
      expect(right).toBeLessThanOrEqual(950)
      expect(top).toBeGreaterThan(1100)
      expect(bottom).toBeLessThan(1250)
      expect(right - left).toBeGreaterThan(600)
    } finally { fs.rmSync(directory, { recursive: true, force: true }) }
  })
})
