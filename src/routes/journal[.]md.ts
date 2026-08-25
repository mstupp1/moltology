import { createFileRoute } from '@tanstack/react-router'
import { generateJournalMarkdown } from '@/lib/markdown-generator'
import { markdownDocumentResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/journal.md')({
  server: {
    handlers: {
      GET: async () =>
        markdownDocumentResponse(generateJournalMarkdown(), 'public, max-age=3600, s-maxage=86400'),
    },
  },
})
