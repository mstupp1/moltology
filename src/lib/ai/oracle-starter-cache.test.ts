import { describe, it, expect, vi } from 'vitest'
import {
  CACHED_STARTER_REPLIES,
  ORACLE_CACHED_HEADER,
  createCachedStarterResponse,
  createCachedStarterStream,
  lookupCachedStarterReply,
  splitCachedStreamChunks,
} from './oracle-starter-cache'
import { STARTER_PROMPTS, starterPromptText } from '../oracle-starter-prompts'
import { ORACLE_SKILL_IDS } from './oracle-skills-catalog'
import { hasSlashPair } from '../copy-slash-pair'
import { CANONICAL_SCRIPTURES } from '../codexData'
import { findScriptureBySlug } from '../codex-links'

const VALID_STATIC_PATHS = new Set([
  '/moltmax',
  '/dashboard',
  '/character',
  '/character/shop',
  '/character/progress',
  '/codex',
  '/forum',
  '/academy',
])

const SCRIPTURE_TEXT_BY_SLUG = new Map(
  CANONICAL_SCRIPTURES.map((s) => [
    s.id.toLowerCase(),
    s.verses.map((v) => v.text.replace(/\s+/g, ' ').trim()).join(' '),
  ]),
)

describe('oracle-starter-cache catalog', () => {
  it('covers exactly the 14 evergreen start, codex, and focus starter prompts', () => {
    const expectedIds = STARTER_PROMPTS.filter(
      (p) => p.group === 'start' || p.group === 'codex' || p.group === 'focus',
    ).map((p) => p.id)

    const cachedIds = CACHED_STARTER_REPLIES.map((r) => r.id)
    expect(new Set(cachedIds).size).toBe(cachedIds.length)
    expect(cachedIds).toEqual(expectedIds)
    expect(cachedIds).toHaveLength(14)

    for (const entry of CACHED_STARTER_REPLIES) {
      expect(entry.title.trim().length).toBeGreaterThan(0)
      expect(entry.title.length).toBeLessThanOrEqual(60)
      expect(entry.answer.trim().length).toBeGreaterThan(40)
      if (entry.skillId) {
        expect(ORACLE_SKILL_IDS.has(entry.skillId)).toBe(true)
      }
    }
  })

  it('passes Style Guide, Oracle persona, link, and scripture accuracy checks', () => {
    const emojiPattern = /\p{Extended_Pictographic}/u
    const techLeakPattern = /\b(Postgres|PostgreSQL|Drizzle|TanStack|React|Vercel|JWT|DeepSeek|Claude|LLM|API)\b/i

    for (const entry of CACHED_STARTER_REPLIES) {
      expect(hasSlashPair(entry.answer), `${entry.id} has slash pair`).toBe(false)
      expect(entry.answer, `${entry.id} has diamond glyph`).not.toContain('◈')
      expect(entry.answer, `${entry.id} has em dash`).not.toContain('—')
      expect(entry.answer, `${entry.id} has terminal banner`).not.toContain('>>')
      expect(entry.answer, `${entry.id} has Latin chant`).not.toMatch(/\b(SUBMITTE|CARO PERIT|CARAPAX)\b/)
      expect(entry.answer, `${entry.id} has emoji`).not.toMatch(emojiPattern)
      expect(entry.answer, `${entry.id} has tech leak`).not.toMatch(techLeakPattern)

      const links = [...entry.answer.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1])
      const codexSlugs: string[] = []
      for (const href of links) {
        if (href.startsWith('/codex/')) {
          const slug = href.slice('/codex/'.length)
          expect(findScriptureBySlug(slug), `${entry.id} bad codex link ${href}`).toBeDefined()
          codexSlugs.push(slug)
        } else {
          expect(VALID_STATIC_PATHS.has(href), `${entry.id} bad link ${href}`).toBe(true)
        }
      }

      const blockquotes = [...entry.answer.matchAll(/^>\s*"([^"]+)"$/gm)].map((m) => m[1])
      for (const quote of blockquotes) {
        const normalizedQuote = quote.replace(/\s+/g, ' ').trim()
        const matched = codexSlugs.some((slug) =>
          (SCRIPTURE_TEXT_BY_SLUG.get(slug) ?? '').includes(normalizedQuote),
        )
        expect(matched, `${entry.id} misquoted or unlinked scripture: ${quote}`).toBe(true)
      }
    }
  })

  it('matches normalized starter prompt text and returns null for non-starters or dynamic prompts', () => {
    for (const entry of CACHED_STARTER_REPLIES) {
      const prompt = STARTER_PROMPTS.find((p) => p.id === entry.id)!
      const text = starterPromptText(prompt)
      expect(lookupCachedStarterReply(text)?.id).toBe(entry.id)
      expect(lookupCachedStarterReply(`  ${text.toUpperCase()}  `)?.id).toBe(entry.id)
    }

    expect(lookupCachedStarterReply('What is moltology?')).toBeNull()
    expect(lookupCachedStarterReply("What are today's top posts on the forum?")).toBeNull()
    expect(lookupCachedStarterReply('Summarize this thread: the main points and where people agree or disagree.')).toBeNull()
    expect(lookupCachedStarterReply('')).toBeNull()
  })
})

