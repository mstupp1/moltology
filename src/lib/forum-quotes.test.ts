import { describe, expect, it } from 'vitest'
import {
  FORUM_QUOTE_MAX_CHARS,
  FORUM_QUOTE_WITHDRAWN_BODY,
  buildForumQuoteMarkup,
  forumQuoteAttributionLine,
  isForumQuoteSourceWithdrawn,
  parseForumContentBlocks,
  prependForumQuote,
} from './forum-quotes'

describe('forum quotes', () => {
  it('attributes the quote to @handle when a designation is available', () => {
    expect(
      forumQuoteAttributionLine({ authorHandle: 'claw_lord', authorName: 'LARVA UNIT #9' }),
    ).toBe('@claw_lord held:')

    const result = buildForumQuoteMarkup({
      authorHandle: 'claw_lord',
      authorName: 'LARVA UNIT #9',
      content: 'The molt is not optional.\nWatch the ecdysis window.',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.markup).toBe(
      '> @claw_lord held:\n> The molt is not optional.\n> Watch the ecdysis window.\n\n',
    )
  })

  it('falls back to the author name when no handle is claimed', () => {
    const result = buildForumQuoteMarkup({
      authorHandle: null,
      authorName: 'Architect Vaelen',
      content: 'Harden the grip first.',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.markup).toBe('> Architect Vaelen held:\n> Harden the grip first.\n\n')
  })

  it('blocks quoting a withdrawn post instead of copying the sealed body', () => {
    expect(isForumQuoteSourceWithdrawn({ deletedAt: '2026-09-06T02:00:00.000Z' })).toBe(true)
    expect(isForumQuoteSourceWithdrawn({ deletedAt: null })).toBe(false)

    const blocked = buildForumQuoteMarkup({
      authorHandle: 'claw_lord',
      content: 'Secret molt notes that should stay sealed.',
      deletedAt: '2026-09-06T02:00:00.000Z',
    })
    expect(blocked).toEqual({ ok: false, reason: 'withdrawn' })
  })

  it('can insert a tombstone quote that never leaks the withdrawn body', () => {
    const result = buildForumQuoteMarkup(
      {
        authorHandle: 'claw_lord',
        content: 'Secret molt notes that should stay sealed.',
        deletedAt: '2026-09-06T02:00:00.000Z',
      },
      { onWithdrawn: 'tombstone' },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tombstone).toBe(true)
    expect(result.markup).toContain(FORUM_QUOTE_WITHDRAWN_BODY)
    expect(result.markup).not.toContain('Secret molt notes')
  })

  it('truncates long source bodies and prepends without duplicating', () => {
    const long = 'A'.repeat(FORUM_QUOTE_MAX_CHARS + 40)
    const result = buildForumQuoteMarkup({ authorHandle: 'pincer_prime', content: long })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.markup).toContain('…')
    expect(result.markup.length).toBeLessThan(long.length)

    expect(prependForumQuote('', result.markup)).toBe(result.markup)
    expect(prependForumQuote('Already typed.', result.markup)).toBe(`${result.markup}Already typed.`)
    expect(prependForumQuote(result.markup, result.markup)).toBe(result.markup)
  })

  it('parses attributed quote blocks and leaves mentions in the inner body', () => {
    const blocks = parseForumContentBlocks(
      '> @claw_lord held:\n> Ask @pincer_prime before you molt.\n\nI agree with that read.',
    )
    expect(blocks).toEqual([
      {
        type: 'quote',
        attribution: { raw: '@claw_lord held:', handle: 'claw_lord', name: 'claw_lord' },
        inner: 'Ask @pincer_prime before you molt.',
      },
      { type: 'text', value: '\nI agree with that read.' },
    ])
  })

  it('keeps nested quote prefixes after one strip so chrome can nest', () => {
    const blocks = parseForumContentBlocks(
      '> @outer held:\n> surface note\n> > @inner held:\n> > deep note\n',
    )
    expect(blocks[0]).toMatchObject({
      type: 'quote',
      attribution: { handle: 'outer', name: 'outer' },
    })
    if (blocks[0]?.type !== 'quote') return
    expect(parseForumContentBlocks(blocks[0].inner)).toEqual([
      { type: 'text', value: 'surface note' },
      {
        type: 'quote',
        attribution: { raw: '@inner held:', handle: 'inner', name: 'inner' },
        inner: 'deep note',
      },
    ])
  })
})
