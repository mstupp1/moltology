#!/usr/bin/env node
import path from 'node:path'
import { syncBlogHistoryFromMarkdown, readBlogHistory, DEFAULT_BLOG_HISTORY_PATH } from './lib/blog-history'

function printHelp() {
  console.log(`
Usage:
  npx tsx scripts/sync-blog-history.ts [options]

Options:
  --dry-run      Analyze and validate without modifying the ledger file.
  -h, --help     Display this help menu.

Summary:
  Scans all markdown files in content/news/*.md, extracts frontmatter,
  and deterministically reconciles content/news/blog-history.json.
  Use this after git pulls, branch merges, or writing new articles
  to keep the continuity ledger conflict-free and sorted.
`)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('-h') || args.includes('--help')) {
    printHelp()
    process.exit(0)
  }

  const isDryRun = args.includes('--dry-run')
  const newsDir = path.resolve(process.cwd(), 'content/news')

  console.log(`[blog:sync-history] Scanning ${newsDir} for MoltNation dispatches...`)

  if (isDryRun) {
    const existing = readBlogHistory(DEFAULT_BLOG_HISTORY_PATH)
    console.log(`[DRY-RUN] Current ledger contains ${existing.articles.length} articles.`)
    process.exit(0)
  }

  try {
    const res = syncBlogHistoryFromMarkdown(newsDir, DEFAULT_BLOG_HISTORY_PATH)
    console.log(`✓ [blog:sync-history] Reconciled ${res.total} articles in ${DEFAULT_BLOG_HISTORY_PATH}`)
    console.log(`  • Added: ${res.added}`)
    console.log(`  • Updated: ${res.updated}`)
    console.log(`  • Status: Ledger clean, chronologically sorted, and conflict-free.`)
  } catch (err: any) {
    console.error(`✗ [blog:sync-history] Error syncing blog history: ${err.message}`)
    process.exit(1)
  }
}

main()
