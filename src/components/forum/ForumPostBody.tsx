import React from 'react'
import { Link } from '@tanstack/react-router'
import { ForumMentionBody } from '@/components/forum/ForumMentionBody'
import {
  FORUM_QUOTE_WITHDRAWN_BODY,
  parseForumContentBlocks,
  type ForumQuoteAttribution,
} from '@/lib/forum-quotes'

const MAX_QUOTE_NEST = 4

function QuoteAttribution({ attribution }: { attribution: ForumQuoteAttribution }) {
  return (
    <p className="text-[10px] text-[#839493]" data-testid="forum-quote-attribution">
      {attribution.handle ? (
        <Link
          to="/member/$profileId"
          params={{ profileId: attribution.handle }}
          className="text-[#00c3ff] font-bold hover:text-[#00ffff] transition-colors"
        >
          @{attribution.handle}
        </Link>
      ) : (
        <span className="text-[#dfe3e3] font-bold">{attribution.name}</span>
      )}
      <span> held</span>
    </p>
  )
}

function ForumQuoteChrome({
  attribution,
  inner,
  depth,
}: {
  attribution: ForumQuoteAttribution | null
  inner: string
  depth: number
}) {
  const withdrawn = inner.trim() === FORUM_QUOTE_WITHDRAWN_BODY

  return (
    <blockquote
      data-testid="forum-quote-block"
      className="border-l-2 border-[#00ffff]/60 bg-[#00ffff]/[0.04] pl-3 pr-2 py-2 chamfer-corner space-y-1.5"
    >
      {attribution && <QuoteAttribution attribution={attribution} />}
      {withdrawn ? (
        <p className="text-xs text-[#839493] italic leading-relaxed">{inner.trim()}</p>
      ) : (
        <ForumPostBody content={inner} depth={depth + 1} className="space-y-1.5" />
      )}
    </blockquote>
  )
}

export function ForumPostBody({
  content,
  className,
  testId,
  depth = 0,
}: {
  content: string
  className?: string
  testId?: string
  depth?: number
}) {
  const blocks = parseForumContentBlocks(content)
  const mentionClass =
    'text-xs sm:text-sm text-[#dfe3e3] leading-relaxed whitespace-pre-wrap'

  if (depth >= MAX_QUOTE_NEST) {
    return <ForumMentionBody content={content} className={mentionClass} testId={testId} />
  }

  if (blocks.length === 0) {
    return <ForumMentionBody content={content} className={mentionClass} testId={testId} />
  }

  if (blocks.length === 1 && blocks[0].type === 'text') {
    return <ForumMentionBody content={blocks[0].value} className={mentionClass} testId={testId} />
  }

  return (
    <div className={className ?? 'space-y-2'} data-testid={testId}>
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          if (!block.value.trim()) return null
          return (
            <ForumMentionBody
              key={`t-${index}`}
              content={block.value}
              className={mentionClass}
            />
          )
        }
        return (
          <ForumQuoteChrome
            key={`q-${index}`}
            attribution={block.attribution}
            inner={block.inner}
            depth={depth}
          />
        )
      })}
    </div>
  )
}
