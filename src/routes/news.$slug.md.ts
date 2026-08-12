import { createFileRoute } from '@tanstack/react-router'
import { generateSinglePostMarkdown } from '@/lib/markdown-generator'
import { getBlogPostBySlugFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, BlogPostData } from '@/lib/blog-data'

export const Route = createFileRoute('/news/$slug/md')({
  loader: async ({ params }) => {
    let post: BlogPostData | null = null
    try {
      const res = await getBlogPostBySlugFn({ data: params.slug })
      if (res) post = res as BlogPostData
    } catch (e) {
      console.warn('Error fetching post for markdown route:', e)
    }

    if (!post) {
      post = INITIAL_BLOG_POSTS.find((p) => p.slug === params.slug) ?? null
    }

    if (!post) {
      return new Response('# 404 Not Found\n\nThe requested dispatch was not found in the Benthic Registry.', {
        status: 404,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      })
    }

    const md = generateSinglePostMarkdown(post)
    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  },
})
