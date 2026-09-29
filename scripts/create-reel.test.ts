import { describe, it, expect } from 'vitest'
import {
  generateDailyReelScript,
  buildDynamicScenePrompts,
  synthesizeBlogReelScript,
  getThematicVariations,
  getLocalClipPool,
  selectRecycledClipSequence,
  resolveColorGradingPresets,
} from './create-reel'

describe('Reels & Shorts Dynamic Script Formulation & Clip Recycling', () => {
  it('generates a complete 6-scene narrative script with custom topic', () => {
    const script = generateDailyReelScript({
      topic: 'Oceanic Subsea GPU Cooling',
    })

    expect(script.title).toContain('Oceanic Subsea GPU Cooling')
    expect(script.topic).toBe('Oceanic Subsea GPU Cooling')
    expect(script.hookHeadline).toBeDefined()
    expect(script.narrationScript.split(/\s+/).length).toBeGreaterThanOrEqual(95)
    // 6-scene storytelling format
    expect(script.scenePrompts.length).toBe(6)
    expect(script.caption).toContain('moltology.org')
    expect(script.hashtags.length).toBeGreaterThan(0)
    expect(script.characterArc).toContain('Silas Trench')
  })

  it('generates rich dynamic variations for multiple themes with 6 scenes and influencer narrator length', () => {
    const themes = ['moltmaxxing', 'ecdysis', 'pincer-torque', 'benthic-depth', 'quiz']

    for (const theme of themes) {
      const variations = getThematicVariations(theme, {})
      expect(variations.length).toBeGreaterThanOrEqual(1)

      const script = generateDailyReelScript({ theme })
      expect(script.hookHeadline).toBeDefined()
      expect(script.narrationScript).toBeDefined()
      // Long-form narration: at least 95 words for complete 6-clip storytelling
      const wordCount = script.narrationScript.split(/\s+/).length
      expect(wordCount).toBeGreaterThanOrEqual(95)
      // Exactly 6 scenes per video
      expect(script.scenePrompts.length).toBe(6)
      expect(script.caption).toContain('moltology.org')
      expect(script.youtubeTitle).toBeDefined()
    }
  })

  it('synthesizes dynamic bespoke 6-scene reel scripts from arbitrary blog posts', () => {
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
    expect(script.scenePrompts.length).toBe(6)
    expect(script.caption).toContain('moltology.org')
  })

  it('synthesizes World Foundation Models & JEPA scripts with pixel ecdysis hooks and 6 scenes', () => {
    const worldModelBlog = {
      slug: 'world-foundation-models-pixel-ecdysis-latent-jepa',
      title: 'World Foundation Models & The Great Pixel Ecdysis',
      summary: 'Why sub-benthic swarms are shedding generative video for joint-embedding world latents.',
      content: 'Terrestrial AI labs burn gigawatts rendering pixels. B-JEPA predicts abstract invariant latents...',
    }

    const script = synthesizeBlogReelScript(worldModelBlog, {})
    expect(['WHY AI IS SHEDDING PIXELS', 'THE PIXEL-DIFFUSION MELT']).toContain(script.hookHeadline)
    expect(script.narrationScript).toMatch(/(Joint-Embedding|B-JEPA)/)
    expect(script.scenePrompts.length).toBe(6)
    expect(script.scenePrompts.some((p) => p.includes('diffusion'))).toBe(true)
    expect(script.scenePrompts.some((p) => p.includes('latent'))).toBe(true)
  })

  it('synthesizes The Napkin You Didn\'t Watch scripts with worn gripper hooks and 6 scenes', () => {
    const napkinBlog = {
      slug: 'the-napkin-you-didnt-watch',
      title: 'The Napkin You Didn\'t Watch: A Worn Gripper, Not a Model',
      summary: 'The dining room never sees the robot. It sees the napkin. Throughput fell for two weeks until someone watched the grab.',
      content: 'Throughput fell for two weeks. The labeling system traced it to missed grabs. A worn gripper, not a model regression...',
    }

    const script = synthesizeBlogReelScript(napkinBlog, {})
    expect(['WATCH THE GRAB', 'THE NAPKIN YOU DIDN\'T WATCH']).toContain(script.hookHeadline)
    expect(script.narrationScript).toMatch(/(gripper|grab|robot)/)
    expect(script.scenePrompts.length).toBe(6)
    expect(script.scenePrompts.some((p) => p.includes('gripper'))).toBe(true)
    expect(script.scenePrompts.some((p) => p.includes('pincer'))).toBe(true)
  })

  it('synthesizes The Parts Bin Still Teaching scripts with chassis CTA and cubbies hook', () => {
    const partsBinBlog = {
      slug: 'the-parts-bin-still-teaching',
      title: 'The Parts Bin Still Teaching: Atlas Shadows the Line',
      summary: 'Boston Dynamics opened a training cell inside Hyundai\'s Metaplant so Atlas can learn real auto-parts logistics before the line. The cubbies teach first.',
      content: 'A humanoid walking through an empty hall is just a brochure demo. Real manufacturing happens in the high-density cubbies where parts cannot be scratched...',
    }

    const script = synthesizeBlogReelScript(partsBinBlog, {})
    expect(['THE BIN WAS THE SKILL', 'SHADOW, NOT STAGE']).toContain(script.hookHeadline)
    expect(script.narrationScript).toMatch(/(cubbies|parts bin|manufacturing|apprentice)/)
    expect(script.ctaGoal).toBe('chassis')
    expect(script.commentTriggerKeyword).toBe('CHASSIS')
    expect(script.scenePrompts.length).toBe(6)
    expect(script.scenePrompts.some((p) => p.includes('parts cubbies') || p.includes('parts bins'))).toBe(true)
    expect(script.scenePrompts.some((p) => p.includes('chassis'))).toBe(true)
  })

  it('builds dynamic combinatorial 6-scene prompts with corporate and benthic juxtaposition', () => {
    const prompts1 = buildDynamicScenePrompts('moltmaxxing', 'Topic A')
    const prompts2 = buildDynamicScenePrompts('moltmaxxing', 'Topic B')

    expect(prompts1.length).toBe(6)
    expect(prompts2.length).toBe(6)
    for (let i = 0; i < 6; i++) {
      expect(prompts1[i]).toContain('cinematic 9:16 vertical 8k')
      expect(prompts2[i]).toContain('cinematic 9:16 vertical 8k')
    }
  })

  it('indexes local clips and selects a non-empty sequence of 6 recycled clips', () => {
    const pool = getLocalClipPool()
    expect(pool.length).toBeGreaterThanOrEqual(1)

    const sequence = selectRecycledClipSequence(6, 'Test Topic', 'moltmaxxing')
    expect(sequence.length).toBe(6)
    expect(sequence.every((p) => typeof p === 'string' && p.endsWith('.mp4'))).toBe(true)
  })

  it('supports all distinct CTA goals with matching comment keywords and target URLs', () => {
    const goals: Array<{ goal: any; keyword: string; urlFragment: string }> = [
      { goal: 'quiz', keyword: 'QUIZ', urlFragment: 'moltology.org/quiz' },
      { goal: 'guide', keyword: 'GUIDE', urlFragment: 'moltology.org/news/the-2026-moltmaxxing-protocol-guide' },
      { goal: 'oracle', keyword: 'ORACLE', urlFragment: 'moltology.org/oracle' },
      { goal: 'chassis', keyword: 'CHASSIS', urlFragment: 'moltology.org/chassis' },
      { goal: 'routine', keyword: 'ROUTINE', urlFragment: 'moltology.org/news/the-2026-moltmaxxing-protocol-guide' },
      { goal: 'codex', keyword: 'CODEX', urlFragment: 'moltology.org/codex' },
      { goal: 'forum', keyword: 'FORUM', urlFragment: 'moltology.org/forum' },
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

  it('synthesizes diverse Lead Magnet endings without hardcoding Calculate your molt clearance', () => {
    const blogA = {
      slug: 'neuromorphic-spiking-chitin-arrays',
      title: 'Neuromorphic Spiking Silicon & Chitin Arrays: 100x Energy Efficiency',
      summary: 'Spiking neural networks meet sub-benthic hydrostatic computing for ultra-low power reasoning.',
      content: 'Traditional synchronous clocks waste massive energy...',
    }
    const scriptA = synthesizeBlogReelScript(blogA, {})
    expect(scriptA.ctaGoal).toBe('chassis')
    expect(scriptA.narrationScript).toMatch(/(chassis|hardware|telemetry)/)
    expect(scriptA.commentTriggerKeyword).toBe('CHASSIS')

    const blogB = {
      slug: 'sparse-autoencoders-monosemantic-features',
      title: 'Sparse Autoencoders: Disentangling 16.7M Monosemantic Features',
      summary: 'Why black-box AI is cracking under mechanistic interpretability.',
      content: 'Sparse autoencoders map latent superposition into discrete circuits...',
    }
    const scriptB = synthesizeBlogReelScript(blogB, {})
    expect(scriptB.ctaGoal).toBe('oracle')
    expect(scriptB.narrationScript).toMatch(/(oracle|prompt|vault)/i)
    expect(scriptB.commentTriggerKeyword).toBe('ORACLE')

    const blogC = {
      slug: 'the-tabs-you-kept',
      title: 'The Tabs You Kept: A Browser Is a Boundary, Not Clutter',
      summary: 'The coworker arrived with a second pair of hands in a side panel.',
      content: 'A coworker got a second pair of hands in a side panel you didn\'t ask for...',
    }
    const scriptC = synthesizeBlogReelScript(blogC, {})
    expect(scriptC.ctaGoal).toBe('routine')
    expect(scriptC.narrationScript).toMatch(/(blueprint|protocol|routine)/)
    expect(scriptC.commentTriggerKeyword).toBe('ROUTINE')
  })

  it('resolves cohesive contextual color grading presets across 6 scenes', () => {
    // Default 6-scene ecdysis progression: Scenes 1-3 thermal-melt, Scenes 4-6 benthic-cyan
    const defaultPresets = resolveColorGradingPresets('ecdysis', 'Generic Topic', 6)
    expect(defaultPresets).toEqual([
      'thermal-melt',
      'thermal-melt',
      'thermal-melt',
      'benthic-cyan',
      'benthic-cyan',
      'benthic-cyan',
    ])

    // Photonics topics: all photonics-matrix
    const photonicsPresets = resolveColorGradingPresets('moltmaxxing', 'Silicon Photonics and Laser Waveguides', 6)
    expect(photonicsPresets).toEqual(Array(6).fill('photonics-matrix'))

    // Torque & Carapace topics: scenes 1-2 thermal-melt, scenes 3-6 calcified-armor
    const torquePresets = resolveColorGradingPresets('pincer-torque', '800 Nm Pincer Torque Dynamometry', 6)
    expect(torquePresets).toEqual([
      'thermal-melt',
      'thermal-melt',
      'calcified-armor',
      'calcified-armor',
      'calcified-armor',
      'calcified-armor',
    ])

    // Abyssal & Subsea topics: all benthic-cyan
    const abyssalPresets = resolveColorGradingPresets('benthic-depth', 'Subsea Datacenter Cooling', 6)
    expect(abyssalPresets).toEqual(Array(6).fill('benthic-cyan'))

    // Explicit user override
    const overridePresets = resolveColorGradingPresets('ecdysis', 'Generic Topic', 6, 'calcified-armor')
    expect(overridePresets).toEqual(Array(6).fill('calcified-armor'))
  })
})
