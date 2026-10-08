/**
 * Free search-demand signals for the blog-creator skill. No API keys, no cost.
 *
 * - Google and YouTube autocomplete: the exact wording people type, ordered by
 *   popularity. A phrase with no suggestions has little search demand.
 * - Wikipedia pageviews: real daily view counts for the closest article, which
 *   makes candidates comparable and shows whether interest is rising.
 * - Google Trends "trending now" RSS: today's breakout US searches (optional).
 *
 * Google Trends itself has no free API (the official one is an invite-only
 * alpha and the web endpoints rate-limit scripts), so the CLI prints a compare
 * link for a person to open instead.
 */

export const USER_AGENT = 'MoltologyBlogTrends/1.0 (https://moltology.org)'
export const MAX_KEYWORDS = 5

export type TrendsGeo = 'US' | 'global'
export type Momentum = 'rising' | 'steady' | 'falling' | 'no data'
export type SuggestSource = 'google' | 'youtube'

export interface SeriesSummary {
  /** Mean daily views over the whole window. */
  average: number
  /** Mean daily views over the most recent quarter of the window. */
  recent: number
  momentum: Momentum
}

export interface WikipediaInterest extends SeriesSummary {
  article: string
  /** False when the closest article is only loosely related (e.g. "computer use" finding "Computing"). */
  closeMatch: boolean
}

export interface KeywordDemand {
  keyword: string
  wikipedia: WikipediaInterest | null
  google: string[]
  youtube: string[]
  /** True when autocomplete offers the phrase itself, a sign people type it as-is. */
  suggestedAsIs: boolean
  errors: string[]
}

