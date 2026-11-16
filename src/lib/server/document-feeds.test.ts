import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateRssFeedXml, generateSitemapXml } from '@/lib/seo'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'

vi.mock('@/lib/server/api', () => ({
  getBlogPostsFn: vi.fn(),
  getForumCategoriesFn: vi.fn(),
  getForumTopicsFn: vi.fn(),
}))

import { getBlogPostsFn, getForumCategoriesFn, getForumTopicsFn } from '@/lib/server/api'
import { loadForumSitemapEntries, loadPublishedBlogPosts, rssXmlResponse, sitemapXmlResponse } from './document-feeds'

describe('published document feeds', () => {
  beforeEach(() => {
    vi.mocked(getBlogPostsFn).mockReset()
    vi.mocked(getForumCategoriesFn).mockReset().mockResolvedValue([] as never)
    vi.mocked(getForumTopicsFn).mockReset().mockResolvedValue([] as never)
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
})
