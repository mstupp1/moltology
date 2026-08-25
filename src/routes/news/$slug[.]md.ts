import { createFileRoute } from '@tanstack/react-router'
import { generateSinglePostMarkdown } from '@/lib/markdown-generator'
import { getBlogPostBySlugFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, type BlogPostData } from '@/lib/blog-data'
import { markdownDocumentResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/news/$slug.md')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const pathname = new URL(request.url).pathname
        const slugFromPath = pathname.match(/^\/news\/(.+)\.md$/)?.[1]
        const slug = slugFromPath || params.slug || (params as Record<string, string | undefined>)['slug.md']

        if (!slug) {
          return markdownDocumentResponse(
            '# 404 Not Found\n\nThe requested dispatch was not found in the Benthic Registry.',
            'public, max-age=60',
            404,
          )
        }

        let post: BlogPostData | null = null
        try {
          const res = await getBlogPostBySlugFn({ data: slug })
          if (res) post = res as BlogPostData
        } catch (error) {
          console.warn('Error fetching post for markdown route:', error)
        }

        if (!post) {
          post = INITIAL_BLOG_POSTS.find((candidate) => candidate.slug === slug) ?? null
        }

        if (!post) {
          return markdownDocumentResponse(
            '# 404 Not Found\n\nThe requested dispatch was not found in the Benthic Registry.',
            'public, max-age=60',
            404,
          )
        }

        return markdownDocumentResponse(
          generateSinglePostMarkdown(post),
          'public, max-age=3600, s-maxage=86400',
        )
      },
    },
  },
})
