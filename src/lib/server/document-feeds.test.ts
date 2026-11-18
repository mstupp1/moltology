import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateRssFeedXml, generateSitemapXml } from '@/lib/seo'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'

vi.mock('@/lib/server/api', () => ({
  getBlogPostsFn: vi.fn(),
  getForumCategoriesFn: vi.fn(),
  getForumTopicsFn: vi.fn(),
}))

vi.mock('@/lib/server/academy-api', () => ({
  getAcademyHomeFn: vi.fn(),
  getAcademyCourseFn: vi.fn(),
}))

import { getBlogPostsFn, getForumCategoriesFn, getForumTopicsFn } from '@/lib/server/api'
import { getAcademyCourseFn, getAcademyHomeFn } from '@/lib/server/academy-api'
import {
  loadAcademySitemapEntries,
  loadForumSitemapEntries,
  loadPublishedBlogPosts,
  rssXmlResponse,
  sitemapXmlResponse,
} from './document-feeds'

describe('published document feeds', () => {
  beforeEach(() => {
    vi.mocked(getBlogPostsFn).mockReset()
    vi.mocked(getForumCategoriesFn).mockReset().mockResolvedValue([] as never)
    vi.mocked(getForumTopicsFn).mockReset().mockResolvedValue([] as never)
    vi.mocked(getAcademyHomeFn).mockReset().mockResolvedValue({ tracks: [], courses: [] } as never)
    vi.mocked(getAcademyCourseFn).mockReset()
  })

  it('uses live published posts when the listing source returns them', async () => {
    const livePosts = [
      {
        ...INITIAL_BLOG_POSTS[0],
        slug: 'world-foundation-models-pixel-ecdysis-latent-jepa',
        title: 'World Foundation Models',
      },
    ]
    vi.mocked(getBlogPostsFn).mockResolvedValue(livePosts as never)

    const posts = await loadPublishedBlogPosts()
    expect(posts.map((post) => post.slug)).toEqual([
      'world-foundation-models-pixel-ecdysis-latent-jepa',
    ])
  })

  it('falls back to seed posts when the listing source is empty or fails', async () => {
    vi.mocked(getBlogPostsFn).mockResolvedValue([] as never)
    await expect(loadPublishedBlogPosts()).resolves.toEqual(INITIAL_BLOG_POSTS)

    vi.mocked(getBlogPostsFn).mockRejectedValue(new Error('trench silent'))
    await expect(loadPublishedBlogPosts()).resolves.toEqual(INITIAL_BLOG_POSTS)
  })

  it('builds rss.xml and sitemap.xml from the same published post list as /news', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T23:00:00.000Z'))
    try {
      const livePosts = [
        {
          ...INITIAL_BLOG_POSTS[0],
          slug: 'world-foundation-models-pixel-ecdysis-latent-jepa',
          title: 'World Foundation Models',
          summary: 'Latent JEPA ecdysis on the wire.',
          publishedAt: '2026-08-24T00:00:00.000Z',
        },
      ]
      vi.mocked(getBlogPostsFn).mockResolvedValue(livePosts as never)

      const rss = await rssXmlResponse()
      const sitemap = await sitemapXmlResponse()
      const rssXml = await rss.text()
      const sitemapXml = await sitemap.text()

      expect(rss.headers.get('Content-Type')).toContain('application/rss+xml')
      expect(sitemap.headers.get('Content-Type')).toContain('application/xml')
      expect(rssXml).toBe(generateRssFeedXml(livePosts, 'https://moltology.org'))
      expect(sitemapXml).toBe(generateSitemapXml(livePosts, 'https://moltology.org'))
      expect(sitemapXml).toContain(
        '<loc>https://moltology.org/news/world-foundation-models-pixel-ecdysis-latent-jepa</loc>',
      )
      expect(rssXml).toContain(
        '<link>https://moltology.org/news/world-foundation-models-pixel-ecdysis-latent-jepa</link>',
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('lists forum boards and topics, skipping removed ones', async () => {
    vi.mocked(getForumCategoriesFn).mockResolvedValue([{ slug: 'general' }, { slug: '' }] as never)
    vi.mocked(getForumTopicsFn).mockResolvedValue([
      { slug: 'first-molt', categorySlug: 'general', lastReplyAt: '2026-11-10T12:00:00.000Z', createdAt: '2026-11-01T00:00:00.000Z' },
      { slug: 'gone', categorySlug: 'general', deletedAt: '2026-11-02T00:00:00.000Z', lastReplyAt: '2026-11-10T12:00:00.000Z', createdAt: '2026-11-01T00:00:00.000Z' },
    ] as never)

    const entries = await loadForumSitemapEntries('https://moltology.org')

    expect(entries.map((e) => e.loc)).toEqual([
      'https://moltology.org/forum/general',
      'https://moltology.org/forum/general/first-molt',
    ])
    expect(entries[1].lastmod).toBe('2026-11-10')
    // A short page means there is nothing older to ask for.
    expect(getForumTopicsFn).toHaveBeenCalledTimes(1)
  })

  it('pages through topics up to the cap and survives a failed lookup', async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ slug: `t-${i}`, categorySlug: 'general', createdAt: '2026-11-01T00:00:00.000Z' }))
    vi.mocked(getForumTopicsFn).mockResolvedValue(full as never)
    const entries = await loadForumSitemapEntries('https://moltology.org')
    expect(getForumTopicsFn).toHaveBeenCalledTimes(5)
    expect(entries).toHaveLength(500)

    vi.mocked(getForumCategoriesFn).mockRejectedValue(new Error('down'))
    await expect(loadForumSitemapEntries('https://moltology.org')).resolves.toEqual([])
  })

  it('lists published Academy tracks, courses and preview lessons, and survives a failed course lookup', async () => {
    vi.mocked(getAcademyHomeFn).mockResolvedValue({
      tracks: [{ slug: 'first-molt' }],
      courses: [{ slug: 'introduction-to-ecdysis' }, { slug: 'deep-water' }],
    } as never)
    vi.mocked(getAcademyCourseFn).mockImplementation((async ({ data }: { data: { slug: string } }) => {
      if (data.slug === 'deep-water') throw new Error('trench silent')
      return { modules: [{ lessons: [{ slug: 'first-shed-check', isPreview: true }, { slug: 'what-to-put-down-this-week', isPreview: false }] }] }
    }) as never)

    const entries = await loadAcademySitemapEntries('https://moltology.org')
    expect(entries.map((entry) => entry.loc)).toEqual([
      'https://moltology.org/academy/tracks/first-molt',
      'https://moltology.org/academy/courses/introduction-to-ecdysis',
      'https://moltology.org/academy/courses/introduction-to-ecdysis/lessons/first-shed-check',
      'https://moltology.org/academy/courses/deep-water',
    ])
    expect(entries.some((entry) => entry.loc.includes('/certificates/'))).toBe(false)

    vi.mocked(getAcademyHomeFn).mockRejectedValue(new Error('catalog down'))
    await expect(loadAcademySitemapEntries('https://moltology.org')).resolves.toEqual([])
  })
})
