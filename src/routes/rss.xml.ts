import { createFileRoute } from '@tanstack/react-router'
import { generateRssFeedXml } from '@/lib/seo'
import { getBlogPostsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, BlogPostData } from '@/lib/blog-data'

export const Route = createFileRoute('/rss/xml')({
  loader: async () => {
    let posts: BlogPostData[] = INITIAL_BLOG_POSTS
    try {
      const fetched = await getBlogPostsFn()
      if (fetched && fetched.length > 0) {
        posts = fetched as BlogPostData[]
      }
    } catch (e) {
      console.warn('Error fetching posts for rss.xml:', e)
    }

    const xml = generateRssFeedXml(posts, 'https://moltology.org')

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
      },
    })
  },
})
