import { createFileRoute } from '@tanstack/react-router'
import { generateNewsIndexMarkdown } from '@/lib/markdown-generator'
import { loadPublishedBlogPosts, markdownDocumentResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/news.md')({
  server: {
    handlers: {
      GET: async () => {
        const posts = await loadPublishedBlogPosts()
        return markdownDocumentResponse(
          generateNewsIndexMarkdown(posts),
          'public, max-age=1800, s-maxage=3600',
        )
      },
    },
  },
})
