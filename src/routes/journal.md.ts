import { createFileRoute } from '@tanstack/react-router'
import { generateJournalMarkdown } from '@/lib/markdown-generator'

export const Route = createFileRoute('/journal/md')({
  loader: async () => {
    const md = generateJournalMarkdown()
    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  },
})
