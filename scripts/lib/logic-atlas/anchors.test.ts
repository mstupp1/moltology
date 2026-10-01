import { describe, expect, it } from 'vitest'
import { anchorKey, hashText, resolveAnchor, resolveMarkdownAnchor, resolveTextAnchor, resolveTsAnchor } from './anchors'

const SOURCE = `import x from 'y'

export const LIMIT = 10
const HIDDEN = { a: 1 }

export const CONFIG = {
  nested: { depth: 3 },
  streak: [1, 2, 3],
}

export function decide(answers: string, input: number) {
  return answers.length > input
}

export const handler = async ({ data }: { data: string }) => data

export const table = pgTable('profiles', {
  chitinGems: integer('chitinGems').default(250),
})
`

describe('resolveTsAnchor', () => {
  it('resolves exported and private constants with their literal value', () => {
    expect(resolveTsAnchor('a.ts', SOURCE, 'LIMIT')).toMatchObject({ line: 3, value: '10' })
    expect(resolveTsAnchor('a.ts', SOURCE, 'HIDDEN')).toMatchObject({ line: 4, value: '{ a: 1 }' })
  })

  it('describes functions and arrow functions by signature', () => {
    expect(resolveTsAnchor('a.ts', SOURCE, 'decide')?.value).toBe('decide(answers, input)')
    expect(resolveTsAnchor('a.ts', SOURCE, 'handler')?.value).toBe('handler({ data })')
  })

  it('follows dotted paths into object literals and call arguments', () => {
    expect(resolveTsAnchor('a.ts', SOURCE, 'CONFIG.nested.depth')).toMatchObject({ value: '3' })
    expect(resolveTsAnchor('a.ts', SOURCE, 'table.chitinGems')?.value).toBe("integer('chitinGems').default(250)")
  })

  it('returns null for missing symbols', () => {
    expect(resolveTsAnchor('a.ts', SOURCE, 'NOPE')).toBeNull()
    expect(resolveTsAnchor('a.ts', SOURCE, 'CONFIG.missing')).toBeNull()
  })

  it('changes the hash when the declaration changes, not when whitespace does', () => {
    const base = resolveTsAnchor('a.ts', SOURCE, 'LIMIT')!.hash
    expect(resolveTsAnchor('a.ts', SOURCE.replace('LIMIT = 10', 'LIMIT  =  10'), 'LIMIT')!.hash).toBe(base)
    expect(resolveTsAnchor('a.ts', SOURCE.replace('LIMIT = 10', 'LIMIT = 12'), 'LIMIT')!.hash).not.toBe(base)
  })

  it('ignores edits elsewhere in the file', () => {
    const base = resolveTsAnchor('a.ts', SOURCE, 'LIMIT')!.hash
    const edited = SOURCE.replace('return answers.length > input', 'return answers.length >= input')
    expect(resolveTsAnchor('a.ts', edited, 'LIMIT')!.hash).toBe(base)
    expect(resolveTsAnchor('a.ts', edited, 'decide')!.hash).not.toBe(resolveTsAnchor('a.ts', SOURCE, 'decide')!.hash)
  })
})

describe('resolveMarkdownAnchor', () => {
  const doc = `# Title

## 4.1 The Duality

> **Chitin Gems are earned.**

More text.

### Nested

Still inside.

## 4.2 Next

Outside.
`

  it('finds a heading and summarizes its first line of body', () => {
    expect(resolveMarkdownAnchor(doc, 'the duality')).toMatchObject({ line: 3, value: 'Chitin Gems are earned.' })
  })

  it('hashes only its own section, including nested headings', () => {
    const base = resolveMarkdownAnchor(doc, 'The Duality')!.hash
    expect(resolveMarkdownAnchor(doc.replace('Outside.', 'Changed.'), 'The Duality')!.hash).toBe(base)
    expect(resolveMarkdownAnchor(doc.replace('Still inside.', 'Changed.'), 'The Duality')!.hash).not.toBe(base)
  })
})

describe('resolveAnchor', () => {
  it('routes by file type', () => {
    expect(resolveAnchor('x.md', '## Hard list\n\nOne.', 'Hard list')?.value).toBe('One.')
    expect(resolveAnchor('x.yml', 'steps:\n  - run: npm run db:migrate\n', 'npm run db:migrate')?.line).toBe(2)
    expect(resolveTextAnchor('a\nb', 'zzz')).toBeNull()
    expect(resolveAnchor('x.ts', 'export const A = 1', 'A')?.value).toBe('1')
  })

  it('builds stable lock keys', () => {
    expect(anchorKey('forum.rate-limit', 'src/a.ts', 'LIMIT')).toBe('forum.rate-limit::src/a.ts#LIMIT')
    expect(hashText('a  b')).toBe(hashText('a b'))
  })
})
