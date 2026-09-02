import { describe, it, expect } from 'vitest'
import {
  generatePostContent,
  DEFAULT_INSTAGRAM_ACCOUNT_ID,
  DEFAULT_PROFILE_ID,
  DEFAULT_POST_QUEUE_ID,
} from './create-instagram-post'
import { hasSlashPair } from '../src/lib/copy-slash-pair'

describe('create-instagram-post', () => {
  it('generates on-brand Moltmaxxing post content', () => {
    const post = generatePostContent('moltmaxxing')
    expect(post.title).toBeDefined()
    expect(post.caption.toLowerCase()).toContain('molt')
    expect(post.imagePrompt.toLowerCase()).toContain('benthic')
    expect(post.hashtags.length).toBeGreaterThan(0)
    expect(post.mascot).toBeDefined()
  })

  it('generates Pincer Torque themed content', () => {
    const post = generatePostContent('pincer-torque', undefined, 'crab_stats')
    expect(post.hookHeadline).toContain('PINCER TORQUE')
    expect(post.mascot).toBe('crab_stats')
    expect(post.caption).toContain('800 Nm')
  })

  it('generates Moltmaxxing Guide marketing lead magnet post content', () => {
    const post = generatePostContent('moltmaxxing-guide', undefined, 'lobster_pointing')
    expect(post.title).toContain('Protocol Guide')
    expect(post.hookHeadline).toContain('STOP MELTING')
    expect(post.commentKeyword).toBe('GUIDE')
    expect(post.caption).toContain('Comment "GUIDE"')
    expect(post.firstComment).toContain('GUIDE')
    expect(post.mascot).toBe('lobster_pointing')
  })

  it('generates 15-Stage Quiz marketing post content', () => {
    const post = generatePostContent('moltmax-quiz', undefined, 'crab_stats')
    expect(post.title).toContain('Diagnostic Audit')
    expect(post.commentKeyword).toBe('QUIZ')
    expect(post.caption).toContain('Comment "QUIZ"')
    expect(post.mascot).toBe('crab_stats')
  })

  it('generates Benthic Core App marketing post content with dynamic mascot', () => {
    const post = generatePostContent('benthic-app', undefined, 'lobster_engineer')
    expect(post.title).toContain('Benthic Core')
    expect(post.commentKeyword).toBe('APP')
    expect(post.caption).toContain('Comment "APP"')
    expect(post.mascot).toBe('lobster_engineer')
  })

  it('generates Synaptic Oracle Prompts marketing post content', () => {
    const post = generatePostContent('oracle-prompts', undefined, 'lobster_navigator')
    expect(post.title).toContain('Synaptic Oracle')
    expect(post.hookHeadline).toContain('UNLOCK THE ORACLE')
    expect(post.commentKeyword).toBe('PROMPTS')
    expect(post.caption).toContain('Comment "PROMPTS"')
    expect(post.firstComment).toContain('PROMPTS')
    expect(post.mascot).toBe('lobster_navigator')
  })

  it('has valid default Zernio queue and profile identifiers', () => {
    expect(DEFAULT_PROFILE_ID).toBe('6a7f74b1839bf39ff3b6aaaa')
    expect(DEFAULT_INSTAGRAM_ACCOUNT_ID).toBe('6a7f7f0777555aae01d99b54')
    expect(DEFAULT_POST_QUEUE_ID).toBe('6a84b76d2421e968ac81f5bc')
  })

  it('keeps generated captions free of slash-pair chrome', () => {
    const themes = [
      'oracle-prompts',
      'moltmaxxing-guide',
      'moltmax-quiz',
      'benthic-app',
      'sacred-codex',
      'pincer-routine',
      'free-access',
      'pincer-torque',
      'ecdysis',
      'moltmaxxing',
    ]
    for (const theme of themes) {
      const post = generatePostContent(theme)
      expect(hasSlashPair(post.caption), theme).toBe(false)
      expect(hasSlashPair(post.hookHeadline), theme).toBe(false)
      expect(hasSlashPair(post.title), theme).toBe(false)
    }
  })
})
