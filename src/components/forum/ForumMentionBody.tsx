import React from 'react'
import { Link } from '@tanstack/react-router'
import { splitForumMentionParts } from '@/lib/forum-mentions'

/**
 * Parses inline markdown tokens (bold, italic, inline code, external links)
 * while preserving surrounding text.
 */
function renderInlineFormatting(text: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g
  const tokens = text.split(tokenRegex)

  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`
    if (!token) return null

    // Inline code: `code`
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={key}
          className="bg-[#040708] border border-cyan-900/60 text-cyan-200 px-1.5 py-0.5 rounded font-mono text-[11px] sm:text-xs"
        >
          {token.slice(1, -1)}
        </code>
      )
    }

    // Bold: **text**
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={key} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      )
    }

    // Italic: *text*
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={key} className="italic text-cyan-200">
          {token.slice(1, -1)}
        </em>
      )
    }

    // External link: [text](https://...)
    const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-medium"
        >
          {linkMatch[1]}
        </a>
      )
    }

    return <React.Fragment key={key}>{token}</React.Fragment>
  })
}

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
    <p className={className} data-testid={testId}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <React.Fragment key={`t-${index}`}>
              {renderInlineFormatting(part.value, `fmt-${index}`)}
            </React.Fragment>
          )
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
    </p>
  )
}
