#!/usr/bin/env node
import 'dotenv/config'
import {
  buildTrendsExploreUrl,
  fetchInterest,
  fetchRelatedQueries,
  readDataForSeoCredentials,
  validateKeywords,
  type TrendsGeo,
  type TrendsTimeRange,
} from './lib/blog-trends'

const RANGES: TrendsTimeRange[] = ['past_7_days', 'past_30_days', 'past_90_days', 'past_12_months', 'past_5_years']

function printHelp() {
  console.log(`
Usage:
  npm run blog:trends -- "<keyword>" ["<keyword>" ...] [options]

Options:
  --range <r>     ${RANGES.join(' | ')} (default past_90_days)
  --global        Worldwide demand instead of United States.
  --no-related    Skip the related-queries lookup for the leading keyword.
  --json          Print machine-readable JSON instead of a table.
  -h, --help      Display this help menu.

Summary:
  Compares up to 5 candidate search phrases on Google Trends (via DataForSEO)
  and lists the top and rising related searches for the leader. Use it during
  blog-creator Step 1 to pick the angle and target query with real demand.
  Needs DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD. Each run costs about $0.02.
`)
}

function parseArgs(argv: string[]) {
  const keywords: string[] = []
  let range: TrendsTimeRange = 'past_90_days'
  let geo: TrendsGeo = 'US'
  let related = true
  let json = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--range') {
      const r = argv[++i] as TrendsTimeRange
      if (!RANGES.includes(r)) throw new Error(`Unknown range "${r}". Use one of: ${RANGES.join(', ')}.`)
      range = r
    } else if (a === '--global') geo = 'global'
    else if (a === '--no-related') related = false
    else if (a === '--json') json = true
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}. Run with --help for usage.`)
    else keywords.push(a)
  }
  return { keywords: validateKeywords(keywords), range, geo, related, json }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    printHelp()
    process.exit(0)
  }

  const { keywords, range, geo, related, json } = parseArgs(argv)
  const exploreUrl = buildTrendsExploreUrl(keywords, geo, range)
  const creds = readDataForSeoCredentials()
  if (!creds) {
    console.error('DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are not set, so no demand data was fetched.')
    console.error(`Compare these by hand on Google Trends: ${exploreUrl}`)
    process.exit(2)
  }

  const interest = await fetchInterest(creds, keywords, { geo, range })
  const leader = interest.find((k) => k.average > 0)
  const relatedQueries = related && leader ? await fetchRelatedQueries(creds, leader.keyword, { geo, range }) : null

  if (json) {
    console.log(JSON.stringify({ range, geo, exploreUrl, interest, related: relatedQueries }, null, 2))
    return
  }

  console.log(`\nSearch interest, ${geo === 'US' ? 'United States' : 'worldwide'}, ${range.replace(/_/g, ' ')} (0-100, relative to each other)\n`)
  console.table(interest.map((k) => ({ keyword: k.keyword, average: k.average, recent: k.recent, momentum: k.momentum })))

  if (!leader) {
    console.log('None of these phrases has measurable search demand. Try broader, plainer wording.')
  } else if (relatedQueries) {
    console.log(`\nRelated searches for "${leader.keyword}"`)
    console.log('  Top:    ' + (relatedQueries.top.map((q) => q.query).join(' | ') || 'none'))
    console.log(
      '  Rising: ' + (relatedQueries.rising.map((q) => `${q.query} (+${q.value}%)`).join(' | ') || 'none'),
    )
  }
  console.log(`\nOpen in Google Trends: ${exploreUrl}\n`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
