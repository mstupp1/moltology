import { createFileRoute } from '@tanstack/react-router'
import { generatePrivacyMarkdown } from '@/lib/markdown-generator'
import { markdownDocumentResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/privacy.md')({
  server: {
    handlers: {
      GET: async () =>
        markdownDocumentResponse(generatePrivacyMarkdown(), 'public, max-age=86400, s-maxage=604800'),
    },
  },
})
