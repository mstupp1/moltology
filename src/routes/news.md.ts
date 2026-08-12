import { createFileRoute } from '@tanstack/react-router'
import { generateNewsIndexMarkdown } from '@/lib/markdown-generator'
import { getBlogPostsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, BlogPostData } from '@/lib/blog-data'

export const Route = createFileRoute('/news/md')({
  loader: async () => {
    let posts: BlogPostData[] = INITIAL_BLOG_POSTS
    try {
      const fetched = await getBlogPostsFn()
      if (fetched && fetched.length > 0) {
        posts = fetched as BlogPostData[]
      }
    } catch (e) {
      console.warn('Error fetching posts for news.md:', e)
    }

    const md = generateNewsIndexMarkdown(posts)
    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
      },
    })
  },
})
