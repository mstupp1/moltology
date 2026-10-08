#!/usr/bin/env node
import {
  buildTrendsExploreUrl,
  fetchKeywordDemand,
  fetchTrendingNow,
  longTail,
  rankDemand,
  validateKeywords,
  type TrendsGeo,
} from './lib/blog-trends'

function printHelp() {
  console.log(`
Usage:
  npm run blog:trends -- "<keyword>" ["<keyword>" ...] [options]
  npm run blog:trends -- --trending

Options:
  --global        Worldwide autocomplete instead of United States.
  --trending      Also list today's US breakout searches from Google Trends.
  --json          Print machine-readable JSON instead of tables.
  -h, --help      Display this help menu.

Summary:
  Free search-demand check for blog-creator Step 1. Compares up to 5 candidate
  phrases using Wikipedia daily views (real numbers, with rising/steady/falling
  momentum over 90 days) and Google + YouTube autocomplete (the exact wording
  people type), then lists long-tail phrasings for the leader. Prints a Google
  Trends compare link to open by hand. No API keys, no cost.
`)
}

function parseArgs(argv: string[]) {
  const keywords: string[] = []
  let geo: TrendsGeo = 'US'
  let trending = false
  let json = false
  for (const a of argv) {
    if (a === '--global') geo = 'global'
    else if (a === '--trending') trending = true
    else if (a === '--json') json = true
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}. Run with --help for usage.`)
    else keywords.push(a)
  }
  if (keywords.length === 0 && !trending) throw new Error('Pass at least one candidate keyword, or --trending.')
  return { keywords: keywords.length ? validateKeywords(keywords) : [], geo, trending, json }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    printHelp()
    process.exit(0)
  }

  const { keywords, geo, trending, json } = parseArgs(argv)
  const now = new Date()
  const ranked = rankDemand(await Promise.all(keywords.map((k) => fetchKeywordDemand(k, { geo, now }))))
  const leader = ranked[0]
  const exploreUrl = keywords.length ? buildTrendsExploreUrl(keywords, geo) : null

  let trendingNow: Awaited<ReturnType<typeof fetchTrendingNow>> = []
  let trendingError: string | null = null
  if (trending) {
    try {
      trendingNow = (await fetchTrendingNow()).slice(0, 20)
    } catch (err) {
      trendingError = err instanceof Error ? err.message : String(err)
    }
  }

  if (json) {
    console.log(JSON.stringify({ geo, exploreUrl, ranked, longTail: leader ? longTail(leader) : [], trendingNow, trendingError }, null, 2))
    return
  }

  if (ranked.length) {
    console.log('\nSearch demand (Wikipedia daily views over 90 days, autocomplete suggestion counts)\n')
    console.table(
      ranked.map((r) => ({
        keyword: r.keyword,
        'wikipedia article': r.wikipedia ? `${r.wikipedia.article}${r.wikipedia.closeMatch ? '' : ' (loose match)'}` : 'none found',
        'daily views': r.wikipedia?.average ?? '',
        'recent daily': r.wikipedia?.recent ?? '',
        momentum: r.wikipedia?.momentum ?? '',
        'typed as-is': r.suggestedAsIs ? 'yes' : 'no',
        google: r.google.length,
        youtube: r.youtube.length,
      })),
    )
    if (ranked.some((r) => r.wikipedia && !r.wikipedia.closeMatch)) {
      console.log('  A loose match means the closest article is a broader topic, so its views overstate demand for the phrase.')
    }
    for (const r of ranked) {
      for (const e of r.errors) console.warn(`  "${r.keyword}": ${e}`)
    }
    if (leader) {
      const tail = longTail(leader)
      console.log(`\nWhat people type around "${leader.keyword}":`)
      console.log(tail.length ? tail.map((t) => `  - ${t}`).join('\n') : '  (no suggestions; try plainer wording)')
    }
    console.log(`\nCompare relative interest on Google Trends: ${exploreUrl}`)
  }

  if (trending) {
    console.log('\nTrending US searches right now (Google Trends)\n')
    if (trendingError) console.warn(`  Could not load the trending feed: ${trendingError}`)
    else for (const t of trendingNow) console.log(`  ${t.traffic.padEnd(6)} ${t.query}${t.headline ? `  (${t.headline})` : ''}`)
  }
  console.log('')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
