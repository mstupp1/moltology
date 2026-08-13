import { describe, it, expect } from 'vitest'
import {
  generateSlug,
  calculateReadTime,
  inferContentType,
  parseContentFile,
  normalizeBlogPayload,
  normalizeChangelogPayload,
  normalizePodcastPayload,
} from './parser'

describe('Content Ingestion Parser Utilities', () => {
  describe('generateSlug', () => {
    it('generates clean kebab-case slugs from diverse strings', () => {
      expect(generateSlug('Hello World!')).toBe('hello-world')
      expect(generateSlug('Test-Time Compute & Autonomous Swarms (2026)')).toBe(
        'test-time-compute-autonomous-swarms-2026'
      )
      expect(generateSlug('   Multiple   Spaces  and __Underscores__  ')).toBe(
        'multiple-spaces-and-underscores'
      )
    })
  })

  describe('calculateReadTime', () => {
    it('calculates expected read time based on word count', () => {
      expect(calculateReadTime('')).toBe(1)
      const shortText = 'One two three four five'
      expect(calculateReadTime(shortText)).toBe(1)

      const words = Array.from({ length: 450 }, (_, i) => `word${i}`).join(' ')
      expect(calculateReadTime(words, 200)).toBe(3) // 450 / 200 = 2.25 -> 3
    })

    it('strips code blocks from word count calculation', () => {
      const text = `
Here is a short intro of ten words that we test.
\`\`\`ts
const veryLongCodeBlock = Array.from({ length: 1000 }).map(() => 'code');
\`\`\`
`
      expect(calculateReadTime(text)).toBe(1)
    })
  })

  describe('inferContentType', () => {
    it('prioritizes explicit CLI type over path and frontmatter', () => {
      expect(inferContentType('content/news/item.md', 'podcast', 'blog')).toBe('podcast')
      expect(inferContentType('content/changelogs/v1.md', 'blog')).toBe('blog')
    })

    it('uses frontmatter type if explicit type is omitted', () => {
      expect(inferContentType('arbitrary/path/file.md', undefined, 'changelog')).toBe('changelog')
      expect(inferContentType('arbitrary/path/file.md', undefined, 'podcast')).toBe('podcast')
    })

    it('infers from file path if neither explicit nor frontmatter type is given', () => {
      expect(inferContentType('content/news/dispatch-01.md')).toBe('blog')
      expect(inferContentType('content/blog/dispatch-01.md')).toBe('blog')
      expect(inferContentType('content/changelogs/v1.0.md')).toBe('changelog')
      expect(inferContentType('content/podcasts/ep1.md')).toBe('podcast')
      expect(inferContentType('content/random/unknown.md')).toBe('blog') // fallback
    })
  })

  describe('parseContentFile', () => {
    it('parses markdown files with YAML frontmatter correctly', () => {
      const raw = `---
title: "Sample Article"
category: "DOCTRINE"
tags:
  - AI
  - Tech
---
# Main Heading
This is the body content.
`
      const parsed = parseContentFile('content/news/sample.md', raw)
      expect(parsed.metadata.title).toBe('Sample Article')
      expect(parsed.metadata.category).toBe('DOCTRINE')
      expect(parsed.metadata.tags).toEqual(['AI', 'Tech'])
      expect(parsed.content).toContain('# Main Heading')
    })

    it('parses JSON content files correctly', () => {
      const raw = JSON.stringify({
        title: 'JSON Dispatch',
        category: 'NEWS',
        content: 'This is JSON body content',
        isPublished: true,
      })
      const parsed = parseContentFile('content/news/sample.json', raw)
      expect(parsed.metadata.title).toBe('JSON Dispatch')
      expect(parsed.metadata.category).toBe('NEWS')
      expect(parsed.content).toBe('This is JSON body content')
    })
  })

  describe('Normalizers', () => {
    it('normalizes blog payload with auto-slug and readTime calculation', () => {
      const raw = {
        metadata: {
          title: 'My Custom Blog Post',
          tags: 'AI, Autonomous, Carcinization',
        },
        content: 'Short content body with enough words to verify.',
        filePath: 'content/news/my-post.md',
      }
      const payload = normalizeBlogPayload(raw)
      expect(payload.title).toBe('My Custom Blog Post')
      expect(payload.slug).toBe('my-custom-blog-post')
      expect(payload.tags).toEqual(['AI', 'Autonomous', 'Carcinization'])
      expect(payload.readTimeMinutes).toBe(1)
      expect(payload.isPublished).toBe(true)
    })

    it('normalizes changelog payload with version validation', () => {
      const raw = {
        metadata: {
          version: 'v1.6.0',
          title: 'Autonomous Ingestion',
        },
        content: 'Changelog description details.',
        filePath: 'content/changelogs/v1.6.0.md',
      }
      const payload = normalizeChangelogPayload(raw)
      expect(payload.version).toBe('v1.6.0')
      expect(payload.title).toBe('Autonomous Ingestion')
      expect(payload.content).toBe('Changelog description details.')
    })

    it('throws error when required fields are missing', () => {
      expect(() =>
        normalizeBlogPayload({
          metadata: {},
          content: '',
          filePath: 'invalid.md',
        })
      ).toThrowError(/Missing required "title"/)

      expect(() =>
        normalizeChangelogPayload({
          metadata: { title: 'Some Title' },
          content: '',
          filePath: 'invalid.md',
        })
      ).toThrowError(/Missing required "version"/)

      expect(() =>
        normalizePodcastPayload({
          metadata: { title: 'Podcast Title' },
          content: '',
          filePath: 'invalid.md',
        })
      ).toThrowError(/Missing required "audioUrl"/)
    })
  })
})
