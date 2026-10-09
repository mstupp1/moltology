/**
 * Forum post markdown: the one format posts are stored in.
 *
 * The forum editor is a rich-text view over this markdown. Everything here is
 * shared by the editor (markdown <-> editor document) and the post renderer
 * (markdown -> tokens), so what an author sees while writing is what readers
 * see after posting.
 *
 * Supported subset: paragraphs with line breaks, bold, italic, inline code,
 * links, bullet and numbered lists, quotes, and code blocks. Anything else in
 * older posts (headings, images, raw HTML, tables) renders as plain text or
 * the nearest supported block. Raw HTML is never rendered as HTML.
 */

import { marked, type Token, type Tokens } from 'marked'

export const FORUM_LINK_MAX_LENGTH = 2048

/* ------------------------------------------------------------------ links */

/**
 * Returns a link target that is safe to put in an `href`, or null.
 * Only absolute http(s) addresses without embedded credentials pass, so
 * `javascript:`, `data:`, protocol-relative and `user@host` lookalikes fail.
 */
export function safeForumHref(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > FORUM_LINK_MAX_LENGTH) return null
  // Control characters and whitespace inside a URL are a smuggling signal.
  if (/[\u0000-\u0020\u007f-\u009f]/.test(trimmed)) return null
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password) return null
  if (!url.hostname) return null
  return url.href
}

/**
 * Turns what someone typed into the link field into a safe href.
 * Bare domains like `example.com/page` get `https://` added.
 */
export function normalizeForumLinkInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return safeForumHref(trimmed)
  if (trimmed.startsWith('//')) return null
  if (!/^[^\s/]+\.[^\s/]+/.test(trimmed)) return null
  return safeForumHref(`https://${trimmed}`)
}

/* -------------------------------------------------------------- tokenizer */

const QUOTE_LINE_RE = /^ {0,3}>/
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/

/**
 * Quote blocks end at the first line that does not start with `>`, matching
 * how quote replies have always rendered. Plain markdown would instead let
 * the next line continue the quote, so insert the blank line it needs.
 */
export function normalizeForumMarkdown(content: string): string {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let fence: string | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fenceMatch = line.match(FENCE_RE)
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null
    } else if (fenceMatch) {
      fence = fenceMatch[1]
    }
    const prev = out[out.length - 1]
    if (
      !fence &&
      prev !== undefined &&
      QUOTE_LINE_RE.test(prev) &&
      line.trim() !== '' &&
      !QUOTE_LINE_RE.test(line)
    ) {
      out.push('')
    }
    out.push(line)
  }
  return out.join('\n')
}

/** Lexes post markdown. Single newlines are line breaks, like a chat box. */
export function lexForumMarkdown(content: string): Token[] {
  if (!content) return []
  return marked.lexer(normalizeForumMarkdown(content), { gfm: true, breaks: true })
}

/* -------------------------------------------------- editor document model */

/** Minimal ProseMirror JSON shape (matches TipTap's JSONContent). */
export type ForumDocMark = { type: 'bold' | 'italic' | 'code' | 'link'; attrs?: { href: string } }
export type ForumDocNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: ForumDocNode[]
  marks?: ForumDocMark[]
  text?: string
}

function textNode(text: string, marks: ForumDocMark[]): ForumDocNode[] {
  if (!text) return []
  const nodes: ForumDocNode[] = []
  text.split('\n').forEach((part, index) => {
    if (index > 0) nodes.push({ type: 'hardBreak' })
    if (part) nodes.push(marks.length ? { type: 'text', text: part, marks } : { type: 'text', text: part })
  })
  return nodes
}

function withMark(marks: ForumDocMark[], mark: ForumDocMark): ForumDocMark[] {
  if (marks.some((m) => m.type === mark.type)) return marks
  return [...marks, mark]
}

