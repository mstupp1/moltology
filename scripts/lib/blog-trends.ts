/**
 * Search-demand helpers for the blog-creator skill.
 *
 * Wraps DataForSEO's Google Trends "explore" endpoint (Google's own Trends API
 * is still an invite-only alpha). Values are Google Trends relative interest:
 * 0-100 within one request, so keywords are only comparable when they are
 * fetched together (max 5 per request).
 */

export const DATAFORSEO_EXPLORE_URL = 'https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live'
export const MAX_KEYWORDS_PER_REQUEST = 5

export type TrendsTimeRange =
  | 'past_7_days'
  | 'past_30_days'
  | 'past_90_days'
  | 'past_12_months'
  | 'past_5_years'

/** United States or worldwide. Other markets can be added with their DataForSEO location codes. */
export type TrendsGeo = 'US' | 'global'

export type Momentum = 'rising' | 'steady' | 'falling' | 'no data'

export interface KeywordInterest {
  keyword: string
  /** Mean relative interest over the whole range (0-100). */
  average: number
  /** Mean interest over the most recent quarter of the range. */
  recent: number
  momentum: Momentum
}

export interface RelatedQuery {
  query: string
  /** Top: relative popularity 0-100. Rising: percent increase (or "Breakout"). */
  value: string
}

export interface RelatedQueries {
  keyword: string
  top: RelatedQuery[]
  rising: RelatedQuery[]
}

export interface DataForSeoCredentials {
  login: string
  password: string
}

interface GraphPoint {
  values?: Array<number | null> | number | null
  missing_data?: boolean
}

interface ExploreItem {
  type?: string
  keywords?: string[]
  data?: unknown
}

interface ExploreResponse {
  status_code?: number
  status_message?: string
  tasks?: Array<{
    status_code?: number
    status_message?: string
    result?: Array<{ items?: ExploreItem[] | null }> | null
  }>
}

