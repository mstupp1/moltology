import { describe, it, expect } from 'vitest'
import {
  generateDailyReelScript,
  buildDynamicScenePrompts,
  synthesizeBlogReelScript,
  getThematicVariations,
} from './create-daily-reel'

describe('Daily Reel Dynamic Script Formulation', () => {
  it('generates a complete daily script with custom topic', () => {
    const script = generateDailyReelScript({
      topic: 'Oceanic Subsea GPU Cooling',
    })

    expect(script.title).toContain('Oceanic Subsea GPU Cooling')
    expect(script.topic).toBe('Oceanic Subsea GPU Cooling')
    expect(script.hookHeadline).toBeDefined()
    expect(script.narrationScript.length).toBeGreaterThan(30)
    expect(script.scenePrompts.length).toBeGreaterThanOrEqual(2)
    expect(script.caption).toContain('moltology.org')
    expect(script.hashtags.length).toBeGreaterThan(0)
    expect(script.characterArc).toContain('Silas Trench')
  })

  it('generates rich dynamic variations for multiple themes without hardcoded single strings', () => {
    const themes = ['moltmaxxing', 'ecdysis', 'pincer-torque', 'benthic-depth', 'quiz']

    for (const theme of themes) {
      const variations = getThematicVariations(theme, {})
      expect(variations.length).toBeGreaterThanOrEqual(1)

      const script = generateDailyReelScript({ theme })
      expect(script.hookHeadline).toBeDefined()
      expect(script.narrationScript).toBeDefined()
      expect(script.scenePrompts.length).toBe(2)
      expect(script.caption).toContain('moltology.org')
      expect(script.youtubeTitle).toBeDefined()
    }
  })

  it('synthesizes dynamic bespoke reel scripts from arbitrary blog posts', () => {
    const mockBlog = {
      slug: 'neuromorphic-spiking-chitin-arrays',
      title: 'Neuromorphic Spiking Silicon & Chitin Arrays: 100x Energy Efficiency',
      summary: 'Spiking neural networks meet sub-benthic hydrostatic computing for ultra-low power reasoning.',
      content: 'Traditional synchronous clocks waste massive energy. Spiking neuromorphic silicon computes on event pulses...',
    }

    const script = synthesizeBlogReelScript(mockBlog, {})
    expect(script.title).toContain(mockBlog.title)
    expect(script.topic).toBe(mockBlog.title)
    expect(script.relatedBlogSlug).toBe('neuromorphic-spiking-chitin-arrays')
    expect(script.scenePrompts.length).toBe(2)
    expect(script.caption).toContain('moltology.org')
  })

  it('builds dynamic combinatorial scene prompts with varied environments', () => {
    const prompts1 = buildDynamicScenePrompts('moltmaxxing', 'Topic A')
    const prompts2 = buildDynamicScenePrompts('moltmaxxing', 'Topic B')

    expect(prompts1.length).toBe(2)
    expect(prompts2.length).toBe(2)
    expect(prompts1[0]).toContain('cinematic 9:16 vertical 8k')
    expect(prompts1[1]).toContain('cinematic 9:16 vertical 8k')
  })
})
