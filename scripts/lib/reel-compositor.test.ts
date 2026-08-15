import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { renderHudWatermarkCard, renderKineticCaptionCard } from './reel-compositor'

describe('Reel Compositor Rendering', () => {
  it('renders a valid HUD watermark PNG', async () => {
    const outPath = path.resolve(process.cwd(), 'tmp/test_hud_watermark.png')
    const result = await renderHudWatermarkCard(outPath, 'TEST TELEMETRY', 'LIVE TEST // UNIT')

    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(1000)
  })

  it('renders a valid kinetic caption card with highlighted active word', async () => {
    const outPath = path.resolve(process.cwd(), 'tmp/test_caption_card.png')
    const mockPhrase = [
      { word: 'Sub-benthic', startMs: 0, endMs: 400, durationMs: 400 },
      { word: 'compute', startMs: 400, endMs: 800, durationMs: 400 },
      { word: 'cluster', startMs: 800, endMs: 1200, durationMs: 400 },
    ]

    const result = await renderKineticCaptionCard(mockPhrase, 1, outPath)
    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(1000)
  })
})
