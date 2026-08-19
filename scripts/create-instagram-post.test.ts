import { describe, it, expect } from 'vitest'
import {
  generatePostContent,
  DEFAULT_INSTAGRAM_ACCOUNT_ID,
  DEFAULT_PROFILE_ID,
  DEFAULT_POST_QUEUE_ID,
} from './create-instagram-post'

describe('create-instagram-post', () => {
  it('generates on-brand Moltmaxxing post content', () => {
    const post = generatePostContent('moltmaxxing')
    expect(post.title).toBeDefined()
    expect(post.caption.toLowerCase()).toContain('molt')
    expect(post.imagePrompt.toLowerCase()).toContain('benthic')
    expect(post.hashtags.length).toBeGreaterThan(0)
    expect(post.mascot).toBe('lobster_pointing')
  })

  it('generates Pincer Torque themed content', () => {
    const post = generatePostContent('pincer-torque')
    expect(post.hookHeadline).toContain('PINCER TORQUE')
    expect(post.mascot).toBe('crab_stats')
    expect(post.caption).toContain('800 Nm')
  })

  it('has valid default Zernio queue and profile identifiers', () => {
    expect(DEFAULT_PROFILE_ID).toBe('6a7f74b1839bf39ff3b6aaaa')
    expect(DEFAULT_INSTAGRAM_ACCOUNT_ID).toBe('6a7f7f0777555aae01d99b54')
    expect(DEFAULT_POST_QUEUE_ID).toBe('6a84b76d2421e968ac81f5bc')
  })
})
