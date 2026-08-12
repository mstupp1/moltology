import { createFileRoute } from '@tanstack/react-router'
import { generateCodexMarkdown } from '@/lib/markdown-generator'

export const Route = createFileRoute('/codex/md')({
  loader: async () => {
    const md = generateCodexMarkdown()
    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  },
})
