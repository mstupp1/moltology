/**
 * Forum quote-reply markup.
 *
 * Quotes live in the post body as `>` lines so no schema change is required.
 * First line is an attribution (`@handle held:` or `Name held:`) when we insert.
 */

export const FORUM_QUOTE_MAX_CHARS = 480
export const FORUM_QUOTE_WITHDRAWN_BODY = 'This transmission was withdrawn.'

const ATTRIBUTION_RE = /^(?:@([A-Za-z0-9_]{3,20})|(.+?)) held:$/

export type ForumQuoteSource = {
  authorHandle?: string | null
  authorName?: string | null
  content?: string | null
  deletedAt?: string | Date | null
}

export type ForumQuoteInsert =
  | { ok: true; markup: string; tombstone?: boolean }
  | { ok: false; reason: 'withdrawn' }

export type ForumQuoteAttribution = {
  raw: string
  handle: string | null
  name: string
}

export type ForumContentBlock =
  | { type: 'text'; value: string }
  | { type: 'quote'; attribution: ForumQuoteAttribution | null; inner: string }

export function isForumQuoteSourceWithdrawn(source: unknown): boolean {
  if (!source || typeof source !== 'object') return false
  const deletedAt = (source as { deletedAt?: unknown }).deletedAt
  return deletedAt != null && deletedAt !== ''
}

export function forumQuoteAttributionLine(source: Pick<ForumQuoteSource, 'authorHandle' | 'authorName'>): string {
  const handle = source.authorHandle?.trim()
  if (handle) return `@${handle} held:`
  const name = source.authorName?.trim()
  return `${name || 'An initiate'} held:`
}

function prefixQuoteLines(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n')
  if (!normalized) return '>'
  return normalized
    .split('\n')
    .map((line) => (line.length ? `> ${line}` : '>'))
    .join('\n')
}

function truncateQuoteBody(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= FORUM_QUOTE_MAX_CHARS) return trimmed
  return `${trimmed.slice(0, FORUM_QUOTE_MAX_CHARS).trimEnd()}…`
}

/**
 * Builds diegetic quote markup to prepend in a reply composer.
 * Withdrawn sources are blocked by default so sealed bodies are not copied.
 */
export function buildForumQuoteMarkup(
  source: ForumQuoteSource,
  options: { onWithdrawn?: 'block' | 'tombstone' } = {},
): ForumQuoteInsert {
  if (isForumQuoteSourceWithdrawn(source)) {
    if (options.onWithdrawn === 'tombstone') {
      const attribution = forumQuoteAttributionLine(source)
      const markup = `${prefixQuoteLines(`${attribution}\n${FORUM_QUOTE_WITHDRAWN_BODY}`)}\n\n`
      return { ok: true, markup, tombstone: true }
    }
    return { ok: false, reason: 'withdrawn' }
  }

  const attribution = forumQuoteAttributionLine(source)
  const body = truncateQuoteBody(source.content ?? '')
  const markup = `${prefixQuoteLines(body ? `${attribution}\n${body}` : attribution)}\n\n`
  return { ok: true, markup }
}

/** Prepends quote markup without duplicating the same block. */
export function prependForumQuote(existing: string, markup: string): string {
  const quote = markup.endsWith('\n') ? markup : `${markup}\n`
  const body = existing.trimStart()
  if (!body) return quote
  if (body.startsWith(quote.trimStart()) || body.startsWith(quote.trim())) return existing
  return `${quote}${body}`
}

function stripQuotePrefix(line: string): string | null {
  if (line.startsWith('> ')) return line.slice(2)
  if (line.startsWith('>')) return line.slice(1)
  return null
}

function parseAttribution(line: string): ForumQuoteAttribution | null {
  const match = line.match(ATTRIBUTION_RE)
  if (!match) return null
  const handle = match[1] ?? null
  const name = handle ?? (match[2] ?? '').trim()
  if (!name) return null
  return { raw: line, handle, name }
}

/** Splits saved post text into quote blocks and surrounding copy. */
export function parseForumContentBlocks(content: string): ForumContentBlock[] {
  if (!content) return []
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ForumContentBlock[] = []
  let i = 0

  while (i < lines.length) {
    const quoted = stripQuotePrefix(lines[i])
    if (quoted !== null) {
      const innerLines: string[] = [quoted]
      i += 1
      while (i < lines.length) {
        const next = stripQuotePrefix(lines[i])
        if (next === null) break
        innerLines.push(next)
        i += 1
      }
      const attribution = parseAttribution(innerLines[0] ?? '')
      const inner = (attribution ? innerLines.slice(1) : innerLines).join('\n')
      blocks.push({ type: 'quote', attribution, inner })
      continue
    }

    const textLines: string[] = []
    while (i < lines.length && stripQuotePrefix(lines[i]) === null) {
      textLines.push(lines[i])
      i += 1
    }
    const value = textLines.join('\n')
    if (value.length > 0) {
      blocks.push({ type: 'text', value })
    }
  }

  return blocks
}
