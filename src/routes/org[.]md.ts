import { createFileRoute } from '@tanstack/react-router'
import { generateOrgMarkdown } from '@/lib/markdown-generator'
import { markdownDocumentResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/org.md')({
  server: {
    handlers: {
      GET: async () =>
        markdownDocumentResponse(generateOrgMarkdown(), 'public, max-age=3600, s-maxage=86400'),
    },
  },
})
