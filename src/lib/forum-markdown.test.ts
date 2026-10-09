import { describe, expect, it } from 'vitest'
import {
  escapeForumText,
  forumDocToMarkdown,
  forumMarkdownPlainText,
  forumMarkdownToDoc,
  isForumMarkdownBlank,
  normalizeForumLinkInput,
  normalizeForumMarkdown,
  safeForumHref,
  type ForumDocNode,
} from './forum-markdown'

const roundTrip = (md: string) => forumDocToMarkdown(forumMarkdownToDoc(md))

const doc = (...content: ForumDocNode[]): ForumDocNode => ({ type: 'doc', content })
const p = (...content: ForumDocNode[]): ForumDocNode => ({ type: 'paragraph', content })
const t = (text: string, ...marks: ForumDocNode['marks'] & object): ForumDocNode =>
  marks.length ? { type: 'text', text, marks } : { type: 'text', text }

describe('safeForumHref', () => {
  it('accepts http and https', () => {
    expect(safeForumHref('https://moltology.com/forum')).toBe('https://moltology.com/forum')
    expect(safeForumHref('http://example.com')).toBe('http://example.com/')
  })

  it('rejects script, data, relative and credential links', () => {
    for (const bad of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      ' javascript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      '//evil.com',
      '/forum',
      'https://moltology.com@evil.com',
      'https://user:pass@evil.com',
      'https://exa mple.com',
      '',
      null,
      undefined,
    ]) {
      expect(safeForumHref(bad as string)).toBeNull()
    }
  })

  it('rejects very long links', () => {
    expect(safeForumHref(`https://e.com/${'a'.repeat(3000)}`)).toBeNull()
  })
})

describe('normalizeForumLinkInput', () => {
  it('adds https to bare domains', () => {
    expect(normalizeForumLinkInput('moltology.com/forum')).toBe('https://moltology.com/forum')
  })

  it('refuses things that are not web addresses', () => {
    expect(normalizeForumLinkInput('javascript:alert(1)')).toBeNull()
    expect(normalizeForumLinkInput('hello')).toBeNull()
    expect(normalizeForumLinkInput('//evil.com')).toBeNull()
    expect(normalizeForumLinkInput('  ')).toBeNull()
  })
})

describe('normalizeForumMarkdown', () => {
  it('ends a quote at the first unquoted line', () => {
    expect(normalizeForumMarkdown('> quoted\nmine')).toBe('> quoted\n\nmine')
  })

  it('leaves code fences alone', () => {
    const md = '```\n> not a quote\nstill code\n```'
    expect(normalizeForumMarkdown(md)).toBe(md)
  })
})

describe('forumMarkdownToDoc', () => {
  it('keeps single newlines as line breaks', () => {
    expect(forumMarkdownToDoc('one\ntwo')).toEqual(doc(p(t('one'), { type: 'hardBreak' }, t('two'))))
  })

  it('maps marks and lists', () => {
    const result = forumMarkdownToDoc('**b** *i* `c` [l](https://e.com)\n\n- a\n- b\n\n3. x')
    expect(result.content?.[0]).toEqual(
      p(
        t('b', { type: 'bold' }),
        t(' '),
        t('i', { type: 'italic' }),
        t(' '),
        t('c', { type: 'code' }),
        t(' '),
        t('l', { type: 'link', attrs: { href: 'https://e.com/' } }),
      ),
    )
    expect(result.content?.[1].type).toBe('bulletList')
    expect(result.content?.[2]).toMatchObject({ type: 'orderedList', attrs: { start: 3 } })
  })

  it('drops unsafe links but keeps their text', () => {
    const result = forumMarkdownToDoc('[click](javascript:alert(1))')
    expect(JSON.stringify(result)).not.toContain('javascript')
    expect(forumMarkdownPlainText('[click](javascript:alert(1))')).toBe('click')
  })

  it('keeps raw HTML as visible text', () => {
    const result = forumMarkdownToDoc('<img src=x onerror=alert(1)>')
    expect(result.content?.[0]).toEqual(p(t('<img src=x onerror=alert(1)>')))
  })

  it('always returns at least one paragraph', () => {
    expect(forumMarkdownToDoc('')).toEqual(doc({ type: 'paragraph' }))
  })
})

