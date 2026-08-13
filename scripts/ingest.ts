#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { parseContentFile } from '../src/lib/ingest/parser'
import { getIngestDb, ingestContentItem } from '../src/lib/ingest/handlers'
import { IngestContentType, IngestOptions, IngestResult } from '../src/lib/ingest/types'

function printHelp() {
  console.log(`
Usage:
  npx tsx scripts/ingest.ts [options] [path]

Arguments:
  [path]                     Path to a single Markdown/JSON file or directory of files.

Options:
  -f, --file <file>          Path to a single file to ingest.
  -d, --dir <directory>      Path to a directory of content files.
  -t, --type <type>          Content type: 'blog' (or 'news'), 'changelog', 'podcast'.
                             (Inferred automatically if omitted).
      --dev                  Target local/development database explicitly (reads DEV_DATABASE_URL).
                             (Defaults to production database if omitted).
      --db <url>             Explicit database connection string.
      --clean, --rm          Automatically delete source file(s) after successful ingestion.
      --dry-run              Validate frontmatter and schema without writing to DB.
  -s, --silent               Suppress per-file output and only print summary.
  -h, --help                 Display this help menu.

Examples:
  npx tsx scripts/ingest.ts content/news/article.md
  npx tsx scripts/ingest.ts content/drafts/my-article.md --clean
  npx tsx scripts/ingest.ts --dir content/news/ --type blog
  npx tsx scripts/ingest.ts content/news/article.md --dev
  npx tsx scripts/ingest.ts content/ --db "postgresql://..."
  npm run db:ingest -- content/news/article.md
`)
}

function parseCliArgs(argv: string[]): IngestOptions & { positionalPath?: string; showHelp?: boolean } {
  const options: IngestOptions & { positionalPath?: string; showHelp?: boolean } = {}
  const args = argv.slice(2)

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '-h' || arg === '--help') {
      options.showHelp = true
      return options
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--clean' || arg === '--rm') {
      options.clean = true
    } else if (arg === '--dev') {
      options.dev = true
    } else if (arg === '--prod') {
      options.prod = true
    } else if (arg === '--db' || arg === '--database-url') {
      options.dbUrl = args[++i]
    } else if (arg === '-s' || arg === '--silent') {
      options.silent = true
    } else if (arg === '-f' || arg === '--file') {
      options.file = args[++i]
    } else if (arg === '-d' || arg === '--dir') {
      options.dir = args[++i]
    } else if (arg === '-t' || arg === '--type') {
      options.type = args[++i] as IngestContentType
    } else if (!arg.startsWith('-') && !options.positionalPath) {
      options.positionalPath = arg
    }
  }

  return options
}

function findFilesToIngest(targetPath: string): string[] {
  const resolved = path.resolve(process.cwd(), targetPath)

  if (!fs.existsSync(resolved)) {
    throw new Error(`Target path does not exist: ${targetPath}`)
  }

  const stat = fs.statSync(resolved)
  if (stat.isFile()) {
    return [resolved]
  }

  if (stat.isDirectory()) {
    const files: string[] = []
    const entries = fs.readdirSync(resolved, { withFileTypes: true, recursive: true })

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (ext === '.md' || ext === '.markdown' || ext === '.json') {
          // Ignore template and readme documentation files in batch mode
          const lowerName = entry.name.toLowerCase()
          if (lowerName.startsWith('template.') || lowerName === 'readme.md') continue
          const fullPath = (entry as any).parentPath
            ? path.join((entry as any).parentPath, entry.name)
            : path.join(resolved, entry.name)
          files.push(fullPath)
        }
      }
    }
    return files.sort()
  }

  return []
}

async function runCli() {
  const args = parseCliArgs(process.argv)

  if (args.showHelp) {
    printHelp()
    process.exit(0)
  }

  const targetPath = args.file || args.dir || args.positionalPath

  if (!targetPath) {
    console.error('Error: No file or directory path provided.')
    printHelp()
    process.exit(1)
  }

  let filePaths: string[] = []
  try {
    filePaths = findFilesToIngest(targetPath)
  } catch (err: any) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }

  if (filePaths.length === 0) {
    console.log(`No valid .md or .json content files found in: ${targetPath}`)
    process.exit(0)
  }

  const isDryRun = Boolean(args.dryRun)
  let dbClient: any = null

  if (!isDryRun) {
    try {
      dbClient = getIngestDb(args)
    } catch (err: any) {
      console.error(`Database connection error: ${err.message}`)
      process.exit(1)
    }
  }

  const targetEnvLabel = args.dev ? '[DEV DATABASE]' : args.dbUrl ? '[CUSTOM DATABASE]' : '[PROD DATABASE]'
  console.log(`Ingesting ${filePaths.length} file(s) into ${targetEnvLabel}${isDryRun ? ' [DRY-RUN MODE]' : ''}...`)

  const results: IngestResult[] = []

  for (const filePath of filePaths) {
    const relPath = path.relative(process.cwd(), filePath)
    try {
      const rawContent = fs.readFileSync(filePath, 'utf-8')
      const parsed = parseContentFile(filePath, rawContent)
      const res = await ingestContentItem(parsed, { ...args, dryRun: isDryRun }, dbClient)
      results.push(res)

      if (!args.silent) {
        if (res.success) {
          const typeLabel = res.type === 'blog' ? 'blog_posts' : res.type === 'changelog' ? 'changelogs' : 'podcasts'
          const actionLabel = isDryRun ? 'Validated' : res.action === 'inserted' ? 'Inserted' : 'Updated'
          const cleanNotice = args.clean && !isDryRun ? ' (Source file purged)' : ''
          console.log(`  ✓ [${typeLabel}] ${actionLabel} "${res.title}" (${res.identifier})${cleanNotice} - ${relPath}`)
        } else {
          console.error(`  ✗ [FAILED] ${relPath}: ${res.error}`)
        }
      }

      if (args.clean && !isDryRun && res.success && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch (unlinkErr: any) {
          console.warn(`  ⚠ Warning: Failed to delete source file ${relPath}: ${unlinkErr.message}`)
        }
      }
    } catch (err: any) {
      const failRes: IngestResult = {
        filePath,
        type: args.type || 'blog',
        identifier: 'unknown',
        title: path.basename(filePath),
        action: 'skipped',
        success: false,
        error: err.message,
      }
      results.push(failRes)
      if (!args.silent) {
        console.error(`  ✗ [FAILED] ${relPath}: ${err.message}`)
      }
    }
  }

  const total = results.length
  const inserted = results.filter((r) => r.action === 'inserted').length
  const updated = results.filter((r) => r.action === 'updated').length
  const validated = results.filter((r) => r.action === 'validated').length
  const failed = results.filter((r) => !r.success).length

  console.log('\n--- Ingestion Summary ---')
  if (isDryRun) {
    console.log(`Total: ${total} | Validated: ${validated} | Failed: ${failed}`)
  } else {
    console.log(`Total: ${total} | Inserted: ${inserted} | Updated: ${updated} | Failed: ${failed}`)
  }

  if (failed > 0) {
    process.exit(1)
  }

  process.exit(0)
}

if (process.argv[1]?.includes('ingest.ts')) {
  runCli().catch((err) => {
    console.error('Fatal Ingestion Error:', err)
    process.exit(1)
  })
}