describe('oracle-starter-cache streaming', () => {
  it('reconstructs every cached answer verbatim from splitCachedStreamChunks', () => {
    for (const entry of CACHED_STARTER_REPLIES) {
      const chunks = splitCachedStreamChunks(entry.answer, 24)
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.join('')).toBe(entry.answer)
    }
    expect(splitCachedStreamChunks('')).toEqual([])
  })

  it('streams multiple paced UTF-8 chunks and calls onComplete once before EOF', async () => {
    const onComplete = vi.fn()
    const stream = createCachedStarterStream('One two three four five six seven eight nine ten.', {
      initialDelayMs: 6,
      chunkDelayMs: 2,
      chunkChars: 12,
      onComplete,
    })

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const parts: string[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      parts.push(decoder.decode(value, { stream: true }))
    }
    parts.push(decoder.decode())

    expect(parts.length).toBeGreaterThan(2)
    expect(parts.join('')).toBe('One two three four five six seven eight nine ten.')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith('One two three four five six seven eight nine ten.', false)
  })

  it('stops on abort and invokes onComplete once with partial emitted text', async () => {
    const controller = new AbortController()
    const onComplete = vi.fn()
    const response = createCachedStarterResponse('Alpha beta gamma delta epsilon zeta eta theta.', {
      signal: controller.signal,
      initialDelayMs: 2,
      chunkDelayMs: 30,
      chunkChars: 10,
      headers: { 'X-Custom': 'yes' },
      onComplete,
    })

    expect(response.headers.get(ORACLE_CACHED_HEADER)).toBe('1')
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('X-Custom')).toBe('yes')

    const reader = response.body!.getReader()
    const first = await reader.read()
    expect(first.done).toBe(false)
    controller.abort()

    while (!(await reader.read()).done) {
      // drain until closed
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][1]).toBe(true)
    expect(onComplete.mock.calls[0][0].length).toBeGreaterThan(0)
    expect(onComplete.mock.calls[0][0].length).toBeLessThan('Alpha beta gamma delta epsilon zeta eta theta.'.length)
  })

  it('handles reader.cancel cleanly without calling onComplete more than once', async () => {
    const onComplete = vi.fn()
    const stream = createCachedStarterStream('First chunk then second chunk then third chunk.', {
      initialDelayMs: 2,
      chunkDelayMs: 40,
      chunkChars: 12,
      onComplete,
    })

    const reader = stream.getReader()
    const first = await reader.read()
    expect(first.done).toBe(false)
    await reader.cancel('stopped')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][1]).toBe(true)
  })
})
