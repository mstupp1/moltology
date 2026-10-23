import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  CTA_GOAL_CONFIGS,
  withReelWebsiteCta,
  getLocalClipPool,
  selectRecycledClipSequence,
  resolveColorGradingPresets,
  buildAntigravityOutroPrompt,
  autoCommitReelPublish,
  checkReelVideoBudget,
  resolveReelSceneFrames,
  loadReviewedReelScript,
} from './create-reel'
import { getImageMimeType } from './generate-video'

describe('Reviewed reel production inputs', () => {
  it('allows a longer Omni plan inside the budget and stops an expensive plan', () => {
    expect(checkReelVideoBudget([4, 6, 4, 6, 4, 6], 'gemini-omni-1.1-flash')).toBe(3)
    expect(() => checkReelVideoBudget([6, 6, 6, 6, 6, 6], 'gemini-omni-1.1-flash')).toThrow('exceeds')
    expect(() => checkReelVideoBudget([4, 4, 4, 4, 4, 4], 'unknown-model')).toThrow('verified video rate')
  })

  it('requires images for all character scenes and preserves authored narration', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-inputs-'))
    try {
      expect(() => resolveReelSceneFrames(directory)).toThrow('scene-4.png')
      for (const n of [4, 5, 6]) fs.writeFileSync(path.join(directory, `scene-${n}.png`), 'image')
      const frames = resolveReelSceneFrames(directory)
      expect(frames.slice(0, 3)).toEqual([undefined, undefined, undefined])
      expect(frames[3]).toBe(path.join(directory, 'scene-4.png'))
      const draft = { title: 'A quiet hour', topic: 'A quiet hour', hookHeadline: 'One more meeting?', narrationScript: 'Close one tab. Finish the task you chose.', caption: 'Let the surface wait.', firstComment: 'Take the audit.', youtubeTitle: 'One more meeting?', youtubeDescription: 'Take the audit.', scenePrompts: Array(6).fill('A concrete shot'), hashtags: ['#Moltology'] }
      const file = path.join(directory, 'draft.json')
      fs.writeFileSync(file, JSON.stringify(draft))
      expect(loadReviewedReelScript(file).narrationScript).toBe(draft.narrationScript)
      fs.writeFileSync(file, JSON.stringify({ ...draft, scenePrompts: [] }))
      expect(() => loadReviewedReelScript(file)).toThrow('six scene prompts')
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })
})

describe('Reels & Shorts clip recycling and grading', () => {
  it('indexes local clips and selects a non-empty sequence of 6 recycled clips', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-clip-pool-'))
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(directory)
    try {
      fs.mkdirSync(path.join(directory, 'tmp'), { recursive: true })
      // This test checks indexing and selection only, not video decoding.
      fs.writeFileSync(path.join(directory, 'tmp', 'veo-scene-1.mp4'), '')
      fs.writeFileSync(path.join(directory, 'tmp', 'veo-scene-2.mp4'), '')
      const pool = getLocalClipPool()
      expect(pool).toHaveLength(2)
      const sequence = selectRecycledClipSequence(6, 'Test Topic', 'moltmaxxing')
      expect(sequence).toHaveLength(6)
      expect(sequence.every((file) => pool.some((clip) => clip.path === file))).toBe(true)
    } finally {
      cwd.mockRestore()
      fs.rmSync(directory, { recursive: true, force: true })
    }
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

    // Torque & Carapace topics: human-world half thermal-melt, deep-sea half calcified-armor
    const torquePresets = resolveColorGradingPresets('pincer-torque', '800 Nm Pincer Torque Dynamometry', 6)
    expect(torquePresets).toEqual([
      'thermal-melt',
      'thermal-melt',
      'thermal-melt',
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

describe('Antigravity CTA outro elevation', () => {
  it('builds an Antigravity image generator prompt that preserves typography and carries theme and topic', () => {
    const prompt = buildAntigravityOutroPrompt({
      theme: 'ecdysis',
      topic: 'Hydrostatic Cooling',
      headline: 'SUBMIT. SHED. ASCEND.',
      subheadline: 'CALCULATE YOUR MOLT CLEARANCE',
      url: 'moltology.org/quiz',
      actionText: '⚡ TAKE THE 15-STAGE TEST',
    })
    expect(prompt).toContain('3D glassmorphic HUD panel')
    expect(prompt).toContain('Theme: ecdysis')
    expect(prompt).toContain('Topic: Hydrostatic Cooling')
    expect(prompt).toContain('headline "SUBMIT. SHED. ASCEND."')
    expect(prompt).toContain('subheadline "CALCULATE YOUR MOLT CLEARANCE"')
    expect(prompt).toContain('URL "moltology.org/quiz"')
    expect(prompt).toContain('9:16 vertical orientation')
  })

  it('falls back to default benthic theme and standard headlines when omitted', () => {
    const prompt = buildAntigravityOutroPrompt({ topic: 'Deep Trench Cooling' })
    expect(prompt).toContain('Theme: benthic')
    expect(prompt).toContain('Topic: Deep Trench Cooling')
    expect(prompt).toContain('SUBMIT. SHED. ASCEND.')
  })

  it('maps reference image extensions to Veo mime types', () => {
    expect(getImageMimeType('a/frame.png')).toBe('image/png')
    expect(getImageMimeType('a/frame.JPG')).toBe('image/jpeg')
    expect(getImageMimeType('a/frame.jpeg')).toBe('image/jpeg')
    expect(getImageMimeType('a/frame.webp')).toBe('image/webp')
  })
})

describe('autoCommitReelPublish', () => {
  it('handles git staging and commit gracefully without throwing', () => {
    const execSpy = vi.fn()
      .mockReturnValueOnce('')
      .mockReturnValueOnce('content/social/instagram-reel-history.json')
      .mockReturnValueOnce('')
    const res = autoCommitReelPublish('reel-test-123', 'Test Topic', { runGit: execSpy })
    expect(res.success).toBe(true)
    expect(execSpy).toHaveBeenCalledTimes(3)
  })
})


describe('Website invitations', () => {
  it('replaces legacy endings without losing narration, punctuation or decimals', () => {
    const body = 'Pick one task. Work for 2.5 minutes! Close the tab?'
    expect(withReelWebsiteCta(`${body} Comment QUIZ at moltology dot org.`, CTA_GOAL_CONFIGS.codex))
      .toBe(`${body} ${CTA_GOAL_CONFIGS.codex.endingScriptPhrases[0]}`)
    expect(withReelWebsiteCta(`${body} Learn more at moltology.org/quiz.`, CTA_GOAL_CONFIGS.guide))
      .toBe(`${body} ${CTA_GOAL_CONFIGS.guide.endingScriptPhrases[0]}`)
    const rewritten = withReelWebsiteCta(`${body} Save this for Monday.`, CTA_GOAL_CONFIGS.quiz)
    expect(withReelWebsiteCta(rewritten, CTA_GOAL_CONFIGS.quiz)).toBe(rewritten)
  })
})
