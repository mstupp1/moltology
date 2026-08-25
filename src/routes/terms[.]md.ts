import { createFileRoute } from '@tanstack/react-router'
import { generateTermsMarkdown } from '@/lib/markdown-generator'
import { markdownDocumentResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/terms.md')({
  server: {
    handlers: {
      GET: async () =>
        markdownDocumentResponse(generateTermsMarkdown(), 'public, max-age=86400, s-maxage=604800'),
    },
  },
})
