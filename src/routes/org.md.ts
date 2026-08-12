import { createFileRoute } from '@tanstack/react-router'
import { generateOrgMarkdown } from '@/lib/markdown-generator'

export const Route = createFileRoute('/org/md')({
  loader: async () => {
    const md = generateOrgMarkdown()
    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  },
})
