import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  copySurfacesForPath,
  extractQuotedAndJsxCopy,
  findSlashPairs,
  hasSlashPair,
  maskCopyUrls,
} from './copy-slash-pair'

const pair = ['SACRED CANON', 'THE BENTHIC CODEX'].join(' // ')

const CORPUS_ROOTS = [
  'STYLE_GUIDE.md',
  'BRAND_BIBLE.md',
  '.agents/skills',
  'codex',
  'content',
  'public/downloads',
  'src',
  'scripts',
]

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.output',
  'coverage',
  'tmp',
])

const COPY_FILE = /\.(md|mdx|json|html|ts|tsx|js|jsx)$/i

function walk(target: string, files: string[] = []): string[] {
  if (!fs.existsSync(target)) return files
  const stats = fs.statSync(target)
  if (stats.isFile()) {
    files.push(target)
    return files
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const next = path.join(target, entry.name)
    if (entry.isDirectory()) walk(next, files)
    else if (COPY_FILE.test(entry.name)) files.push(next)
  }
  return files
}

describe('slash-pair copy detector', () => {
  it('flags title-dek chrome', () => {
    expect(hasSlashPair(pair)).toBe(true)
    expect(hasSlashPair(['CYCLE 894.2', 'LEVEL -7'].join(' // '))).toBe(true)
    expect(hasSlashPair(['CANON', 'CODEX'].join('//'))).toBe(true)
    expect(hasSlashPair('Sacred Canon. The Benthic Codex.')).toBe(false)
    expect(hasSlashPair('Sacred Canon: the Benthic Codex.')).toBe(false)
  })

  it('ignores URLs, comments, and protocol prefixes', () => {
    expect(hasSlashPair('https://moltology.org/codex')).toBe(false)
    expect(hasSlashPair('http://example.com')).toBe(false)
    expect(hasSlashPair('postgres://admin:password@db.neon.tech/main')).toBe(false)
    expect(hasSlashPair('// a line comment about telemetry')).toBe(false)
    expect(hasSlashPair(['returning()', 'Update thread'].join(' // '))).toBe(false)
    expect(hasSlashPair(['rawSvg', '1. Expand ViewBox'].join(' // '))).toBe(false)
    expect(hasSlashPair(['w5_bot', 'Massive, Robust'].join(' // '))).toBe(false)
    expect(maskCopyUrls('see https://moltology.org/news')).not.toContain('//')
  })

  it('extracts quoted copy and JSX text without code comments', () => {
    const commentTail = ['const skip = 1', 'strictly highest'].join(' // ')
    const source = [
      "const name = 'Specimen Alpha: Decapod Operator Prototype'",
      'const url = "https://moltology.org/codex"',
      commentTail,
      '<div>Assessment complete. Profile generated</div>',
    ].join('\n')
    const chunks = extractQuotedAndJsxCopy(source)
    expect(chunks).toContain('Specimen Alpha: Decapod Operator Prototype')
    expect(chunks).toContain('https://moltology.org/codex')
    expect(chunks.join('\n')).not.toContain('strictly highest')
    expect(chunks.every((chunk) => !hasSlashPair(chunk))).toBe(true)
  })

  it('extracts tsx text nodes after masking strings and comments', () => {
    const tsx = '<p className="hud">Assessment complete. Profile generated</p>'
    const chunks = extractQuotedAndJsxCopy(tsx, { jsx: true })
    expect(chunks.some((chunk) => chunk.includes('Assessment complete. Profile generated'))).toBe(
      true
    )
  })

  it('fails if slash-pair chrome re-enters copy, skills, or guides', () => {
    const root = process.cwd()
    const files = CORPUS_ROOTS.flatMap((rel) => walk(path.join(root, rel)))
    const violations: string[] = []

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      const rel = path.relative(root, file)
      for (const surface of copySurfacesForPath(file, source)) {
        for (const hit of findSlashPairs(surface)) {
          violations.push(`${rel}: ${hit.excerpt}`)
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })
})
