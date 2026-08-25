import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateRssFeedXml, generateSitemapXml } from '@/lib/seo'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'

vi.mock('@/lib/server/api', () => ({
  getBlogPostsFn: vi.fn(),
}))

import { getBlogPostsFn } from '@/lib/server/api'
import { loadPublishedBlogPosts, rssXmlResponse, sitemapXmlResponse } from './document-feeds'

describe('published document feeds', () => {
  beforeEach(() => {
    vi.mocked(getBlogPostsFn).mockReset()
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
  })
})
