/**
 * BAN 1 detector: slash-pair subtitle chrome in human-facing copy.
 * Catches spaced and tight slash-pairs. Ignores URLs and protocol prefixes.
 */

const URL_PROTOCOL = /\b[a-z][a-z0-9+.-]*:\/\//gi

/** Spaced title-dek chrome, or a tight alphanumeric pair. */
const SLASH_PAIR = /[A-Za-z0-9.)\]]\s+\/\/\s+\S|[A-Za-z0-9]\/\/[A-Za-z0-9]/g

export interface SlashPairHit {
  index: number
  excerpt: string
}

export function maskCopyUrls(text: string): string {
  return text.replace(URL_PROTOCOL, 'URL:')
}

export function findSlashPairs(text: string): SlashPairHit[] {
  const masked = maskCopyUrls(text)
  const hits: SlashPairHit[] = []
  const re = new RegExp(SLASH_PAIR.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(masked))) {
    const start = Math.max(0, match.index - 28)
    const end = Math.min(masked.length, match.index + match[0].length + 28)
    hits.push({
      index: match.index,
      excerpt: masked.slice(start, end).replace(/\s+/g, ' ').trim(),
    })
  }
  return hits
}

export function hasSlashPair(text: string): boolean {
  return findSlashPairs(text).length > 0
}

function readQuotedString(source: string, start: number): { raw: string; end: number } {
  const quote = source[start]
  let i = start + 1
  let raw = ''
  while (i < source.length) {
    const char = source[i]
    if (char === '\\') {
      raw += char + (source[i + 1] ?? '')
      i += 2
      continue
    }
    if (quote === '`' && char === '$' && source[i + 1] === '{') {
      let depth = 1
      raw += '${'
      i += 2
      while (i < source.length && depth > 0) {
        if (source[i] === '{') depth += 1
        else if (source[i] === '}') depth -= 1
        raw += source[i]
        i += 1
      }
      continue
    }
    if (char === quote) {
      return { raw, end: i + 1 }
    }
    raw += char
    i += 1
  }
  return { raw, end: i }
}

function extractDoubleQuotedCopy(text: string, chunks: string[]) {
  let i = 0
  while (i < text.length) {
    const char = text[i]
    if (char === '"' || char === '`') {
      const { raw, end } = readQuotedString(text, i)
      chunks.push(raw)
      i = end
      continue
    }
    i += 1
  }
}

/** Quoted strings plus JSX text nodes. Line comments contribute only double-quoted examples. */
export function extractQuotedAndJsxCopy(source: string): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    if (char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', i)
      const comment = source.slice(i + 2, lineEnd === -1 ? source.length : lineEnd)
      extractDoubleQuotedCopy(comment, chunks)
      i = lineEnd === -1 ? source.length : lineEnd
      continue
    }
    if (char === '/' && next === '*') {
      const blockEnd = source.indexOf('*/', i + 2)
      const comment = source.slice(i + 2, blockEnd === -1 ? source.length : blockEnd)
      extractDoubleQuotedCopy(comment, chunks)
      i = blockEnd === -1 ? source.length : blockEnd + 2
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      const { raw, end } = readQuotedString(source, i)
      chunks.push(raw)
      i = end
      continue
    }
    i += 1
  }

  for (const match of source.matchAll(/>([^<>{}]+)</g)) {
    const text = match[1].trim()
    if (text) chunks.push(text)
  }

  return chunks
}

export function stripMarkdownFences(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '\n')
}

export function copySurfacesForPath(filePath: string, source: string): string {
  const lower = filePath.replaceAll('\\', '/').toLowerCase()
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) {
    return stripMarkdownFences(source)
  }
  if (/\.(ts|tsx|js|jsx)$/.test(lower)) {
    return extractQuotedAndJsxCopy(source).join('\n')
  }
  return source
}
