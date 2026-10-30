import { describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { INITIAL_BLOG_POSTS } from '../blog-data'
import { getBlogPostBySlugHandler } from './db-services'

function blogDb(rows: Array<{ slug: string; isPublished: boolean; [key: string]: unknown }> = []) {
  let matchingRows = rows
  const limit = vi.fn().mockImplementation(() => Promise.resolve(matchingRows))
  const query: { from: () => typeof query; where: ReturnType<typeof vi.fn>; limit: typeof limit } = {
    from: () => query,
    where: vi.fn((condition: unknown) => {
      const { params } = new PgDialect().sqlToQuery(condition as never)
      matchingRows = rows.filter((row) => row.slug === params[0] && row.isPublished === params[1])
      return query
    }),
    limit,
  }
  return { select: vi.fn(() => query), query }
}

const draftRecord = {
  id: 'draft-1',
  slug: 'private-draft',
  title: 'Private draft',
  summary: 'Not for public viewing',
  content: 'Unpublished article body',
  coverImageUrl: null,
  authorName: 'Author',
  authorAvatar: null,
  authorRole: null,
  category: 'Research',
  tags: [],
  readTimeMinutes: 1,
  views: 0,
  likes: 0,
  isFeatured: false,
  isPublished: false,
  publishedAt: null,
}

describe('getBlogPostBySlugHandler publication boundary', () => {
  it('queries only published rows and does not return an unpublished database post', async () => {
    const db = blogDb([draftRecord])
    const result = await getBlogPostBySlugHandler({ data: draftRecord.slug, context: { db: db as never } })

    expect(result).toBeNull()
    const predicate = db.query.where.mock.calls[0][0]
    const sql = new PgDialect().sqlToQuery(predicate)
    expect(sql.sql).toContain('"blog_posts"."slug" =')
    expect(sql.sql).toContain('"blog_posts"."isPublished" =')
    expect(sql.params).toContain(draftRecord.slug)
    expect(sql.params).toContain(true)
  })

  it('returns the full content of a published database post', async () => {
    const published = { ...draftRecord, id: 'published-1', slug: 'published-article', isPublished: true }
    const result = await getBlogPostBySlugHandler({
      data: published.slug,
      context: { db: blogDb([published]) as never },
    })

    expect(result).toMatchObject({
      slug: published.slug,
      content: published.content,
      isPublished: true,
    })
  })

  it('returns null for an unknown slug', async () => {
    const result = await getBlogPostBySlugHandler({
      data: 'not-a-real-article',
      context: { db: blogDb() as never },
    })

    expect(result).toBeNull()
  })

  it('keeps explicitly published static fallback articles available and excludes unpublished ones', async () => {
    const publishedSeed = INITIAL_BLOG_POSTS.find((post) => post.isPublished === true)
    expect(publishedSeed).toBeDefined()
    const publishedResult = await getBlogPostBySlugHandler({
      data: publishedSeed!.slug,
      context: { db: blogDb() as never },
    })
    expect(publishedResult).toMatchObject({ slug: publishedSeed!.slug, content: publishedSeed!.content, isPublished: true })

    const privateSeed = { ...publishedSeed!, slug: 'private-static-fallback', isPublished: false }
    INITIAL_BLOG_POSTS.push(privateSeed)
    try {
      const privateResult = await getBlogPostBySlugHandler({
        data: privateSeed.slug,
        context: { db: blogDb() as never },
      })
      expect(privateResult).toBeNull()
    } finally {
      INITIAL_BLOG_POSTS.pop()
    }
  })
})
