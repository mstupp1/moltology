import React, { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import type { Token, Tokens } from 'marked'
import { lexForumMarkdown, safeForumHref } from '@/lib/forum-markdown'
import { splitForumMentionParts } from '@/lib/forum-mentions'
import {
  FORUM_QUOTE_WITHDRAWN_BODY,
  parseForumQuoteAttribution,
  type ForumQuoteAttribution,
} from '@/lib/forum-quotes'

/**
 * Renders a stored forum post (markdown) as React elements.
 *
 * Security: nothing here uses innerHTML. Raw HTML in a post is shown as text,
 * and links only render when `safeForumHref` accepts them (absolute http/https).
 */

const MAX_QUOTE_NEST = 4

const PARAGRAPH_CLASS = 'text-xs sm:text-sm text-ink-body leading-relaxed whitespace-pre-wrap break-words'

function QuoteAttribution({ attribution }: { attribution: ForumQuoteAttribution }) {
  return (
    <p className="text-[11px] text-ink-muted" data-testid="forum-quote-attribution">
      {attribution.handle ? (
        <Link
          to="/member/$profileId"
          params={{ profileId: attribution.handle }}
          className="text-cyan-glow font-bold hover:text-cyan-hover transition-colors"
        >
          @{attribution.handle}
        </Link>
      ) : (
        <span className="text-ink font-bold">{attribution.name}</span>
      )}
      <span> held</span>
    </p>
  )
}

function MentionText({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  const parts = splitForumMentionParts(text)
  return (
    <>
      {parts.map((part, index) =>
        part.type === 'text' ? (
          <React.Fragment key={`${keyPrefix}-t${index}`}>{part.value}</React.Fragment>
        ) : (
          <Link
            key={`${keyPrefix}-m${index}`}
            to="/member/$profileId"
            params={{ profileId: part.handle }}
            className="text-cyan-glow font-bold hover:text-cyan-hover transition-colors"
            data-testid="forum-mention-link"
          >
            @{part.handle}
          </Link>
        ),
      )}
    </>
  )
}

function renderInline(tokens: Token[] | undefined, keyPrefix: string, inLink = false): React.ReactNode[] {
  if (!tokens) return []
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`
    switch (token.type) {
      case 'text': {
        const t = token as Tokens.Text
        if (t.tokens?.length) return <React.Fragment key={key}>{renderInline(t.tokens, key, inLink)}</React.Fragment>
        return inLink ? <React.Fragment key={key}>{t.text}</React.Fragment> : <MentionText key={key} text={t.text} keyPrefix={key} />
      }
      case 'escape':
        return <React.Fragment key={key}>{(token as Tokens.Escape).text}</React.Fragment>
      case 'strong':
        return (
          <strong key={key} className="font-bold text-ink">
            {renderInline((token as Tokens.Strong).tokens, key, inLink)}
          </strong>
        )
      case 'em':
        return (
          <em key={key} className="italic text-ink">
            {renderInline((token as Tokens.Em).tokens, key, inLink)}
          </em>
        )
      case 'del':
        return (
          <del key={key} className="text-ink-muted">
            {renderInline((token as Tokens.Del).tokens, key, inLink)}
          </del>
        )
      case 'codespan':
        return (
          <code
            key={key}
            className="bg-abyss border border-line-subtle text-ink px-1.5 py-0.5 rounded-chip font-mono text-[11px] sm:text-xs"
          >
            {(token as Tokens.Codespan).text}
          </code>
        )
      case 'br':
        return <br key={key} />
      case 'link':
      case 'image': {
        const link = token as Tokens.Link | Tokens.Image
        const href = inLink ? null : safeForumHref(link.href)
        const children =
          token.type === 'link' && (link as Tokens.Link).tokens?.length
            ? renderInline((link as Tokens.Link).tokens, key, true)
            : link.text || link.href
        if (!href) return <React.Fragment key={key}>{children}</React.Fragment>
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="text-cyan-glow hover:text-cyan-hover underline underline-offset-2 transition-colors font-medium break-all"
          >
            {children}
          </a>
        )
      }
      default:
        // Inline HTML and anything unknown stays visible as plain text.
        return <React.Fragment key={key}>{token.raw}</React.Fragment>
    }
  })
}

function ForumQuote({ token, depth, keyPrefix }: { token: Tokens.Blockquote; depth: number; keyPrefix: string }) {
  const lines = token.text.split('\n')
  const attribution = parseForumQuoteAttribution(lines[0] ?? '')
  const inner = attribution ? lines.slice(1).join('\n') : token.text
  const withdrawn = inner.trim() === FORUM_QUOTE_WITHDRAWN_BODY

  return (
    <blockquote
      data-testid="forum-quote-block"
      className="border-l-2 border-cyan-glow/50 bg-surface-2/60 pl-3 pr-2 py-2 rounded-r-control space-y-1.5"
    >
      {attribution && <QuoteAttribution attribution={attribution} />}
      {withdrawn ? (
        <p className="text-xs text-ink-muted italic leading-relaxed">{inner.trim()}</p>
      ) : depth + 1 >= MAX_QUOTE_NEST ? (
        <p className={PARAGRAPH_CLASS}>{inner}</p>
      ) : (
        <ForumBlocks tokens={lexForumMarkdown(inner)} depth={depth + 1} keyPrefix={`${keyPrefix}q`} />
      )}
    </blockquote>
  )
}

function ForumBlocks({ tokens, depth, keyPrefix }: { tokens: Token[]; depth: number; keyPrefix: string }) {
  return (
    <>
      {tokens.map((token, index) => {
        const key = `${keyPrefix}-${index}`
        switch (token.type) {
          case 'space':
          case 'def':
            return null
          case 'paragraph':
            return (
              <p key={key} className={PARAGRAPH_CLASS}>
                {renderInline((token as Tokens.Paragraph).tokens, key)}
              </p>
            )
          case 'text': {
            // Tight list items hold bare text blocks.
            const t = token as Tokens.Text
            return (
              <span key={key} className="whitespace-pre-wrap break-words">
                {t.tokens ? renderInline(t.tokens, key) : <MentionText text={t.text} keyPrefix={key} />}
              </span>
            )
          }
          case 'heading':
            return (
              <p key={key} className={`${PARAGRAPH_CLASS} font-bold text-ink`}>
                {renderInline((token as Tokens.Heading).tokens, key)}
              </p>
            )
          case 'code':
            return (
              <pre
                key={key}
                className="bg-abyss border border-line-subtle rounded-control p-3 overflow-x-auto text-[11px] sm:text-xs leading-relaxed font-mono text-ink"
              >
                <code>{(token as Tokens.Code).text}</code>
              </pre>
            )
          case 'blockquote':
            return <ForumQuote key={key} token={token as Tokens.Blockquote} depth={depth} keyPrefix={key} />
          case 'list': {
            const list = token as Tokens.List
            const items = list.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`} className="pl-0.5 space-y-1">
                <ForumBlocks tokens={item.tokens} depth={depth} keyPrefix={`${key}-${itemIndex}`} />
              </li>
            ))
            const listClass = 'pl-5 space-y-1 text-xs sm:text-sm text-ink-body leading-relaxed marker:text-ink-muted'
            return list.ordered ? (
              <ol key={key} start={typeof list.start === 'number' ? list.start : undefined} className={`list-decimal ${listClass}`}>
                {items}
              </ol>
            ) : (
              <ul key={key} className={`list-disc ${listClass}`}>
                {items}
              </ul>
            )
          }
          case 'hr':
            return <hr key={key} className="border-line-subtle" />
          default:
            // Raw HTML blocks, tables and anything unknown: plain text.
            return (
              <p key={key} className={PARAGRAPH_CLASS}>
                {(token.raw ?? '').replace(/\n+$/, '')}
              </p>
            )
        }
      })}
    </>
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
  const tokens = useMemo(() => lexForumMarkdown(content ?? ''), [content])

  return (
    <div className={className ?? 'space-y-2'} data-testid={testId}>
      <ForumBlocks tokens={tokens} depth={depth} keyPrefix="b" />
    </div>
  )
}
