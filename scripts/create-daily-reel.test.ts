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

  it('synthesizes World Foundation Models & JEPA scripts with pixel ecdysis hooks', () => {
    const worldModelBlog = {
      slug: 'world-foundation-models-pixel-ecdysis-latent-jepa',
      title: 'World Foundation Models & The Great Pixel Ecdysis',
      summary: 'Why sub-benthic swarms are shedding generative video for joint-embedding world latents.',
      content: 'Terrestrial AI labs burn gigawatts rendering pixels. B-JEPA predicts abstract invariant latents...',
    }

    const script = synthesizeBlogReelScript(worldModelBlog, {})
    expect(['WHY AI IS SHEDDING PIXELS', 'THE PIXEL-DIFFUSION MELT']).toContain(script.hookHeadline)
    expect(script.narrationScript).toMatch(/(Joint-Embedding|B-JEPA)/)
    expect(script.scenePrompts[0]).toContain('diffusion')
    expect(script.scenePrompts[1]).toContain('latent')
  })

  it('synthesizes The Napkin You Didn\'t Watch scripts with worn gripper hooks', () => {
    const napkinBlog = {
      slug: 'the-napkin-you-didnt-watch',
      title: 'The Napkin You Didn\'t Watch: A Worn Gripper, Not a Model',
      summary: 'The dining room never sees the robot. It sees the napkin. Throughput fell for two weeks until someone watched the grab.',
      content: 'Throughput fell for two weeks. The labeling system traced it to missed grabs. A worn gripper, not a model regression...',
    }

    const script = synthesizeBlogReelScript(napkinBlog, {})
    expect(['WATCH THE GRAB', 'THE NAPKIN YOU DIDN\'T WATCH']).toContain(script.hookHeadline)
    expect(script.narrationScript).toMatch(/(gripper|grab|robot)/)
    expect(script.scenePrompts[0]).toContain('gripper')
    expect(script.scenePrompts[1]).toContain('pincer')
  })

  it('builds dynamic combinatorial scene prompts with varied environments', () => {
    const prompts1 = buildDynamicScenePrompts('moltmaxxing', 'Topic A')
    const prompts2 = buildDynamicScenePrompts('moltmaxxing', 'Topic B')

    expect(prompts1.length).toBe(2)
    expect(prompts2.length).toBe(2)
    expect(prompts1[0]).toContain('cinematic 9:16 vertical 8k')
    expect(prompts1[1]).toContain('cinematic 9:16 vertical 8k')
  })

  it('supports all distinct CTA goals with matching comment keywords and target URLs', () => {
    const goals: Array<{ goal: any; keyword: string; urlFragment: string }> = [
      { goal: 'quiz', keyword: 'QUIZ', urlFragment: 'moltology.org/quiz' },
      { goal: 'guide', keyword: 'GUIDE', urlFragment: 'moltology.org/news/the-2026-moltmaxxing-protocol-guide' },
      { goal: 'codex', keyword: 'CODEX', urlFragment: 'moltology.org/codex' },
      { goal: 'demo', keyword: 'DEMO', urlFragment: 'moltology.org' },
      { goal: 'homepage', keyword: 'INITIATE', urlFragment: 'moltology.org' },
    ]

    for (const { goal, keyword, urlFragment } of goals) {
      const script = generateDailyReelScript({
        topic: `Focusing on ${goal}`,
        ctaGoal: goal,
      })

      expect(script.ctaGoal).toBe(goal)
      expect(script.commentTriggerKeyword).toBe(keyword)
      expect(script.caption).toContain(keyword)
      expect(script.caption).toContain(urlFragment)
      expect(script.firstComment).toContain(keyword)
      expect(script.trialParams).toEqual({ graduationStrategy: 'SS_PERFORMANCE' })
    }
  })

  it('resolves cohesive contextual color grading presets based on topic and theme', async () => {
    const { resolveColorGradingPresets } = await import('./create-daily-reel')

    // Default 2-scene ecdysis progression: Scene 1 thermal-melt, Scene 2 benthic-cyan
    const defaultPresets = resolveColorGradingPresets('ecdysis', 'Generic Topic', 2)
    expect(defaultPresets).toEqual(['thermal-melt', 'benthic-cyan'])

    // Photonics topics
    const photonicsPresets = resolveColorGradingPresets('moltmaxxing', 'Silicon Photonics and Laser Waveguides', 2)
    expect(photonicsPresets).toEqual(['photonics-matrix', 'photonics-matrix'])

    // Torque & Carapace topics
    const torquePresets = resolveColorGradingPresets('pincer-torque', '800 Nm Pincer Torque Dynamometry', 2)
    expect(torquePresets).toEqual(['calcified-armor', 'calcified-armor'])

    // Abyssal & Subsea topics
    const abyssalPresets = resolveColorGradingPresets('benthic-depth', 'Subsea Datacenter Cooling', 2)
    expect(abyssalPresets).toEqual(['benthic-cyan', 'benthic-cyan'])

    // Explicit user override
    const overridePresets = resolveColorGradingPresets('ecdysis', 'Generic Topic', 2, 'calcified-armor')
    expect(overridePresets).toEqual(['calcified-armor', 'calcified-armor'])
  })
})
