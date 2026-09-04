import { describe, it, expect } from 'vitest'
import {
  slugifyForumTitle,
  hotScore,
  compareHot,
  relativeTime,
  buildForumPostTree,
  forumReplyIndentDepth,
  getPostDepth,
  FORUM_REPLY_MAX_INDENT_DEPTH,
} from './forum-utils'

describe('slugifyForumTitle', () => {
  it('kebab-cases a title and appends a suffix', () => {
    const slug = slugifyForumTitle('  How to Shed Bad Habits!  ')
    expect(slug).toMatch(/^how-to-shed-bad-habits-[a-z0-9]{4}$/)
  })

  it('collapses punctuation and repeated whitespace', () => {
    const slug = slugifyForumTitle('A..B___C   D!!!')
    expect(slug).toMatch(/^ab-c-d-[a-z0-9]{4}$/)
  })

  it('falls back to a timestamp-based slug for empty input', () => {
    const slug = slugifyForumTitle('   ')
    expect(slug).toMatch(/^topic-[a-z0-9]+$/)
  })
})

describe('hotScore', () => {
  it('ranks newer posts above older posts with equal votes', () => {
    const newer = hotScore(10, '2026-08-21T00:00:00.000Z')
    const older = hotScore(10, '2026-08-01T00:00:00.000Z')
    expect(newer).toBeGreaterThan(older)
  })

  it('ranks higher-voted posts above lower-voted posts', () => {
    const high = hotScore(50, '2026-08-01T00:00:00.000Z')
    const low = hotScore(5, '2026-08-01T00:00:00.000Z')
    expect(high).toBeGreaterThan(low)
  })
})

describe('compareHot', () => {
  it('sorts hottest first', () => {
    const posts = [
      { upvotes: 3, createdAt: '2026-08-01T00:00:00.000Z' },
      { upvotes: 100, createdAt: '2026-08-20T00:00:00.000Z' },
      { upvotes: 40, createdAt: '2026-08-10T00:00:00.000Z' },
    ]
    const sorted = [...posts].sort(compareHot)
    expect(sorted[0].upvotes).toBe(100)
  })
})

describe('relativeTime', () => {
  it('returns minutes, hours, days and absolute date', () => {
    const now = Date.now()
    const mins = new Date(now - 5 * 60 * 1000).toISOString()
    const hrs = new Date(now - 3 * 60 * 60 * 1000).toISOString()
    const days = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
    const year = new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString()

    expect(relativeTime(mins)).toBe('5m ago')
    expect(relativeTime(hrs)).toBe('3h ago')
    expect(relativeTime(days)).toBe('2d ago')
    expect(relativeTime(year)).toMatch(/\d{4}/)
  })

  it('handles invalid input gracefully', () => {
    expect(relativeTime('not-a-date')).toBe('')
  })
})

describe('buildForumPostTree', () => {
  const posts = [
    { id: 'a', parentId: null, upvotes: 1, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'b', parentId: 'a', upvotes: 5, createdAt: '2026-08-02T00:00:00.000Z' },
    { id: 'c', parentId: 'a', upvotes: 2, createdAt: '2026-08-01T12:00:00.000Z' },
    { id: 'd', parentId: 'missing', upvotes: 0, createdAt: '2026-08-03T00:00:00.000Z' },
  ]

  it('nests children under parents and promotes orphans to roots', () => {
    const tree = buildForumPostTree(posts, 'oldest')
    expect(tree.map((n) => n.post.id)).toEqual(['a', 'd'])
    expect(tree[0].children.map((n) => n.post.id)).toEqual(['c', 'b'])
    expect(tree[0].children[0].depth).toBe(1)
  })

  it('sorts siblings by top then oldest tiebreak', () => {
    const tree = buildForumPostTree(posts, 'top')
    expect(tree[0].children.map((n) => n.post.id)).toEqual(['b', 'c'])
  })

  it('sorts siblings newest first', () => {
    const tree = buildForumPostTree(posts, 'newest')
    expect(tree[0].children.map((n) => n.post.id)).toEqual(['b', 'c'])
  })
})

describe('forumReplyIndentDepth', () => {
  it('caps visual indent at the max depth', () => {
    expect(forumReplyIndentDepth(0)).toBe(0)
    expect(forumReplyIndentDepth(3)).toBe(3)
    expect(forumReplyIndentDepth(FORUM_REPLY_MAX_INDENT_DEPTH + 4)).toBe(FORUM_REPLY_MAX_INDENT_DEPTH)
  })
})

describe('getPostDepth', () => {
  it('counts ancestors for nested posts', () => {
    const byId = new Map([
      ['a', { id: 'a', parentId: null }],
      ['b', { id: 'b', parentId: 'a' }],
      ['c', { id: 'c', parentId: 'b' }],
    ])
    expect(getPostDepth('a', byId)).toBe(0)
    expect(getPostDepth('b', byId)).toBe(1)
    expect(getPostDepth('c', byId)).toBe(2)
  })
})
