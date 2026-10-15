#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fetchSuggestions } from './lib/blog-trends'
import { QuotaBudget, YoutubeClient, isOutlier, renderReport, runResearch } from './lib/youtube-research'

function printHelp() {
  console.log(`
Usage:
  npm run yt:research -- "<keyword>" ["<keyword>" ...] [options]

Options:
  --expand <n>    Next keywords to follow from YouTube autocomplete per seed (default 2, 0 = off).
  --budget <n>    Quota units this run may spend (default 3000 of the 10,000 daily).
  --out <dir>     Output folder (default tmp/youtube-research/<date>).
  --json          Also print the result as JSON.
  -h, --help      Display this help menu.

Summary:
  Depth-first YouTube demand research for the long-form channel. Searches each
  keyword, scores every long-form result against its channel's median views
  (3x or more is an outlier), opens each channel to log its other hits, then
  follows autocomplete into the next keywords before the next seed. Every title
  format is scored on wins and flops so a single hit never validates a format.

  Writes research.json (every video, channel baseline and format score) and
  report.md. Needs YOUTUBE_API_KEY, or GEMINI_API_KEY when the YouTube Data
  API v3 is enabled on that key's Google Cloud project. Each keyword costs
  about 200-300 units.
`)
}

function parseArgs(argv: string[]) {
  const keywords: string[] = []
  let expand = 2
  let budget = 3000
  let out: string | null = null
  let json = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const num = (name: string) => {
      const n = Number(argv[++i])
      if (!Number.isFinite(n) || n < 0) throw new Error(`${name} needs a number.`)
      return n
    }
    if (a === '--expand') expand = num('--expand')
    else if (a === '--budget') budget = num('--budget')
    else if (a === '--out') out = argv[++i] ?? null
    else if (a === '--json') json = true
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}. Run with --help for usage.`)
    else keywords.push(a)
  }
  if (!keywords.length) throw new Error('Pass at least one seed keyword.')
  return { keywords, expand, budget, out, json }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    printHelp()
    process.exit(0)
  }
  const { keywords, expand, budget, out, json } = parseArgs(argv)
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Set YOUTUBE_API_KEY (or GEMINI_API_KEY with the YouTube Data API v3 enabled on its project).')

  const date = new Date().toISOString().slice(0, 10)
  const outDir = path.resolve(out ?? path.join('tmp', 'youtube-research', date))
  const client = new YoutubeClient({ apiKey, budget: new QuotaBudget(budget) })

  const result = await runResearch(client, {
    keywords,
    expandPerKeyword: expand,
    suggest: (k) => fetchSuggestions(k, 'youtube', 'US'),
    log: (line) => console.log(line),
  })

  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'research.json'), JSON.stringify({ date, ...result }, null, 2))
  await writeFile(path.join(outDir, 'report.md'), renderReport(result, date))

  if (json) console.log(JSON.stringify(result, null, 2))
  const outliers = result.videos.filter((v) => isOutlier(v)).length
  const validated = result.formats.filter((f) => f.validated).map((f) => f.label)
  console.log(`\n${outliers} outliers from ${result.keywords.length} keywords, ${result.quotaUsed} quota units used.`)
  console.log(`Validated formats: ${validated.length ? validated.join('; ') : 'none yet (need more samples)'}`)
  console.log(`Report: ${path.join(outDir, 'report.md')}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
