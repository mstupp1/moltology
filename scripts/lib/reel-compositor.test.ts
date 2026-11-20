import { describe, it, expect, vi } from 'vitest'
// Unit tests exercise the Canvas fallback; browser capture belongs to explicit visual runs.
vi.mock('./composite-renderer', () => ({
  captureComposite: vi.fn().mockRejectedValue(new Error('Browser capture disabled in unit tests')),
}))

import fs from 'node:fs'
import path from 'node:path'
import {
  renderHudWatermarkCard,
  renderKineticCaptionCard,
  renderReelThumbnail,
  renderCtaOutroVideo,
  renderSimpleCtaOutroFrame,
  renderSimpleCtaOutroVideo,
} from './reel-compositor'

describe('Reel Compositor Rendering', () => {
  it('renders a valid HUD watermark PNG', async () => {
    const outPath = path.resolve(process.cwd(), 'tmp/test_hud_watermark.png')
    const result = await renderHudWatermarkCard(outPath, 'TEST TELEMETRY', 'LIVE TEST · UNIT')

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
      subtitle: '50 FATHOMS DEEP · SUB-BENTHIC',
      categoryBadge: 'PATRIOT TELEMETRY',
      outputPath: outPath,
    })

    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(10000)
  })

  it('renders the CTA outro card video through the Canvas fallback', async () => {
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
  }, 15000)

  it('renders the simplified CTA outro card frame (Moltology emblem, THE SYNAPTIC PATH, clean moltology.org CTA)', async () => {
    const outPath = path.resolve(process.cwd(), `tmp/test_simple_cta_outro_frame_${Date.now()}.png`)
    const result = await renderSimpleCtaOutroFrame(outPath, 'moltology.org', { useCanvasOnly: true })

    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(1000)
    if (fs.existsSync(result)) fs.unlinkSync(result)
  })

  it('renders the simplified CTA outro card video with smooth fade-in', async () => {
    const outPath = path.resolve(process.cwd(), `tmp/test_simple_cta_outro_${Date.now()}.mp4`)
    const result = await renderSimpleCtaOutroVideo(outPath, 1.0, 'moltology.org', { useCanvasOnly: true })

    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(10000)
    if (fs.existsSync(result)) fs.unlinkSync(result)
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

  it('supports hard-cut reels with ctaDurationSeconds=0 and backgroundAudioVolume=0', async () => {
    const { execFileSync } = await import('node:child_process')
    const { compositeReel } = await import('./reel-compositor')
    const dir = path.resolve(process.cwd(), `tmp/test_hard_cut_${Date.now()}`)
    fs.mkdirSync(dir, { recursive: true })
    const clip = path.join(dir, 'clip.mp4')
    const vo = path.join(dir, 'vo.mp3')
    const out = path.join(dir, 'final.mp4')
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=540x960:r=30:d=1.2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', clip])
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.9', '-c:a', 'libmp3lame', vo])
      const res = await compositeReel({
        videoClips: [clip],
        clipDurations: [1.2],
        voiceoverPath: vo,
        words: [
          { word: 'Test', startMs: 100, endMs: 400, durationMs: 300 },
          { word: 'line.', startMs: 450, endMs: 800, durationMs: 350 },
        ],
        outputPath: out,
        colorGrading: 'none',
        ctaDurationSeconds: 0,
        backgroundAudioVolume: 0,
        tempDir: path.join(dir, 'build'),
      })
      expect(fs.existsSync(out)).toBe(true)
      expect(res.durationSeconds).toBeGreaterThanOrEqual(1.1)
      expect(res.durationSeconds).toBeLessThan(1.8)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }, 15000)
})