function inlineToDoc(tokens: Token[] | undefined, marks: ForumDocMark[]): ForumDocNode[] {
  if (!tokens) return []
  const out: ForumDocNode[] = []
  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        const t = token as Tokens.Text
        if (t.tokens && t.tokens.length) out.push(...inlineToDoc(t.tokens, marks))
        else out.push(...textNode(t.text, marks))
        break
      }
      case 'escape':
        out.push(...textNode((token as Tokens.Escape).text, marks))
        break
      case 'strong':
        out.push(...inlineToDoc((token as Tokens.Strong).tokens, withMark(marks, { type: 'bold' })))
        break
      case 'em':
        out.push(...inlineToDoc((token as Tokens.Em).tokens, withMark(marks, { type: 'italic' })))
        break
      case 'del':
        out.push(...inlineToDoc((token as Tokens.Del).tokens, marks))
        break
      case 'codespan':
        // Inline code carries no other marks in the editor.
        out.push(...textNode((token as Tokens.Codespan).text, [{ type: 'code' }]))
        break
      case 'br':
        out.push({ type: 'hardBreak' })
        break
      case 'link': {
        const link = token as Tokens.Link
        const href = safeForumHref(link.href)
        const inner = link.tokens?.length ? link.tokens : [{ type: 'text', raw: link.text, text: link.text } as Tokens.Text]
        out.push(...inlineToDoc(inner, href ? withMark(marks.filter((m) => m.type !== 'link'), { type: 'link', attrs: { href } }) : marks))
        break
      }
      case 'image': {
        const image = token as Tokens.Image
        const href = safeForumHref(image.href)
        const label = image.text || image.href
        out.push(...textNode(label, href ? withMark(marks, { type: 'link', attrs: { href } }) : marks))
        break
      }
      default:
        out.push(...textNode(token.raw ?? '', marks))
    }
  }
  return out
}

function sameMarks(a: ForumDocMark[] | undefined, b: ForumDocMark[] | undefined): boolean {
  const ak = (a ?? []).map(markKey).sort().join('|')
  const bk = (b ?? []).map(markKey).sort().join('|')
  return ak === bk
}

/** Joins neighbouring text nodes that carry the same marks. */
function mergeText(nodes: ForumDocNode[]): ForumDocNode[] {
  const out: ForumDocNode[] = []
  for (const node of nodes) {
    const last = out[out.length - 1]
    if (last && last.type === 'text' && node.type === 'text' && sameMarks(last.marks, node.marks)) {
      out[out.length - 1] = { ...last, text: `${last.text ?? ''}${node.text ?? ''}` }
    } else {
      out.push(node)
    }
  }
  return out
}

function paragraph(content: ForumDocNode[]): ForumDocNode {
  const merged = mergeText(content)
  return merged.length ? { type: 'paragraph', content: merged } : { type: 'paragraph' }
}

function blocksToDoc(tokens: Token[] | undefined): ForumDocNode[] {
  if (!tokens) return []
  const out: ForumDocNode[] = []
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
      case 'def':
      case 'hr':
        // The editor has no divider; older posts lose it on their next edit.
        break
      case 'paragraph':
        out.push(paragraph(inlineToDoc((token as Tokens.Paragraph).tokens, [])))
        break
      case 'text': {
        const t = token as Tokens.Text
        out.push(paragraph(t.tokens ? inlineToDoc(t.tokens, []) : textNode(t.text, [])))
        break
      }
      case 'heading':
        out.push(paragraph(inlineToDoc((token as Tokens.Heading).tokens, [{ type: 'bold' }])))
        break
      case 'code': {
        const text = (token as Tokens.Code).text
        out.push(text ? { type: 'codeBlock', content: [{ type: 'text', text }] } : { type: 'codeBlock' })
        break
      }
      case 'blockquote': {
        const inner = blocksToDoc((token as Tokens.Blockquote).tokens)
        out.push({ type: 'blockquote', content: inner.length ? inner : [paragraph([])] })
        break
      }
      case 'list': {
        const list = token as Tokens.List
        const items = list.items.map((item) => {
          const children = blocksToDoc(item.tokens)
          if (!children.length || children[0].type !== 'paragraph') children.unshift(paragraph([]))
          return { type: 'listItem', content: children }
        })
        if (!items.length) break
        const start = typeof list.start === 'number' ? list.start : 1
        out.push(
          list.ordered
            ? { type: 'orderedList', attrs: { start }, content: items }
            : { type: 'bulletList', content: items },
        )
        break
      }
      default: {
        // html, tables and anything newer: keep the author's text visible.
        const raw = (token.raw ?? '').replace(/\n+$/, '')
        if (raw) out.push(paragraph(textNode(raw, [])))
      }
    }
  }
  return out
}

