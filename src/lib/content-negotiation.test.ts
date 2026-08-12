import { describe, it, expect } from 'vitest'
import { isMarkdownPreferred, isAIScraperUserAgent } from './content-negotiation'

describe('Content Negotiation Utilities', () => {
  it('detects .md URL paths as markdown preferred', () => {
    expect(isMarkdownPreferred(null, '/codex.md')).toBe(true)
    expect(isMarkdownPreferred(null, '/news/sample-post.md')).toBe(true)
    expect(isMarkdownPreferred(null, '/codex')).toBe(false)
  })

  it('detects Accept: text/markdown header', () => {
    const req = new Request('https://moltology.org/codex', {
      headers: {
        Accept: 'text/markdown, text/html;q=0.9',
      },
    })
    expect(isMarkdownPreferred(req, '/codex')).toBe(true)

    const normalReq = new Request('https://moltology.org/codex', {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    expect(isMarkdownPreferred(normalReq, '/codex')).toBe(false)
  })

  it('detects known AI user agents', () => {
    expect(isAIScraperUserAgent('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)')).toBe(true)
    expect(isAIScraperUserAgent('ClaudeBot/1.0; +claudebot@anthropic.com')).toBe(true)
    expect(isAIScraperUserAgent('PerplexityBot/1.0')).toBe(true)
    expect(isAIScraperUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe(false)
    expect(isAIScraperUserAgent(null)).toBe(false)
  })
})
