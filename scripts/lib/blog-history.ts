import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import matter from 'gray-matter'

export interface BlogHistoryArticle {
  slug: string
  title: string
  format?: string
  category?: string
  author?: string
  publishedAt: string
  coreHook?: string
  keyMetrics?: string[]
  relatedReelIds?: string[]
  driveSource?: string
  sources?: string[]
  [key: string]: any
}

export interface BlogHistoryLedger {
  version: string
  channel: string
  description: string
  articles: BlogHistoryArticle[]
}

export const DEFAULT_BLOG_HISTORY_PATH = path.resolve(process.cwd(), 'content/news/blog-history.json')

/**
 * Reads and parses the blog history JSON ledger.
 */
export function readBlogHistory(customPath = DEFAULT_BLOG_HISTORY_PATH): BlogHistoryLedger {
  if (!fs.existsSync(customPath)) {
    return {
      version: '1.0',
      channel: 'blog',
      description: 'Ledger of MoltNation News dispatches, core technical topics, key metrics, narrative continuity, and cross-channel video reel linkages.',
      articles: [],
    }
  }

  const raw = fs.readFileSync(customPath, 'utf8')
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data.articles)) {
      data.articles = []
    }
    return data
  } catch (err: any) {
    throw new Error(`Failed to parse blog history at ${customPath}: ${err.message}`)
  }
}

/**
 * Writes the blog history JSON ledger cleanly with 2-space formatting.
 */
export function writeBlogHistory(data: BlogHistoryLedger, customPath = DEFAULT_BLOG_HISTORY_PATH): void {
  const dir = path.dirname(customPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const serialized = JSON.stringify(data, null, 2) + '\n'
  fs.writeFileSync(customPath, serialized, 'utf8')
}

/**
 * Idempotently records or updates a blog article in the continuity ledger.
 */
export function recordBlogArticle(
  entry: Partial<BlogHistoryArticle> & { slug: string; title: string },
  customPath = DEFAULT_BLOG_HISTORY_PATH
): BlogHistoryArticle {
  const ledger = readBlogHistory(customPath)
  const existingIdx = ledger.articles.findIndex((a) => a.slug === entry.slug)

  const articleRecord: BlogHistoryArticle = {
    slug: entry.slug,
    title: entry.title,
    format: entry.format || (existingIdx >= 0 ? ledger.articles[existingIdx].format : 'autonomous-dispatch'),
    category: entry.category || (existingIdx >= 0 ? ledger.articles[existingIdx].category : 'TELEMETRY'),
    author: entry.author || (existingIdx >= 0 ? ledger.articles[existingIdx].author : 'Dr. Thalassa Vance'),
    publishedAt: entry.publishedAt || (existingIdx >= 0 ? ledger.articles[existingIdx].publishedAt : new Date().toISOString()),
    coreHook: entry.coreHook || (existingIdx >= 0 ? ledger.articles[existingIdx].coreHook : ''),
    keyMetrics: entry.keyMetrics || (existingIdx >= 0 ? ledger.articles[existingIdx].keyMetrics : []),
    relatedReelIds: entry.relatedReelIds || (existingIdx >= 0 ? ledger.articles[existingIdx].relatedReelIds : []),
    ...(entry.driveSource ? { driveSource: entry.driveSource } : {}),
  }

  if (existingIdx >= 0) {
    ledger.articles[existingIdx] = {
      ...ledger.articles[existingIdx],
      ...articleRecord,
    }
  } else {
    ledger.articles.push(articleRecord)
  }

  // Ensure stable chronological sorting by publication date
  ledger.articles.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())

  writeBlogHistory(ledger, customPath)
  return articleRecord
}

/**
 * Reconciles and synchronizes all markdown files in content/news into blog-history.json.
 * Scans all content/news/*.md, extracts frontmatter, and updates ledger entries idempotently.
 */
export function syncBlogHistoryFromMarkdown(
  newsDir = path.resolve(process.cwd(), 'content/news'),
  customHistoryPath = DEFAULT_BLOG_HISTORY_PATH
): { added: number; updated: number; total: number } {
  if (!fs.existsSync(newsDir)) {
    throw new Error(`Content directory not found: ${newsDir}`)
  }

  const ledger = readBlogHistory(customHistoryPath)
  const files = fs.readdirSync(newsDir).filter((file) => {
    const lower = file.toLowerCase()
    return lower.endsWith('.md') && lower !== 'template.md' && lower !== 'readme.md'
  })

  let added = 0
  let updated = 0

  for (const file of files) {
    const fullPath = path.join(newsDir, file)
    const content = fs.readFileSync(fullPath, 'utf8')
    const parsed = matter(content)
    const frontmatter = parsed.data || {}

    const slug = frontmatter.slug || file.replace(/\.md$/, '')
    const title = frontmatter.title || slug
    const summary = frontmatter.summary || ''
    const category = frontmatter.category || 'TELEMETRY'
    const author = frontmatter.authorName || 'Dr. Thalassa Vance'
    const publishedAt = frontmatter.publishedAt ? new Date(frontmatter.publishedAt).toISOString() : new Date().toISOString()

    const existingIdx = ledger.articles.findIndex((a) => a.slug === slug)

    // Extract citations from the body if present
    const sources: string[] = []
    const citationRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
    let match: RegExpExecArray | null
    while ((match = citationRegex.exec(parsed.content)) !== null) {
      sources.push(`${match[1]}: ${match[2]}`)
    }

    if (existingIdx >= 0) {
      const existing = ledger.articles[existingIdx]
      ledger.articles[existingIdx] = {
        ...existing,
        slug,
        title,
        category,
        author: existing.author || author,
        publishedAt: existing.publishedAt || publishedAt,
        coreHook: existing.coreHook || summary,
      }
      updated++
    } else {
      ledger.articles.push({
        slug,
        title,
        format: 'autonomous-dispatch',
        category,
        author,
        publishedAt,
        coreHook: summary,
        keyMetrics: [],
        relatedReelIds: [],
      })
      added++
    }
  }

  // Sort chronological by publication date
  ledger.articles.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
  writeBlogHistory(ledger, customHistoryPath)

  return { added, updated, total: ledger.articles.length }
}

/**
 * Automates staging and committing published blog article and ledger to git.
 */
export function autoCommitBlogPublish(slug: string, articleFilePath?: string, customHistoryPath = DEFAULT_BLOG_HISTORY_PATH): { success: boolean; message: string } {
  try {
    const filesToStage: string[] = [customHistoryPath]
    if (articleFilePath && fs.existsSync(articleFilePath)) {
      filesToStage.push(articleFilePath)
    } else {
      const defaultArticlePath = path.resolve(process.cwd(), `content/news/${slug}.md`)
      if (fs.existsSync(defaultArticlePath)) {
        filesToStage.push(defaultArticlePath)
      }
    }

    // Git add files
    const stageCmd = `git add ${filesToStage.map((f) => `"${f}"`).join(' ')}`
    execSync(stageCmd, { stdio: 'pipe' })

    // Check if there are staged changes to commit
    const diffCheck = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim()
    if (!diffCheck) {
      return { success: true, message: 'No staged changes to commit (already up to date).' }
    }

    const commitMsg = `feat(news): publish ${slug} and update continuity ledger`
    execSync(`git commit -m "${commitMsg}"`, { stdio: 'pipe' })

    return { success: true, message: `Committed changes with message: "${commitMsg}"` }
  } catch (err: any) {
    return { success: false, message: `Git commit skipped or failed: ${err.message}` }
  }
}