describe('forumDocToMarkdown', () => {
  it('escapes typed syntax so it stays literal', () => {
    const md = forumDocToMarkdown(doc(p(t('2*3*4 and [x](y) and `tick` and _under_'))))
    expect(md).toBe('2\\*3\\*4 and \\[x\\](y) and \\`tick\\` and \\_under\\_')
    expect(forumMarkdownPlainText(md)).toBe('2*3*4 and [x](y) and `tick` and _under_')
  })

  it('leaves snake_case, handles and URLs readable', () => {
    expect(forumDocToMarkdown(doc(p(t('ask @claw_lord about snake_case at https://e.com/a_b'))))).toBe(
      'ask @claw_lord about snake_case at https://e.com/a_b',
    )
  })

  it('escapes block syntax only at line start', () => {
    const md = forumDocToMarkdown(doc(p(t('# not a heading'), { type: 'hardBreak' }, t('- not a list'), { type: 'hardBreak' }, t('1. nor this'), { type: 'hardBreak' }, t('> nor this'))))
    expect(md).toBe('\\# not a heading\n\\- not a list\n1\\. nor this\n\\> nor this')
    expect(forumMarkdownToDoc(md)).toEqual(
      doc(p(t('# not a heading'), { type: 'hardBreak' }, t('- not a list'), { type: 'hardBreak' }, t('1. nor this'), { type: 'hardBreak' }, t('> nor this'))),
    )
  })

  it('moves edge spaces outside of marks', () => {
    expect(forumDocToMarkdown(doc(p(t('a'), t(' bold ', { type: 'bold' }), t('b'))))).toBe('a **bold** b')
  })

  it('merges neighbouring marked text', () => {
    expect(
      forumDocToMarkdown(doc(p(t('both', { type: 'bold' }, { type: 'italic' }), t(' just bold', { type: 'bold' })))),
    ).toBe('***both* just bold**')
  })

  it('serializes code with enough backticks', () => {
    expect(forumDocToMarkdown(doc(p(t('a`b', { type: 'code' }))))).toBe('``a`b``')
    expect(forumDocToMarkdown(doc({ type: 'codeBlock', content: [t('```\nx')] }))).toBe('````\n```\nx\n````')
  })

  it('keeps link targets intact', () => {
    expect(
      forumDocToMarkdown(doc(p(t('site', { type: 'link', attrs: { href: 'https://e.com/a_(b)' } })))),
    ).toBe('[site](https://e.com/a_%28b%29)')
  })

  it('keeps two lists apart', () => {
    const md = forumDocToMarkdown(
      doc(
        { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('a'))] }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('b'))] }] },
      ),
    )
    expect(forumMarkdownToDoc(md).content).toHaveLength(2)
  })

  it('drops empty paragraphs', () => {
    expect(forumDocToMarkdown(doc(p(), p(t('x')), p()))).toBe('x')
  })
})

describe('round trips', () => {
  it.each([
    'plain words',
    'line one\nline two',
    '**bold** and *italic* and `code`',
    '[a link](https://moltology.com/forum)',
    '- one\n- two\n  - nested',
    '1. one\n2. two',
    '> @claw_lord held:\n> Ask before you molt.\n\nI agree.',
    '> Architect Vaelen held:\n> This transmission was withdrawn.',
    '```\nconst a = 1\n  indented\n```',
    'Hail @pincer_prime and @claw_lord.',
    'a\n\nb',
  ])('%s', (md) => {
    expect(roundTrip(md)).toBe(md)
  })

  it('is stable after one pass for older free-form posts', () => {
    for (const md of [
      '# Heading\nbody',
      '> quote\nreply without a blank line',
      '<b>html</b> & stuff',
      '* star list\n* item',
      '![pic](https://e.com/p.png)',
      'trailing spaces   \nnext',
    ]) {
      const once = roundTrip(md)
      expect(roundTrip(once)).toBe(once)
    }
  })
})

describe('plain text helpers', () => {
  it('counts visible text only', () => {
    expect(forumMarkdownPlainText('**hi** there')).toBe('hi there')
    // marked reads this as a divider, which carries no text.
    expect(isForumMarkdownBlank('** **')).toBe(true)
    expect(isForumMarkdownBlank('`x`')).toBe(false)
    expect(isForumMarkdownBlank('   ')).toBe(true)
  })

  it('escapeForumText handles backslashes before punctuation only', () => {
    expect(escapeForumText('C:\\path\\*', false)).toBe('C:\\path\\\\\\*')
  })
})
