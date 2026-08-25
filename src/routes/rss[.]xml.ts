import { createFileRoute } from '@tanstack/react-router'
import { rssXmlResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async () => rssXmlResponse(),
    },
  },
})
