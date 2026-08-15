import { describe, it, expect } from 'vitest'
import { generateDailyReelScript } from './create-daily-reel'

describe('Daily Reel Script Formulation', () => {
  it('generates a complete daily script with topic, hook, narration, and scene prompts', () => {
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
})
