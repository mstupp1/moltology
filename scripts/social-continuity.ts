#!/usr/bin/env tsx
/**
 * Prints the continuity report used before a social creative brief: recent pieces, the
 * latest episode of each series, overused cast and repeated hooks.
 *
 *   npm run social:continuity            # last 12 pieces
 *   npm run social:continuity -- --count 20
 *   npm run social:continuity -- --json
 */
import fs from 'node:fs'
import path from 'node:path'
import { formatContinuityReport, summarizeContinuity, type LedgerEntry } from './lib/social-continuity'

function readEntries(file: string, key: 'posts' | 'reels'): LedgerEntry[] {
  const full = path.resolve(process.cwd(), file)
  if (!fs.existsSync(full)) return []
  const data = JSON.parse(fs.readFileSync(full, 'utf8'))
  const list = Array.isArray(data) ? data : data[key]
  return Array.isArray(list) ? list.filter((e: unknown) => e && typeof e === 'object') : []
}

const args = process.argv.slice(2)
const countIndex = args.indexOf('--count')
const count = countIndex >= 0 ? Number(args[countIndex + 1]) || 12 : 12

const report = summarizeContinuity(
  readEntries('content/social/instagram-post-history.json', 'posts'),
  readEntries('content/social/instagram-reel-history.json', 'reels'),
  count
)

console.log(args.includes('--json') ? JSON.stringify(report, null, 2) : formatContinuityReport(report))