/** Stored markdown -> editor document. */
export function forumMarkdownToDoc(markdown: string): ForumDocNode {
  const content = blocksToDoc(lexForumMarkdown(markdown ?? ''))
  return { type: 'doc', content: content.length ? content : [paragraph([])] }
}

/* --------------------------------------------------------- serialization */

const MARK_ORDER: ForumDocMark['type'][] = ['link', 'bold', 'italic']

function markKey(mark: ForumDocMark): string {
  return mark.type === 'link' ? `link:${mark.attrs?.href ?? ''}` : mark.type
}

function openMark(mark: ForumDocMark): string {
  if (mark.type === 'link') return '['
  if (mark.type === 'bold') return '**'
  return '*'
}

function closeMark(mark: ForumDocMark): string {
  if (mark.type === 'link') return `](${encodeLinkTarget(mark.attrs?.href ?? '')})`
  if (mark.type === 'bold') return '**'
  return '*'
}

function encodeLinkTarget(href: string): string {
  return href.replace(/[\s()<>]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)
}

/** Escapes characters markdown would otherwise read as syntax. */
export function escapeForumText(text: string, atLineStart: boolean): string {
  let out = text
    .replace(/\\(?=[!-/:-@[-`{-~]|$)/g, '\\\\')
    .replace(/[`*[\]~]/g, '\\$&')
  // Underscores only act as emphasis at word edges, so leave snake_case,
  // @handles and URLs readable.
  out = out.replace(/_/g, (match, offset: number, whole: string) => {
    const before = whole[offset - 1] ?? ''
    const after = whole[offset + 1] ?? ''
    return /[A-Za-z0-9]/.test(before) && /[A-Za-z0-9]/.test(after) ? match : '\\_'
  })
  if (atLineStart) {
    // Leading spaces would turn into code blocks; keep them as visible spaces.
    out = out.replace(/^[ \t]+/, (ws) => '\u00a0'.repeat(ws.length))
    out = out
      .replace(/^(#{1,6})(?=\s|$)/, '\\$1')
      .replace(/^([>])/, '\\$1')
      .replace(/^([+-])(?=\s|$)/, '\\$1')
      .replace(/^(-{3,}|={2,})\s*$/, '\\$1')
      .replace(/^(\d{1,9})([.)])(?=\s|$)/, '$1\\$2')
  }
  return out
}

function codeSpan(text: string): string {
  const runs = text.match(/`+/g) ?? []
  const longest = runs.reduce((max, run) => Math.max(max, run.length), 0)
  const fence = '`'.repeat(longest + 1)
  const pad = text.startsWith('`') || text.endsWith('`') || /^\s.*\S|\S.*\s$/.test(text) ? ' ' : ''
  return `${fence}${pad}${text}${pad}${fence}`
}

function serializeInline(nodes: ForumDocNode[] | undefined): string {
  if (!nodes) return ''
  let out = ''
  let active: ForumDocMark[] = []
  let pendingTrail = ''
  let atLineStart = true

  const closeFrom = (index: number) => {
    let closers = ''
    for (let i = active.length - 1; i >= index; i--) closers += closeMark(active[i])
    active = active.slice(0, index)
    return closers
  }

  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      out += closeFrom(0) + '\n'
      pendingTrail = ''
      atLineStart = true
      continue
    }
    if (node.type !== 'text' || !node.text) continue

    const marks = node.marks ?? []
    const isCode = marks.some((m) => m.type === 'code')
    const wanted = MARK_ORDER.flatMap((type) => marks.filter((m) => m.type === type))
    const wantedKeys = new Set(wanted.map(markKey))

    const text = node.text
    const lead = isCode ? '' : (text.match(/^\s+/)?.[0] ?? '')
    const trail = isCode ? '' : (text.match(/\s+$/)?.[0] ?? '')
    const core = isCode ? text : text.slice(lead.length, text.length - trail.length)

    if (!core) {
      // Whitespace only: keep current marks open around it.
      out += pendingTrail + (atLineStart ? '' : text)
      pendingTrail = ''
      continue
    }

    let keep = 0
    while (keep < active.length && wantedKeys.has(markKey(active[keep]))) keep++
    // A mark we keep must also sit in the same order it was opened.
    const closers = closeFrom(keep)
    const activeKeys = new Set(active.map(markKey))
    const openers = wanted.filter((m) => !activeKeys.has(markKey(m)))
    active = [...active, ...openers]

    const leadOut = atLineStart ? '' : lead
    out += closers + pendingTrail + leadOut + openers.map(openMark).join('')
    const lineStart = atLineStart && openers.length === 0 && closers === ''
    out += isCode ? codeSpan(core) : escapeForumText(core, lineStart)
    pendingTrail = trail
    atLineStart = false
  }

  out += closeFrom(0) + pendingTrail
  return out.replace(/\s+$/, '')
}

function prefixLines(text: string, first: string, rest: string): string {
  return text
    .split('\n')
    .map((line, index) => {
      const prefix = index === 0 ? first : rest
      return line ? `${prefix}${line}` : prefix.trimEnd()
    })
    .join('\n')
}

function serializeBlock(node: ForumDocNode, alternate = false): string {
  switch (node.type) {
    case 'paragraph':
      return serializeInline(node.content)
    case 'codeBlock': {
      const text = (node.content ?? []).map((c) => c.text ?? '').join('')
      const runs = text.match(/^ {0,3}`{3,}/gm) ?? []
      const longest = runs.reduce((max, run) => Math.max(max, run.trim().length), 2)
      const fence = '`'.repeat(longest + 1)
      return `${fence}\n${text}\n${fence}`
    }
    case 'blockquote': {
      const inner = serializeBlocks(node.content)
      return inner ? prefixLines(inner, '> ', '> ') : '>'
    }
    case 'bulletList':
    case 'orderedList': {
      const ordered = node.type === 'orderedList'
      const start = ordered && typeof node.attrs?.start === 'number' ? (node.attrs.start as number) : 1
      return (node.content ?? [])
        .map((item, index) => {
          const marker = ordered ? `${start + index}${alternate ? ')' : '.'} ` : alternate ? '* ' : '- '
          const body = serializeBlocks(item.content, true)
          return prefixLines(body || '', marker, ' '.repeat(marker.length))
        })
        .join('\n')
    }
    default:
      return serializeInline(node.content)
  }
}

function serializeBlocks(nodes: ForumDocNode[] | undefined, inListItem = false): string {
  if (!nodes) return ''
  let out = ''
  let prev: ForumDocNode | null = null
  let alternate = false
  for (const node of nodes) {
    // Back-to-back lists of one kind would merge, so switch the marker.
    alternate = prev?.type === node.type && (node.type === 'bulletList' || node.type === 'orderedList') ? !alternate : false
    const text = serializeBlock(node, alternate)
    if (!text.trim() && node.type !== 'codeBlock') continue
    if (out) {
      const nested = inListItem && (node.type === 'bulletList' || node.type === 'orderedList')
      out += nested ? '\n' : '\n\n'
    }
    out += text
    prev = node
  }
  return out
}

/** Editor document -> stored markdown. */
export function forumDocToMarkdown(doc: ForumDocNode | null | undefined): string {
  if (!doc) return ''
  return serializeBlocks(doc.content).replace(/^\n+|\s+$/g, '')
}

/** True when the markdown has no visible text (only syntax or whitespace). */
export function isForumMarkdownBlank(markdown: string): boolean {
  return forumMarkdownPlainText(markdown).trim().length === 0
}

/** Visible text of a post, for counters and minimum-length checks. */
export function forumMarkdownPlainText(markdown: string): string {
  const parts: string[] = []
  const walk = (node: ForumDocNode) => {
    if (node.type === 'text' && node.text) parts.push(node.text)
    if (node.type === 'hardBreak') parts.push('\n')
    node.content?.forEach((child, index) => {
      if (index > 0 && child.type !== 'text' && child.type !== 'hardBreak') parts.push('\n')
      walk(child)
    })
  }
  walk(forumMarkdownToDoc(markdown))
  return parts.join('')
}

/** Characters a reader will see, for the minimum-length rule. */
export function forumVisibleLength(markdown: string): number {
  return forumMarkdownPlainText(markdown ?? '').trim().length
}
