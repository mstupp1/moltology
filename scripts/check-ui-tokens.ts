#!/usr/bin/env node
/**
 * UI Token Guard
 *
 * Blocks new styling that bypasses the shared UI tokens (docs/design/ui-tokens.md):
 * arbitrary hex colour classes, chamfer corners, text under 11px and radii off the
 * chip/control/card/panel scale. Existing hits are recorded per file in
 * scripts/ui-token-baseline.json; a file may only go down, never up.
 *
 * Run: npm run ui:check
 * After cleaning files up: npm run ui:check -- --update (records the lower counts)
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {
  UI_TOKEN_RULES,
  countUiTokenViolations,
  findRegressions,
  totals,
  type UiTokenBaseline,
} from './lib/ui-token-guard'

const BASELINE_PATH = 'scripts/ui-token-baseline.json'

function listSourceFiles(): string[] {
  return execSync('git ls-files -- "src/*.tsx"', { encoding: 'utf8' })
    .split('\n')
    .filter((file) => file && !/\.test\.tsx$/.test(file) && fs.existsSync(file))
}

function scan(): UiTokenBaseline {
  const counts: UiTokenBaseline = {}
  for (const file of listSourceFiles()) {
    const fileCounts = countUiTokenViolations(fs.readFileSync(file, 'utf8'))
    if (Object.keys(fileCounts).length > 0) counts[file] = fileCounts
  }
  return counts
}

function sortedJson(counts: UiTokenBaseline): string {
  const sorted = Object.fromEntries(Object.keys(counts).sort().map((file) => [file, counts[file]]))
  return `${JSON.stringify(sorted, null, 2)}\n`
}

const current = scan()

if (process.argv.includes('--update')) {
  fs.writeFileSync(BASELINE_PATH, sortedJson(current))
  console.log(`[ui:check] Baseline written to ${BASELINE_PATH}`, totals(current))
  process.exit(0)
}

const baseline: UiTokenBaseline = fs.existsSync(BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  : {}

const regressions = findRegressions(current, baseline)

if (regressions.length > 0) {
  console.error('[ui:check] New styling that bypasses the UI tokens (see docs/design/ui-tokens.md):')
  for (const r of regressions) {
    console.error(`  ${r.file}: ${r.rule} ${r.baseline} -> ${r.current} (${UI_TOKEN_RULES[r.rule].hint})`)
  }
  console.error('Use the tokens instead. If the hit is intended, explain why in the PR and run `npm run ui:check -- --update`.')
  process.exit(1)
}

const before = totals(baseline)
const now = totals(current)
const improved = Object.keys(now).some((rule) => now[rule as keyof typeof now] < before[rule as keyof typeof before])
console.log(`[ui:check] OK. Remaining hits: ${JSON.stringify(now)}`)
if (improved) {
  console.log(`[ui:check] Counts dropped below the baseline. Run \`npm run ui:check -- --update\` to lock them in (${path.basename(BASELINE_PATH)}).`)
}
