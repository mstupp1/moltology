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

  it('synthesizes blog-aligned carousel copy and slide data for the-napkin-you-didnt-watch', async () => {
    const { resolveBlogPost, synthesizeBlogCarouselData } = await import('./create-instagram-carousel')
    const blog = resolveBlogPost({ articleSlug: 'the-napkin-you-didnt-watch' })
    expect(blog).not.toBeNull()
    expect(blog?.slug).toBe('the-napkin-you-didnt-watch')

    const data = synthesizeBlogCarouselData(blog!)
    expect(data.copy.title).toContain("The Napkin You Didn't Watch")
    expect(data.copy.caption).toContain('Din Tai Fung')
    expect(data.copy.caption).toContain('worn gripper')
    expect(data.copy.caption).toContain('moltology.org/news/the-napkin-you-didnt-watch')
    expect(data.copy.firstComment).toContain('the-napkin-you-didnt-watch')

    // Slide 1 checks
    expect(data.slide1.headlinePart1).toBe('BLAMING THE MODEL')
    expect(data.slide1.leftMetric.value).toBe('380')
    expect(data.slide1.rightMetric.value).toBe('WORN GRIP')

    // Slide 2 checks
    expect(data.slide2.headline).toContain('DYNA-1 vs. DYNA-2')
    expect(data.slide2.cards.length).toBe(3)
    expect(data.slide2.cards[1].metric).toContain('95 / HR')

    // Slide 3 checks
    expect(data.slide3.headlinePart1).toBe('WATCH THE GRAB')
    expect(data.slide3.directives.length).toBe(3)

    // Flow prompts checks
    expect(data.flowPrompts.length).toBe(3)
    expect(data.flowPrompts[0]).toContain('robotic gripper')
    expect(data.flowPrompts[1]).toContain('Dyna-1 vs Dyna-2')
  })
})