export interface TrendingSearch {
  query: string
  traffic: string
  headline?: string
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json' | 'text'>>

const defaultFetch: FetchLike = (input, init) => fetch(input, init)

export function validateKeywords(keywords: string[]): string[] {
  const cleaned = [...new Set(keywords.map((k) => k.replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean))]
  if (cleaned.length === 0) throw new Error('Pass at least one candidate keyword to compare.')
  if (cleaned.length > MAX_KEYWORDS) {
    throw new Error(`Compare at most ${MAX_KEYWORDS} keywords at once (got ${cleaned.length}). Trim the list or run it in rounds.`)
  }
  return cleaned
}

/** Public Google Trends compare link, for a person to eyeball relative interest for free. */
export function buildTrendsExploreUrl(keywords: string[], geo: TrendsGeo = 'US'): string {
  const params = new URLSearchParams({ date: 'today 3-m', q: keywords.join(',') })
  if (geo === 'US') params.set('geo', 'US')
  return `https://trends.google.com/trends/explore?${params.toString()}`
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

function round(n: number): number {
  return Math.round(n)
}

export function classifyMomentum(earlier: number, recent: number): Momentum {
  if (earlier === 0 && recent === 0) return 'no data'
  if (earlier === 0) return 'rising'
  const change = (recent - earlier) / earlier
  if (change >= 0.2) return 'rising'
  if (change <= -0.2) return 'falling'
  return 'steady'
}

export function summarizeSeries(series: number[]): SeriesSummary {
  const recentCount = Math.max(1, Math.ceil(series.length / 4))
  const recentSlice = series.slice(-recentCount)
  const earlierSlice = series.slice(0, Math.max(0, series.length - recentCount))
  const recent = mean(recentSlice)
  return { average: round(mean(series)), recent: round(recent), momentum: classifyMomentum(mean(earlierSlice), recent) }
}

/** Parses the `client=firefox` autocomplete shape: [query, [suggestions...], ...]. */
export function parseSuggestions(body: unknown): string[] {
  if (!Array.isArray(body) || !Array.isArray(body[1])) return []
  return body[1].filter((s): s is string => typeof s === 'string').map((s) => s.toLowerCase())
}

export async function fetchSuggestions(
  query: string,
  source: SuggestSource,
  geo: TrendsGeo = 'US',
  fetchImpl: FetchLike = defaultFetch,
): Promise<string[]> {
  const params = new URLSearchParams({ client: 'firefox', hl: 'en', q: query })
  if (geo === 'US') params.set('gl', 'us')
  if (source === 'youtube') params.set('ds', 'yt')
  const res = await fetchImpl(`https://suggestqueries.google.com/complete/search?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) throw new Error(`${source} autocomplete returned HTTP ${res.status}`)
  return parseSuggestions(await res.json())
}

/** Every keyword word of 3+ letters must appear (by its first 5 letters) in the article title. */
export function isCloseMatch(keyword: string, article: string): boolean {
  const title = article.toLowerCase()
  return keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .every((w) => title.includes(w.slice(0, 5)))
}

function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

/** Wikipedia pageviews lag about a day, so the window ends yesterday. */
export function pageviewWindow(now: Date, days = 90): { start: string; end: string } {
  const end = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  return { start: yyyymmdd(start), end: yyyymmdd(end) }
}

export async function fetchWikipediaInterest(
  keyword: string,
  now: Date,
  fetchImpl: FetchLike = defaultFetch,
): Promise<WikipediaInterest | null> {
  const headers = { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT }
  const searchParams = new URLSearchParams({
    action: 'opensearch',
    search: keyword,
    limit: '1',
    namespace: '0',
    redirects: 'resolve',
    format: 'json',
  })
  const search = await fetchImpl(`https://en.wikipedia.org/w/api.php?${searchParams.toString()}`, { headers })
  if (!search.ok) throw new Error(`Wikipedia search returned HTTP ${search.status}`)
  const found = (await search.json()) as unknown
  const article = Array.isArray(found) && Array.isArray(found[1]) ? found[1][0] : undefined
  if (typeof article !== 'string') return null

  const { start, end } = pageviewWindow(now)
  const title = encodeURIComponent(article.replace(/ /g, '_'))
  const views = await fetchImpl(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${title}/daily/${start}/${end}`,
    { headers },
  )
  if (!views.ok) throw new Error(`Wikipedia pageviews returned HTTP ${views.status}`)
  const body = (await views.json()) as { items?: Array<{ views?: number }> }
  const series = (body.items ?? []).map((i) => (typeof i.views === 'number' ? i.views : 0))
  return { article, closeMatch: isCloseMatch(keyword, article), ...summarizeSeries(series) }
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Gathers every free signal for one keyword; a failing source is reported, never fatal. */
export async function fetchKeywordDemand(
  keyword: string,
  opts: { geo?: TrendsGeo; now?: Date; fetchImpl?: FetchLike } = {},
): Promise<KeywordDemand> {
  const { geo = 'US', now = new Date(), fetchImpl = defaultFetch } = opts
  const errors: string[] = []
  const settle = async <T>(p: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await p
    } catch (err) {
      errors.push(errorText(err))
      return fallback
    }
  }
  const [wikipedia, google, youtube] = await Promise.all([
    settle(fetchWikipediaInterest(keyword, now, fetchImpl), null),
    settle(fetchSuggestions(keyword, 'google', geo, fetchImpl), [] as string[]),
    settle(fetchSuggestions(keyword, 'youtube', geo, fetchImpl), [] as string[]),
  ])
  return { keyword, wikipedia, google, youtube, suggestedAsIs: google.includes(keyword), errors }
}

/** Ranks by Wikipedia daily views (close matches only), then by how much autocomplete offers. */
export function rankDemand(results: KeywordDemand[]): KeywordDemand[] {
  const views = (r: KeywordDemand) => (r.wikipedia?.closeMatch ? r.wikipedia.recent : -1)
  const score = (r: KeywordDemand) => r.google.length + r.youtube.length + (r.suggestedAsIs ? 5 : 0)
  return [...results].sort((a, b) => views(b) - views(a) || score(b) - score(a))
}

/** Long-tail ideas: suggestions that extend the keyword, Google first, deduped. */
export function longTail(result: KeywordDemand, limit = 12): string[] {
  return [...new Set([...result.google, ...result.youtube])].filter((s) => s !== result.keyword).slice(0, limit)
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

export function parseTrendingRss(xml: string): TrendingSearch[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  return items.map((item) => {
    const tag = (name: string) => item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]
    const headline = tag('ht:news_item_title')
    return {
      query: decodeXml(tag('title') ?? ''),
      traffic: decodeXml(tag('ht:approx_traffic') ?? ''),
      ...(headline ? { headline: decodeXml(headline) } : {}),
    }
  }).filter((t) => t.query)
}

/** United States only; the feed needs a country. */
export async function fetchTrendingNow(fetchImpl: FetchLike = defaultFetch): Promise<TrendingSearch[]> {
  const res = await fetchImpl('https://trends.google.com/trending/rss?geo=US', {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) throw new Error(`Google Trends trending feed returned HTTP ${res.status}`)
  return parseTrendingRss(await res.text())
}
