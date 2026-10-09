import { describe, it, expect, vi } from 'vitest'
import {
  generatePostContent,
  parsePostContent,
  createInstagramPost,
  DEFAULT_INSTAGRAM_ACCOUNT_ID,
  DEFAULT_PROFILE_ID,
  DEFAULT_POST_QUEUE_ID,
} from './create-instagram-post'
import { hasSlashPair } from '../src/lib/copy-slash-pair'
import { assertNoKeywordCta } from './lib/instagram-copy-policy'

// Content tests do not render images or need a browser installation.
vi.mock('./lib/composite-renderer', () => ({ captureComposite: vi.fn() }))

describe('create-instagram-post', () => {
  it('keeps reviewed content instead of regenerating campaign defaults', () => {
    const content = { title: 'Quiet hour', topic: 'Focus', hookHeadline: 'Protect your hour.', imagePrompt: 'Book', caption: 'Let the surface wait.', firstComment: 'Open the Codex.', hashtags: ['#Moltology'] }
    expect(parsePostContent(content)).toEqual(content)
  })

  it('rejects incomplete saved copy and excessive hashtags before ingest', () => {
    expect(() => parsePostContent({ caption: 'Partial draft' })).toThrow('title')
    const content = generatePostContent('sacred-codex')
    expect(() => parsePostContent({ ...content, hashtags: ['a', 'b', 'c', 'd'] })).toThrow('three')
  })

  it('blocks keyword copy and legacy presets before media ingestion', async () => {
    const content = { title: 'Quiet hour', topic: 'Focus', hookHeadline: 'Protect your hour.', imagePrompt: 'Book', caption: 'Comment "GUIDE" for access.', firstComment: 'Open the Codex.', hashtags: ['#Moltology'] }
    expect(() => parsePostContent(content)).toThrow('retired')
    await expect(createInstagramPost({ polishedImage: 'missing.png' })).rejects.toThrow('--content-json')
  })
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
    expect(post).not.toHaveProperty('commentKeyword')
    expect(post.caption).not.toMatch(/comment|\bdms?\b/i)
    expect(post.firstComment).toContain('https://moltology.org/news/the-2026-moltmaxxing-protocol-guide')
    expect(post.mascot).toBe('lobster_pointing')
  })

  it('generates 15-Stage Quiz marketing post content', () => {
    const post = generatePostContent('moltmax-quiz', undefined, 'crab_stats')
    expect(post.title).toContain('Diagnostic Audit')
    expect(post).not.toHaveProperty('commentKeyword')
    expect(post.caption).not.toMatch(/comment|\bdms?\b/i)
    expect(post.mascot).toBe('crab_stats')
  })

  it('generates Benthic Core App marketing post content with dynamic mascot', () => {
    const post = generatePostContent('benthic-app', undefined, 'lobster_engineer')
    expect(post.title).toContain('Benthic Core')
    expect(post).not.toHaveProperty('commentKeyword')
    expect(post.caption).not.toMatch(/comment|\bdms?\b/i)
    expect(post.mascot).toBe('lobster_engineer')
  })

  it('generates Synaptic Oracle Prompts marketing post content', () => {
    const post = generatePostContent('oracle-prompts', undefined, 'lobster_navigator')
    expect(post.title).toContain('Synaptic Oracle')
    expect(post.hookHeadline).toContain('UNLOCK THE ORACLE')
    expect(post).not.toHaveProperty('commentKeyword')
    expect(post.caption).not.toMatch(/comment|\bdms?\b/i)
    expect(post.firstComment).toContain('https://moltology.org/oracle')
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
      expect(() => assertNoKeywordCta(post as unknown as Record<string, unknown>), theme).not.toThrow()
      expect(post, theme).not.toHaveProperty('commentKeyword')
      expect(post.firstComment, theme).toContain('https://moltology.org')
    }
  })

  it('strictly forbids decorative diamond glyphs (◈) and screaming all-caps hooks (BAN 8)', () => {
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
      expect(post.caption, theme).not.toContain('◈')
      expect(post.title, theme).not.toContain('◈')
      if (post.firstComment) {
        expect(post.firstComment, theme).not.toContain('◈')
      }

      // First line hook must NOT be shouting ALL-CAPS
      const firstLine = post.caption.split('\n')[0].trim()
      const lettersOnly = firstLine.replace(/[^a-zA-Z]/g, '')
      expect(lettersOnly.length).toBeGreaterThan(0)
      expect(lettersOnly === lettersOnly.toUpperCase(), `${theme} first line is shouting all-caps: "${firstLine}"`).toBe(false)
    }
  })
})
