import { createFileRoute } from '@tanstack/react-router'
import { sitemapXmlResponse } from '@/lib/server/document-feeds'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => sitemapXmlResponse(),
    },
  },
})
