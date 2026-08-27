import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  OUTRO_CARD_CATALOG,
  resolveThematicOutroCard,
} from './outro-catalog'

describe('Outro Card Catalog & Thematic Resolver', () => {
  it('defines valid presets in OUTRO_CARD_CATALOG with required metadata', () => {
    const keys = Object.keys(OUTRO_CARD_CATALOG)
    expect(keys).toContain('hardware-melt')
    expect(keys).toContain('world-models-jepa')
    expect(keys).toContain('quiz-audit')
    expect(keys).toContain('pincer-torque')

    for (const preset of Object.values(OUTRO_CARD_CATALOG)) {
      expect(preset.id).toBeTruthy()
      expect(preset.themeKeywords.length).toBeGreaterThan(0)
      expect(preset.filename).toBeTruthy()
      expect(preset.s3Key).toMatch(/^images\/social\/outros\//)
      expect(preset.publicUrl).toMatch(/^https:\/\//)
      expect(preset.headline).toBeTruthy()
    }
  })

  it('resolves hardware-melt outro for chair/unmoved/robot topics', async () => {
    const result = await resolveThematicOutroCard({
      theme: 'ecdysis',
      topic: 'The Unmoved Chair: Humanoid robots on the Oval',
    })
    expect(result).toBeTruthy()
    expect(result).toContain('outro-hardware-melt.jpg')
  })

  it('resolves world-models outro for JEPA and latent topics', async () => {
    const result = await resolveThematicOutroCard({
      theme: 'world-models',
      topic: 'B-JEPA Latent World Foundation Models',
    })
    expect(result).toBeTruthy()
    expect(result).toContain('outro-world-models-jepa.jpg')
  })

  it('resolves quiz-audit outro for quiz and depth clearance topics', async () => {
    const result = await resolveThematicOutroCard({
      theme: 'quiz',
      topic: 'The 15-Stage Moltmaxxing Audit',
    })
    expect(result).toBeTruthy()
    expect(result).toContain('outro-quiz-audit.png')
  })

  it('resolves pincer-torque outro for grip and hydraulic torque topics', async () => {
    const result = await resolveThematicOutroCard({
      theme: 'pincer-torque',
      topic: '800 Nm Hydraulic Pincer Grip Dynamometry',
    })
    expect(result).toBeTruthy()
    expect(result).toContain('outro-pincer-torque.png')
  })

  it('respects explicit customImagePath when file exists', async () => {
    const tempCustomPath = path.resolve(process.cwd(), 'tmp/base-outro-frame.png')
    if (fs.existsSync(tempCustomPath)) {
      const result = await resolveThematicOutroCard({
        theme: 'ecdysis',
        topic: 'Custom Reel',
        customImagePath: tempCustomPath,
      })
      expect(result).toBe(tempCustomPath)
    }
  })
})
