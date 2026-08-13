import { describe, it, expect, vi } from 'vitest'
import { ingestContentItem } from './handlers'
import { RawParsedContent } from './types'

describe('Content Ingestion Handlers & Dispatcher', () => {
  it('handles dry-run validation for blog posts without invoking database', async () => {
    const raw: RawParsedContent = {
      filePath: 'content/news/test-article.md',
      metadata: {
        title: 'Dry Run Test Article',
        summary: 'Dry run summary test',
      },
      content: 'This is body content for validation.',
    }

    const result = await ingestContentItem(raw, { dryRun: true })
    expect(result.success).toBe(true)
    expect(result.action).toBe('validated')
    expect(result.identifier).toBe('dry-run-test-article')
    expect(result.type).toBe('blog')
  })

  it('handles dry-run validation for changelogs', async () => {
    const raw: RawParsedContent = {
      filePath: 'content/changelogs/v2.0.0.md',
      metadata: {
        version: 'v2.0.0',
        title: 'Next Gen Release',
        category: 'FEATURE',
      },
      content: 'Changelog release notes.',
    }

    const result = await ingestContentItem(raw, { dryRun: true })
    expect(result.success).toBe(true)
    expect(result.action).toBe('validated')
    expect(result.identifier).toBe('v2.0.0')
    expect(result.type).toBe('changelog')
  })

  it('handles dry-run validation for podcasts', async () => {
    const raw: RawParsedContent = {
      filePath: 'content/podcasts/transmission-09.md',
      metadata: {
        title: 'Transmission 09',
        audioUrl: 'https://cdn.moltology.org/audio/t09.mp3',
        durationSeconds: 1200,
      },
      content: 'Podcast notes.',
    }

    const result = await ingestContentItem(raw, { dryRun: true })
    expect(result.success).toBe(true)
    expect(result.action).toBe('validated')
    expect(result.identifier).toBe('transmission-09')
    expect(result.type).toBe('podcast')
  })

  it('returns graceful error when payload validation fails during ingestion', async () => {
    const raw: RawParsedContent = {
      filePath: 'content/news/invalid.md',
      metadata: {},
      content: 'No title provided.',
    }

    const result = await ingestContentItem(raw, { dryRun: true })
    expect(result.success).toBe(false)
    expect(result.action).toBe('skipped')
    expect(result.error).toContain('Missing required "title"')
  })
})
