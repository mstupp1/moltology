#!/usr/bin/env node
/**
 * Writes Molt Academy courses and tracks from content/academy/ into the database.
 * Format: content/academy/README.md. Workflow: .agents/skills/academy-course-creator/SKILL.md.
 */
import path from 'node:path'
import { getIngestDb } from '../src/lib/ingest/handlers'
import {
  ACADEMY_CONTENT_ROOT,
  loadAcademyContent,
  syncAcademyCourse,
  syncAcademyTrack,
  type AcademySyncReport,
} from '../src/lib/ingest/academy-sync'

function printHelp() {
  console.log(`
Usage:
  npm run academy:ingest -- [options] [slug ...]

Reads ${ACADEMY_CONTENT_ROOT}/courses/<slug>/ and ${ACADEMY_CONTENT_ROOT}/tracks/<slug>.md and writes
them to the database. Pass course or track slugs to limit the run; courses run before tracks.

Options:
      --dry-run      Check every file and report what would change. Uses the database only to
                     compare (when a URL is available); writes nothing and uploads nothing.
      --dev          Write to the development database (DEV_DATABASE_URL).
      --db <url>     Explicit database connection string.
                     Without --dev or --db the production database is used.
      --prune        Delete lessons that are no longer listed. Member progress on them is deleted too.
      --root <dir>   Read a different content folder (default ${ACADEMY_CONTENT_ROOT}).
  -h, --help         Show this help.

Examples:
  npm run academy:ingest -- --dry-run
  npm run academy:ingest -- --dev introduction-to-ecdysis
  npm run academy:ingest -- introduction-to-ecdysis first-shell
`)
}

function parseArgs(argv: string[]) {
  const options = { dryRun: false, dev: false, prune: false, dbUrl: undefined as string | undefined, root: ACADEMY_CONTENT_ROOT, only: [] as string[], help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') options.help = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--dev') options.dev = true
    else if (arg === '--prune') options.prune = true
    else if (arg === '--db') options.dbUrl = argv[++i]
    else if (arg === '--root') options.root = argv[++i]
    else if (!arg.startsWith('-')) options.only.push(arg)
    else throw new Error(`Unknown option ${arg}`)
  }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const tree = loadAcademyContent(options.root, options.only)
  for (const issue of tree.issues) {
    const mark = issue.severity === 'error' ? '✗' : '⚠'
    console.log(`  ${mark} ${path.relative(process.cwd(), issue.path)}: ${issue.message}`)
  }
  const errors = tree.issues.filter((issue) => issue.severity === 'error').length
  if (errors > 0) {
    console.error(`\n${errors} problem(s) to fix before anything is written.`)
    process.exit(1)
  }
  if (tree.courses.length === 0 && tree.tracks.length === 0) {
    console.log(options.only.length ? `Nothing in ${options.root} matches ${options.only.join(', ')}.` : `No courses or tracks in ${options.root} yet.`)
    return
  }

  let db: any = null
  try {
    db = getIngestDb({ dev: options.dev, dbUrl: options.dbUrl })
  } catch (error) {
    if (!options.dryRun) throw error
    console.log('No database URL found; checking files only.')
  }
  const target = !db ? 'files only' : options.dbUrl ? 'custom database' : options.dev ? 'dev database' : 'PRODUCTION database'
  console.log(`${options.dryRun ? 'Checking' : 'Writing'} ${tree.courses.length} course(s) and ${tree.tracks.length} track(s) (${target})...`)

  const reports: AcademySyncReport[] = []
  let failed = 0
  const syncOptions = { dryRun: options.dryRun, prune: options.prune, log: (line: string) => console.log(line) }
  const steps = [
    ...tree.courses.map((course) => () => syncAcademyCourse(db, course, syncOptions)),
    ...tree.tracks.map((track) => () => syncAcademyTrack(db, track, syncOptions)),
  ]
  for (const step of steps) {
    try {
      const report = await step()
      reports.push(report)
      const notes = report.notes.length ? ` (${report.notes.join('; ')})` : ''
      console.log(`  ✓ ${report.kind} ${report.slug}: ${report.action}, ${report.status}${notes}`)
    } catch (error) {
      failed += 1
      console.error(`  ✗ ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const published = reports.filter((report) => report.status === 'published').length
  console.log(`\nDone: ${reports.length} ok, ${failed} failed. ${published} published, ${reports.length - published} draft.`)
  if (failed > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
