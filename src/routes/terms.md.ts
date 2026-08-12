import { createFileRoute } from '@tanstack/react-router'
import { generateTermsMarkdown } from '@/lib/markdown-generator'

export const Route = createFileRoute('/terms/md')({
  loader: async () => {
    const md = generateTermsMarkdown()
    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  },
})
