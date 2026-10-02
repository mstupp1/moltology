import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  readBlogHistory,
  writeBlogHistory,
  recordBlogArticle,
  syncBlogHistoryFromMarkdown,
  BlogHistoryLedger,
} from './blog-history'

describe('blog-history library', () => {
  const testDir = path.resolve(process.cwd(), 'tmp/test-blog-history')
  const testLedgerPath = path.join(testDir, 'blog-history.json')
  const testNewsDir = path.join(testDir, 'news')

  beforeEach(() => {
    fs.mkdirSync(testNewsDir, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('reads and initializes a default ledger when file does not exist', () => {
    const nonExistent = path.join(testDir, 'missing.json')
    const ledger = readBlogHistory(nonExistent)
    expect(ledger.version).toBe('1.0')
    expect(ledger.channel).toBe('blog')
    expect(ledger.articles).toEqual([])
  })

  it('writes and reads back blog history ledger cleanly', () => {
    const mockLedger: BlogHistoryLedger = {
      version: '1.0',
      channel: 'blog',
      description: 'Test Ledger',
      articles: [
        {
          slug: 'test-article-one',
          title: 'Test Article: One',
          publishedAt: '2026-09-01T12:00:00Z',
          category: 'TELEMETRY',
        },
      ],
    }

    writeBlogHistory(mockLedger, testLedgerPath)
    expect(fs.existsSync(testLedgerPath)).toBe(true)

    const reloaded = readBlogHistory(testLedgerPath)
    expect(reloaded.articles.length).toBe(1)
    expect(reloaded.articles[0].slug).toBe('test-article-one')
  })

  it('idempotently records and updates an article in the ledger', () => {
    recordBlogArticle(
      {
        slug: 'slug-a',
        title: 'Slug A: Initial',
        publishedAt: '2026-09-01T00:00:00Z',
        coreHook: 'Initial Hook',
      },
      testLedgerPath
    )

    let ledger = readBlogHistory(testLedgerPath)
    expect(ledger.articles.length).toBe(1)
    expect(ledger.articles[0].coreHook).toBe('Initial Hook')

    // Upsert update
    recordBlogArticle(
      {
        slug: 'slug-a',
        title: 'Slug A: Updated',
        publishedAt: '2026-09-01T00:00:00Z',
        coreHook: 'Updated Hook',
      },
      testLedgerPath
    )

    ledger = readBlogHistory(testLedgerPath)
    expect(ledger.articles.length).toBe(1)
    expect(ledger.articles[0].title).toBe('Slug A: Updated')
    expect(ledger.articles[0].coreHook).toBe('Updated Hook')

    // Append second article
    recordBlogArticle(
      {
        slug: 'slug-b',
        title: 'Slug B: Secondary',
        publishedAt: '2026-09-02T00:00:00Z',
        coreHook: 'Secondary Hook',
      },
      testLedgerPath
    )

    ledger = readBlogHistory(testLedgerPath)
    expect(ledger.articles.length).toBe(2)
  })

  it('synchronizes markdown files into blog-history.json', () => {
    const md1 = `---
title: "Article Alpha: The First"
slug: "article-alpha"
summary: "Summary for alpha"
category: "DEEP RESEARCH"
authorName: "Silas Trench"
publishedAt: "2026-09-10T10:00:00Z"
---
# Article Alpha: The First
Body content here.
`
    const md2 = `---
title: "Article Beta: The Second"
slug: "article-beta"
summary: "Summary for beta"
category: "TELEMETRY"
authorName: "Dr. Thalassa Vance"
publishedAt: "2026-09-15T10:00:00Z"
---
# Article Beta: The Second
Body content here.
`
    fs.writeFileSync(path.join(testNewsDir, 'article-alpha.md'), md1, 'utf8')
    fs.writeFileSync(path.join(testNewsDir, 'article-beta.md'), md2, 'utf8')

    const res = syncBlogHistoryFromMarkdown(testNewsDir, testLedgerPath)
    expect(res.added).toBe(2)
    expect(res.total).toBe(2)

    const ledger = readBlogHistory(testLedgerPath)
    expect(ledger.articles[0].slug).toBe('article-alpha')
    expect(ledger.articles[1].slug).toBe('article-beta')
    expect(ledger.articles[0].author).toBe('Silas Trench')
    expect(ledger.articles[1].author).toBe('Dr. Thalassa Vance')
  })
})
