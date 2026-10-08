import { describe, expect, it, vi } from 'vitest'
import {
  buildTrendsExploreUrl,
  classifyMomentum,
  fetchKeywordDemand,
  fetchSuggestions,
  fetchWikipediaInterest,
  isCloseMatch,
  longTail,
  pageviewWindow,
  parseSuggestions,
  parseTrendingRss,
  rankDemand,
  summarizeSeries,
  validateKeywords,
  type FetchLike,
  type KeywordDemand,
} from './blog-trends'

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) }
}

/** Routes fake responses by URL substring. */
function routedFetch(routes: Record<string, unknown>): FetchLike & ReturnType<typeof vi.fn> {
  return vi.fn(async (url: string) => {
    const hit = Object.keys(routes).find((k) => url.includes(k))
    if (!hit) return jsonResponse({}, 404)
    const value = routes[hit]
    return typeof value === 'number' ? jsonResponse({}, value) : jsonResponse(value)
  }) as unknown as FetchLike & ReturnType<typeof vi.fn>
}

const NOW = new Date('2026-10-08T12:00:00Z')

describe('validateKeywords', () => {
  it('trims, lowercases and dedupes', () => {
    expect(validateKeywords([' AI Agents ', 'ai agents', 'robots'])).toEqual(['ai agents', 'robots'])
  })

  it('rejects more than five keywords and empty input', () => {
    expect(() => validateKeywords(['a', 'b', 'c', 'd', 'e', 'f'])).toThrow(/at most 5/)
    expect(() => validateKeywords(['  '])).toThrow(/at least one/)
  })
})

describe('classifyMomentum and summarizeSeries', () => {
  it('labels a 20% swing either way', () => {
    expect(classifyMomentum(50, 60)).toBe('rising')
    expect(classifyMomentum(50, 40)).toBe('falling')
    expect(classifyMomentum(50, 55)).toBe('steady')
    expect(classifyMomentum(0, 0)).toBe('no data')
    expect(classifyMomentum(0, 10)).toBe('rising')
  })

  it('compares the last quarter against the rest', () => {
    expect(summarizeSeries([10, 10, 10, 30])).toEqual({ average: 15, recent: 30, momentum: 'rising' })
    expect(summarizeSeries([])).toEqual({ average: 0, recent: 0, momentum: 'no data' })
  })
})

describe('autocomplete', () => {
  it('parses the firefox client shape and ignores junk', () => {
    expect(parseSuggestions(['ai', ['AI Agents', 'ai art', 3]])).toEqual(['ai agents', 'ai art'])
    expect(parseSuggestions({})).toEqual([])
  })

  it('adds ds=yt for YouTube and gl=us for the US', async () => {
    const fetchImpl = routedFetch({ suggestqueries: ['x', ['x one']] })
    await fetchSuggestions('x', 'youtube', 'US', fetchImpl)
    const url = new URL(fetchImpl.mock.calls[0][0] as string)
    expect(url.searchParams.get('ds')).toBe('yt')
    expect(url.searchParams.get('gl')).toBe('us')
    await fetchSuggestions('x', 'google', 'global', fetchImpl)
    const url2 = new URL(fetchImpl.mock.calls[1][0] as string)
    expect(url2.searchParams.has('ds')).toBe(false)
    expect(url2.searchParams.has('gl')).toBe(false)
  })
})

describe('wikipedia', () => {
  it('ends the window yesterday and spans 90 days', () => {
    expect(pageviewWindow(NOW)).toEqual({ start: '20260710', end: '20261007' })
  })

  it('finds the article and summarizes its pageviews', async () => {
    const fetchImpl = routedFetch({
      'w/api.php': ['humanoid robot', ['Humanoid robot']],
      'pageviews/per-article': { items: [{ views: 100 }, { views: 100 }, { views: 100 }, { views: 200 }] },
    })
    const result = await fetchWikipediaInterest('humanoid robot', NOW, fetchImpl)
    expect(result).toEqual({ article: 'Humanoid robot', closeMatch: true, average: 125, recent: 200, momentum: 'rising' })
    expect(fetchImpl.mock.calls[1][0]).toContain('/user/Humanoid_robot/daily/20260710/20261007')
  })

  it('flags loosely related articles', () => {
    expect(isCloseMatch('ai agents', 'AI agent')).toBe(true)
    expect(isCloseMatch('ai browser', 'AI browser')).toBe(true)
    expect(isCloseMatch('computer use', 'Computing')).toBe(false)
  })

  it('returns null when no article matches', async () => {
    const fetchImpl = routedFetch({ 'w/api.php': ['zzqx', []] })
    expect(await fetchWikipediaInterest('zzqx', NOW, fetchImpl)).toBeNull()
  })
})

describe('fetchKeywordDemand', () => {
  it('keeps going when one source fails and records the error', async () => {
    const fetchImpl = routedFetch({
      'w/api.php': 429,
      suggestqueries: ['ai agents', ['ai agents', 'ai agents explained']],
    })
    const result = await fetchKeywordDemand('ai agents', { now: NOW, fetchImpl })
    expect(result.wikipedia).toBeNull()
    expect(result.google).toEqual(['ai agents', 'ai agents explained'])
    expect(result.suggestedAsIs).toBe(true)
    expect(result.errors).toEqual(['Wikipedia search returned HTTP 429'])
  })
})

describe('ranking and long tail', () => {
  const base = { google: [], youtube: [], suggestedAsIs: false, errors: [] }
  const wiki = (recent: number, closeMatch = true) => ({ article: 'A', closeMatch, average: recent, recent, momentum: 'steady' as const })

  it('ranks by recent Wikipedia views, then autocomplete breadth', () => {
    const results: KeywordDemand[] = [
      { ...base, keyword: 'none' },
      { ...base, keyword: 'small', wikipedia: wiki(10) },
      { ...base, keyword: 'big', wikipedia: wiki(500) },
      { ...base, keyword: 'loose', wikipedia: wiki(9000, false) },
      { ...base, keyword: 'typed', wikipedia: null, google: ['typed'], suggestedAsIs: true },
    ] as KeywordDemand[]
    expect(rankDemand(results).map((r) => r.keyword)).toEqual(['big', 'small', 'typed', 'none', 'loose'])
  })

  it('merges google and youtube suggestions without the keyword itself', () => {
    const r = { ...base, keyword: 'ai', wikipedia: null, google: ['ai', 'ai art'], youtube: ['ai art', 'ai news'] }
    expect(longTail(r)).toEqual(['ai art', 'ai news'])
  })
})

describe('trending feed and explore link', () => {
  it('parses items, traffic and the first headline', () => {
    const xml = `<rss><channel><item><title>aaron&apos;s game</title><ht:approx_traffic>200+</ht:approx_traffic>
      <ht:news_item><ht:news_item_title>Padres &amp; friends</ht:news_item_title></ht:news_item></item>
      <item><title>robots</title><ht:approx_traffic>1000+</ht:approx_traffic></item></channel></rss>`
    expect(parseTrendingRss(xml)).toEqual([
      { query: "aaron's game", traffic: '200+', headline: 'Padres & friends' },
      { query: 'robots', traffic: '1000+' },
    ])
  })

  it('builds a US compare link by default and drops geo for global', () => {
    const us = new URL(buildTrendsExploreUrl(['ai agents', 'robots']))
    expect(us.searchParams.get('q')).toBe('ai agents,robots')
    expect(us.searchParams.get('geo')).toBe('US')
    expect(new URL(buildTrendsExploreUrl(['x'], 'global')).searchParams.has('geo')).toBe(false)
  })
})
