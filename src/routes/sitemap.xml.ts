import { createFileRoute } from '@tanstack/react-router'
import { generateSitemapXml } from '@/lib/seo'
import { getBlogPostsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, BlogPostData } from '@/lib/blog-data'

export const Route = createFileRoute('/sitemap/xml')({
  loader: async () => {
    let posts: BlogPostData[] = INITIAL_BLOG_POSTS
    try {
      const fetched = await getBlogPostsFn()
      if (fetched && fetched.length > 0) {
        posts = fetched as BlogPostData[]
      }
    } catch (e) {
      console.warn('Error fetching posts for sitemap.xml:', e)
    }

    const xml = generateSitemapXml(posts, 'https://moltology.org')

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  },
})
