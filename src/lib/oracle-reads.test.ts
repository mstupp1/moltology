import { describe, expect, it } from 'vitest'
import { decodeReadsHeader, encodeReadsHeader, oracleReadsLabel, oracleReadsLink, readReadsPart } from './oracle-reads'

describe('oracle reads label', () => {
  it('says what the Oracle read in plain words', () => {
    expect(oracleReadsLabel([{ kind: 'forum-list', count: 5 }])).toBe('Read 5 forum topics')
    expect(oracleReadsLabel([{ kind: 'forum-list', count: 1 }, { kind: 'forum-thread', count: 1 }])).toBe('Read 1 forum topic · Read a forum thread')
    expect(oracleReadsLabel([{ kind: 'codex', count: 2 }, { kind: 'codex', count: 1 }])).toBe('Searched the Codex')
    expect(oracleReadsLabel([])).toBe('')
  })

  it('links only when one page was read', () => {
    expect(oracleReadsLink([{ kind: 'forum-thread', count: 1, title: 'T', href: '/forum/a/b' }])).toEqual({ title: 'T', href: '/forum/a/b' })
    expect(oracleReadsLink([{ kind: 'forum-list', count: 3 }])).toBeNull()
  })

  it('round-trips the header and drops anything malformed', () => {
    const items = [{ kind: 'news' as const, count: 1, title: 'Édge — AI', href: '/news/edge' }]
    expect(decodeReadsHeader(encodeReadsHeader(items))).toEqual(items)
    expect(decodeReadsHeader('%%%')).toEqual([])
    expect(decodeReadsHeader(encodeURIComponent(JSON.stringify([{ kind: 'secret', count: 1 }, { kind: 'news', count: 2, href: '//evil.example', title: 'x' }])))).toEqual([{ kind: 'news', count: 2 }])
  })

  it('reads the saved part back from a message', () => {
    expect(readReadsPart([{ type: 'skill', id: 'x' }, { type: 'reads', items: [{ kind: 'changelog', count: 3 }] }])).toEqual([{ kind: 'changelog', count: 3 }])
    expect(readReadsPart(null)).toEqual([])
  })
})
