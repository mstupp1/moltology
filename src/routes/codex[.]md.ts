import { createFileRoute } from '@tanstack/react-router'
import { generateCodexMarkdown } from '@/lib/markdown-generator'
import { markdownDocumentResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/codex.md')({
  server: {
    handlers: {
      GET: async () =>
        markdownDocumentResponse(generateCodexMarkdown(), 'public, max-age=3600, s-maxage=86400'),
    },
  },
})
