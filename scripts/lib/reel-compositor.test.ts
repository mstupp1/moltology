import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  renderHudWatermarkCard,
  renderKineticCaptionCard,
  renderReelThumbnail,
  renderCtaOutroVideo,
} from './reel-compositor'

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

  it('renders a valid 1:1 grid safe reel thumbnail', async () => {
    const outPath = path.resolve(process.cwd(), 'tmp/test_reel_thumbnail.jpg')
    const result = await renderReelThumbnail({
      backgroundVideoOrImagePath: path.resolve(process.cwd(), 'public/images/benthic_abyss_hero.jpg'),
      headline: 'WHY AI COMPUTE IS MOVING UNDERWATER',
      subtitle: '50 FATHOMS DEEP // SUB-BENTHIC',
      categoryBadge: 'PATRIOT TELEMETRY',
      outputPath: outPath,
    })

    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(10000)
  })

  it('renders the clean, homepage-aligned CTA outro card video', async () => {
    const outPath = path.resolve(process.cwd(), 'tmp/test_cta_outro.mp4')
    const result = await renderCtaOutroVideo(
      outPath,
      1.0,
      'SUBMIT. SHED. ASCEND.',
      'CALCULATE YOUR MOLT CLEARANCE',
      'moltology.org',
      {
        mascot: 'lobster_pointing',
      }
    )

    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(10000)
  })

  it('resolves valid FFmpeg video filter strings for color grading presets', async () => {
    const { getColorGradingFilter } = await import('./reel-compositor')
    
    expect(getColorGradingFilter('benthic-cyan')).toContain('eq=contrast=1.08')
    expect(getColorGradingFilter('benthic-cyan')).toContain('colorbalance=rs=-0.04')
    expect(getColorGradingFilter('thermal-melt')).toContain('eq=contrast=1.08:saturation=1.12')
    expect(getColorGradingFilter('photonics-matrix')).toContain('unsharp=3:3:0.6')
    expect(getColorGradingFilter('calcified-armor')).toContain('saturation=0.96')
    expect(getColorGradingFilter('none')).toBe('')
    expect(getColorGradingFilter('auto')).toBe('')
  })
})