type FetchLike = (input: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>

export function readDataForSeoCredentials(env: NodeJS.ProcessEnv = process.env): DataForSeoCredentials | null {
  const login = env.DATAFORSEO_LOGIN?.trim()
  const password = env.DATAFORSEO_PASSWORD?.trim()
  return login && password ? { login, password } : null
}

/** Public Google Trends compare link, for a person to eyeball the same data for free. */
export function buildTrendsExploreUrl(keywords: string[], geo: TrendsGeo = 'US', range: TrendsTimeRange = 'past_90_days'): string {
  const dateByRange: Record<TrendsTimeRange, string> = {
    past_7_days: 'now 7-d',
    past_30_days: 'today 1-m',
    past_90_days: 'today 3-m',
    past_12_months: 'today 12-m',
    past_5_years: 'today 5-y',
  }
  const params = new URLSearchParams({ date: dateByRange[range], q: keywords.join(',') })
  if (geo === 'US') params.set('geo', 'US')
  return `https://trends.google.com/trends/explore?${params.toString()}`
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function classifyMomentum(earlier: number, recent: number): Momentum {
  if (earlier === 0 && recent === 0) return 'no data'
  if (earlier === 0) return 'rising'
  const change = (recent - earlier) / earlier
  if (change >= 0.2) return 'rising'
  if (change <= -0.2) return 'falling'
  return 'steady'
}

/** Turns a google_trends_graph series into per-keyword averages and momentum. */
export function summarizeGraph(keywords: string[], points: GraphPoint[]): KeywordInterest[] {
  const usable = points.filter((p) => !p.missing_data)
  const recentCount = Math.max(1, Math.ceil(usable.length / 4))

  return keywords
    .map((keyword, idx) => {
      const series = usable.map((p) => {
        const raw = Array.isArray(p.values) ? p.values[idx] : idx === 0 ? p.values : null
        return typeof raw === 'number' ? raw : 0
      })
      const recentSlice = series.slice(-recentCount)
      const earlierSlice = series.slice(0, Math.max(0, series.length - recentCount))
      const recent = mean(recentSlice)
      return {
        keyword,
        average: round1(mean(series)),
        recent: round1(recent),
        momentum: classifyMomentum(mean(earlierSlice), recent),
      }
    })
    .sort((a, b) => b.recent - a.recent || b.average - a.average)
}

export function parseRelatedQueries(keyword: string, data: unknown, limit = 10): RelatedQueries {
  const block = (data ?? {}) as { top?: unknown; rising?: unknown }
  const pick = (list: unknown): RelatedQuery[] =>
    (Array.isArray(list) ? list : [])
      .filter((q): q is { query: string; value?: unknown } => typeof q?.query === 'string')
      .slice(0, limit)
      .map((q) => ({ query: q.query, value: q.value == null ? '' : String(q.value) }))
  return { keyword, top: pick(block.top), rising: pick(block.rising) }
}

export function validateKeywords(keywords: string[]): string[] {
  const cleaned = [...new Set(keywords.map((k) => k.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean))]
  if (cleaned.length === 0) throw new Error('Pass at least one candidate keyword to compare.')
  if (cleaned.length > MAX_KEYWORDS_PER_REQUEST) {
    throw new Error(
      `Google Trends compares at most ${MAX_KEYWORDS_PER_REQUEST} keywords at once (got ${cleaned.length}). Trim the list or run it in rounds with the winner carried forward.`,
    )
  }
  const tooLong = cleaned.find((k) => k.length > 100)
  if (tooLong) throw new Error(`Keyword is longer than 100 characters: "${tooLong.slice(0, 40)}..."`)
  return cleaned
}

export interface ExploreOptions {
  geo?: TrendsGeo
  range?: TrendsTimeRange
  fetchImpl?: FetchLike
}

async function exploreItems(
  creds: DataForSeoCredentials,
  task: Record<string, unknown>,
  { fetchImpl = fetch as FetchLike }: ExploreOptions,
): Promise<ExploreItem[]> {
  const auth = Buffer.from(`${creds.login}:${creds.password}`).toString('base64')
  const res = await fetchImpl(DATAFORSEO_EXPLORE_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([task]),
  })
  if (!res.ok) throw new Error(`DataForSEO request failed with HTTP ${res.status}.`)
  const body = (await res.json()) as ExploreResponse
  const t = body.tasks?.[0]
  if (!t || (t.status_code && t.status_code >= 40000)) {
    throw new Error(`DataForSEO returned an error: ${t?.status_message ?? body.status_message ?? 'no task in response'}`)
  }
  return t.result?.[0]?.items ?? []
}

function baseTask(keywords: string[], opts: ExploreOptions): Record<string, unknown> {
  // location_code 2840 = United States; omitting it means worldwide.
  return {
    keywords,
    ...((opts.geo ?? 'US') === 'US' ? { location_code: 2840 } : {}),
    language_code: 'en',
    time_range: opts.range ?? 'past_90_days',
  }
}

export async function fetchInterest(
  creds: DataForSeoCredentials,
  keywords: string[],
  opts: ExploreOptions = {},
): Promise<KeywordInterest[]> {
  const items = await exploreItems(creds, { ...baseTask(keywords, opts), item_types: ['google_trends_graph'] }, opts)
  const graph = items.find((i) => i.type === 'google_trends_graph')
  const points = Array.isArray(graph?.data) ? (graph.data as GraphPoint[]) : []
  return summarizeGraph(graph?.keywords?.length ? graph.keywords : keywords, points)
}

export async function fetchRelatedQueries(
  creds: DataForSeoCredentials,
  keyword: string,
  opts: ExploreOptions = {},
): Promise<RelatedQueries> {
  const items = await exploreItems(creds, { ...baseTask([keyword], opts), item_types: ['google_trends_queries_list'] }, opts)
  const list = items.find((i) => i.type === 'google_trends_queries_list')
  return parseRelatedQueries(keyword, list?.data)
}
