import React from 'react'
import { Link } from '@tanstack/react-router'
import { splitForumMentionParts } from '@/lib/forum-mentions'

export function ForumMentionBody({
  content,
  className,
  testId,
}: {
  content: string
  className?: string
  testId?: string
}) {
  const parts = splitForumMentionParts(content)

  return (
    <div className={className} data-testid={testId}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <React.Fragment key={`t-${index}`}>{part.value}</React.Fragment>
        }
        return (
          <Link
            key={`m-${index}-${part.handle}`}
            to="/member/$profileId"
            params={{ profileId: part.handle }}
            className="text-[#00c3ff] font-bold hover:text-[#00ffff] transition-colors"
            data-testid="forum-mention-link"
          >
            @{part.handle}
          </Link>
        )
      })}
    </div>
  )
}
