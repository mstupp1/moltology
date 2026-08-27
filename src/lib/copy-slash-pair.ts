/**
 * BAN 1 detector: slash-pair subtitle chrome in human-facing copy.
 * Catches spaced and tight slash-pairs. Ignores URLs and protocol prefixes.
 */

const URL_PROTOCOL = /\b[a-z][a-z0-9+.-]*:\/\//gi

/** Title-dek chrome: a word or numeric label, then a slash-pair, then a capitalised label. */
const SLASH_PAIR =
  /(?:^|[^A-Za-z0-9_])(?:[A-Za-z]{3,}|\d{1,3}(?:\.\d+)?)\s+\/\/\s+[A-Z]|(?:^|[^A-Za-z0-9_])[A-Za-z]{3,}\/\/[A-Z][A-Za-z]{2,}/g

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

function blankRange(mask: string[], start: number, end: number) {
  for (let i = start; i < end && i < mask.length; i += 1) {
    mask[i] = mask[i] === '\n' ? '\n' : ' '
  }
}

export function extractQuotedAndJsxCopy(
  source: string,
  options: { jsx?: boolean } = {}
): string[] {
  const chunks: string[] = []
  const mask = source.split('')
  let i = 0
  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    if (char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', i)
      const end = lineEnd === -1 ? source.length : lineEnd
      extractDoubleQuotedCopy(source.slice(i + 2, end), chunks)
      blankRange(mask, i, end)
      i = end
      continue
    }
    if (char === '/' && next === '*') {
      const blockEnd = source.indexOf('*/', i + 2)
      const end = blockEnd === -1 ? source.length : blockEnd + 2
      extractDoubleQuotedCopy(source.slice(i + 2, blockEnd === -1 ? source.length : blockEnd), chunks)
      blankRange(mask, i, end)
      i = end
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      const { raw, end } = readQuotedString(source, i)
      chunks.push(raw)
      blankRange(mask, i, end)
      i = end
      continue
    }
    i += 1
  }

  if (options.jsx) {
    const masked = mask.join('')
    for (const match of masked.matchAll(/>([^<>{}]+)</g)) {
      const text = match[1].replace(/\s+/g, ' ').trim()
      if (/[A-Za-z]/.test(text)) chunks.push(text)
    }
  }

  return chunks
}

export function stripMarkdownFences(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '\n')
}

export function copySurfacesForPath(filePath: string, source: string): string[] {
  const lower = filePath.replace(/\\/g, '/').toLowerCase()
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) {
    return [stripMarkdownFences(source)]
  }
  if (/\.(tsx|jsx)$/.test(lower)) {
    return extractQuotedAndJsxCopy(source, { jsx: true })
  }
  if (/\.(ts|js)$/.test(lower)) {
    return extractQuotedAndJsxCopy(source)
  }
  return [source]
}
