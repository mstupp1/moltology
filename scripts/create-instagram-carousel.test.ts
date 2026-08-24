import { describe, it, expect } from 'vitest'
import {
  generateCarouselCopy,
  buildSlideGoogleFlowPrompt,
  DEFAULT_CAROUSEL_QUEUE_ID,
  DEFAULT_PROFILE_ID,
  DEFAULT_INSTAGRAM_ACCOUNT_ID,
} from './create-instagram-carousel'

describe('create-instagram-carousel', () => {
  it('generates on-brand carousel copy and caption', () => {
    const copy = generateCarouselCopy('pincer-torque')
    expect(copy.title).toBeDefined()
    expect(copy.caption).toContain('3-STAGE BENTHIC ARCHITECTURE')
    expect(copy.caption).toContain('Slide 1')
    expect(copy.caption).toContain('Slide 2')
    expect(copy.caption).toContain('Slide 3')
    expect(copy.hashtags.length).toBeGreaterThan(0)
    expect(copy.firstComment).toContain('moltology.org')
  })

  it('builds rich Google Flow prompts with no wasted space directives for each slide', () => {
    const prompt1 = buildSlideGoogleFlowPrompt(1, 'hook', 'moltmaxxing')
    const prompt2 = buildSlideGoogleFlowPrompt(2, 'spec-showdown', 'moltmaxxing')
    const prompt3 = buildSlideGoogleFlowPrompt(3, 'directives', 'moltmaxxing')

    expect(prompt1).toContain('SLIDE 1')
    expect(prompt1).toContain('NO WASTED SPACE')
    expect(prompt1).toContain('Glassmorphic')
    expect(prompt1).toContain('Hook & Bottleneck')

    expect(prompt2).toContain('SLIDE 2')
    expect(prompt2).toContain('Breakthrough Mechanism')

    expect(prompt3).toContain('SLIDE 3')
    expect(prompt3).toContain('Action Directives')
  })

  it('has valid default Zernio queue and profile identifiers', () => {
    expect(DEFAULT_PROFILE_ID).toBe('6a7f74b1839bf39ff3b6aaaa')
    expect(DEFAULT_INSTAGRAM_ACCOUNT_ID).toBe('6a7f7f0777555aae01d99b54')
    expect(DEFAULT_CAROUSEL_QUEUE_ID).toBe('6a84b76d2421e968ac81f5bc')
  })
})
