import { afterEach, describe, expect, it, vi } from 'vitest'
import { INITIAL_BLOG_POSTS } from '../../lib/blog-data'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => ({ ...config as object, options: config }),
}))
vi.mock('@/lib/server/api', () => ({ getBlogPostBySlugFn: vi.fn() }))

import { getBlogPostBySlugFn } from '@/lib/server/api'
import { Route as ArticleRoute } from './$slug'
import { Route as MarkdownRoute } from './{$slug}[.]md'

const privateSeed = {
  ...INITIAL_BLOG_POSTS[0],
  slug: 'private-route-fallback',
  isPublished: false,
}

afterEach(() => {
  const index = INITIAL_BLOG_POSTS.indexOf(privateSeed)
  if (index !== -1) INITIAL_BLOG_POSTS.splice(index, 1)
  vi.resetAllMocks()
})

describe('public news route fallback publication boundary', () => {
  it('does not return an unpublished static fallback from the article loader', async () => {
    INITIAL_BLOG_POSTS.push(privateSeed)
    vi.mocked(getBlogPostBySlugFn).mockResolvedValue(null as never)

    const post = await (ArticleRoute.options as any).loader({ params: { slug: privateSeed.slug } })

    expect(post).toBeNull()
  })

  it('returns an explicitly published static fallback from the article loader', async () => {
    const published = INITIAL_BLOG_POSTS.find((post) => post.isPublished === true)!
    vi.mocked(getBlogPostBySlugFn).mockResolvedValue(null as never)

    const post = await (ArticleRoute.options as any).loader({ params: { slug: published.slug } })

    expect(post).toMatchObject({ slug: published.slug, content: published.content, isPublished: true })
  })

  it('returns 404 for an unpublished static fallback from the Markdown handler', async () => {
    INITIAL_BLOG_POSTS.push(privateSeed)
    vi.mocked(getBlogPostBySlugFn).mockResolvedValue(null as never)

    const response = await (MarkdownRoute.options as any).server.handlers.GET({
      request: new Request(`https://moltology.org/news/${privateSeed.slug}.md`),
      params: { slug: privateSeed.slug },
    })

    expect(response.status).toBe(404)
  })

  it('keeps an explicitly published static fallback available as Markdown', async () => {
    const published = INITIAL_BLOG_POSTS.find((post) => post.isPublished === true)!
    vi.mocked(getBlogPostBySlugFn).mockResolvedValue(null as never)

    const response = await (MarkdownRoute.options as any).server.handlers.GET({
      request: new Request(`https://moltology.org/news/${published.slug}.md`),
      params: { slug: published.slug },
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toContain(published.title)
  })
})
