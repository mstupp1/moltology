import { createFileRoute } from '@tanstack/react-router'
import { generatePrivacyMarkdown } from '@/lib/markdown-generator'

export const Route = createFileRoute('/privacy/md')({
  loader: async () => {
    const md = generatePrivacyMarkdown()
    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  },
})
