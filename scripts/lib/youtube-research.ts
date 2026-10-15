/**
 * YouTube demand research for the long-form channel (yt:research).
 *
 * Depth-first search, after Jake Trinder's method:
 *  1. Search a seed keyword and keep long-form results.
 *  2. Score each result against its channel's median views. 3x or more is an outlier.
 *  3. Open each result's channel and log that channel's own outliers.
 *  4. Expand into the next keywords from YouTube autocomplete, then move on.
 *
 * Negative evidence: every title is tagged with the formats it uses, and each
 * format is scored on wins (outliers) and flops (half the channel median or less)
 * across every video seen, so one viral hit never validates a format alone.
 *
 * Uses the free YouTube Data API v3 (10,000 quota units a day). A search costs
 * 100 units; video, channel and playlist reads cost 1 unit per 50 items.
 */

import type { FetchLike } from './blog-trends'

export const YT_API = 'https://www.googleapis.com/youtube/v3'
export const OUTLIER_RATIO = 3
export const FLOP_RATIO = 0.5
/** YouTube Shorts can run up to 3 minutes; anything this short is not long-form. */
export const SHORT_MAX_SECONDS = 180
export const QUOTA_COST = { search: 100, list: 1 } as const

const defaultFetch: FetchLike = (input, init) => fetch(input, init)

export interface ResearchVideo {
  id: string
  title: string
  channelId: string
  channelTitle: string
  publishedAt: string
  durationSeconds: number
  views: number
  thumbnail: string | null
  /** Views divided by the channel's median long-form views. Null until the channel is scored. */
  ratio: number | null
  formats: string[]
  /** Keyword or channel that surfaced the video. */
  foundVia: string
}

export interface ChannelBaseline {
  id: string
  title: string
  subscribers: number | null
  medianViews: number
  sampleSize: number
}

export interface FormatScore {
  format: string
  label: string
  videos: number
  wins: number
  flops: number
  /** Wins divided by scored videos using the format. */
  winRate: number
  validated: boolean
  /** Typical length of the winners, which hints at the structure behind them. */
  medianWinnerMinutes: number | null
  examples: string[]
}

export class QuotaBudget {
  used = 0
  constructor(readonly limit: number) {}
  canSpend(units: number) {
    return this.used + units <= this.limit
  }
  spend(units: number) {
    if (!this.canSpend(units)) throw new QuotaExhausted(this.used, this.limit)
    this.used += units
  }
}

export class QuotaExhausted extends Error {
  constructor(used: number, limit: number) {
    super(`Quota budget reached (${used} of ${limit} units). Raise --budget or research fewer keywords.`)
  }
}

/** ISO 8601 duration (PT1H2M3S) to seconds. */
export function parseIsoDuration(value: string | undefined | null): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value ?? '')
  if (!m) return 0
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0))
  return d * 86400 + h * 3600 + min * 60 + s
}

export function median(nums: number[]): number {
  if (!nums.length) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Title formats worth testing. Each is a psychological shape, not a topic,
 * so the same format can be compared across channels and niches.
 */
export const TITLE_FORMATS: { id: string; label: string; pattern: RegExp }[] = [
  { id: 'mechanism', label: "If you don't understand X, you don't understand Y", pattern: /\bif you don'?t (understand|know)\b/i },
  { id: 'unfair-advantage', label: 'So fast/easy it feels like cheating', pattern: /\b(feels? like cheating|unfair advantage|cheat code)\b/i },
  { id: 'experiment', label: 'I tried / did X for N days', pattern: /\bi (tried|did|quit|stopped|followed|lived)\b.*\b\d+\s*(days?|weeks?|months?|hours?)\b|\b\d+\s*days? (of|without)\b/i },
  { id: 'listicle', label: 'N ways / habits / things', pattern: /^\s*(\d+|top \d+)\s+\w+|\b\d+\s+(ways|habits|things|rules|lessons|signs|steps|tips|mistakes|books|tools|hacks|secrets)\b/i },
  { id: 'why', label: 'Why X (explainer)', pattern: /^\s*why\b|\bthis is why\b|\bhere'?s why\b/i },
  { id: 'how-to', label: 'How to X', pattern: /\bhow to\b/i },
  { id: 'how-i', label: 'How I X (personal story)', pattern: /\bhow i\b/i },
  { id: 'stop', label: 'Stop X / Quit X', pattern: /^\s*(stop|quit|never)\b/i },
  { id: 'wrong', label: "You're doing X wrong", pattern: /\b(wrong|mistake|myth|lie|lied)\b/i },
  { id: 'secret', label: 'Nobody tells you / the truth about', pattern: /\b(nobody|no one) (tells|talks)|\btruth about\b|\bsecret\b|\bhidden\b/i },
  { id: 'shift', label: 'The new era / X is changing', pattern: /\b(new era|is (changing|dead|over)|has (just )?begun|end of)\b/i },
  { id: 'system', label: 'The X system / method / protocol', pattern: /\b(system|method|protocol|framework|routine|blueprint)\b/i },
  { id: 'reset', label: 'Reset / reinvent / rebuild your life', pattern: /\b(reset|reinvent|rebuild|transform|fix) (your|my) (life|self|brain|routine)\b|\bglow ?up\b/i },
  { id: 'question', label: 'Question title', pattern: /\?\s*$/ },
  { id: 'versus', label: 'X vs Y', pattern: /\bvs\.?\b|\bversus\b/i },
]

export function classifyTitle(title: string): string[] {
  return TITLE_FORMATS.filter((f) => f.pattern.test(title)).map((f) => f.id)
}

export interface YoutubeClientOptions {
  apiKey: string
  budget: QuotaBudget
  fetchImpl?: FetchLike
  regionCode?: string
}

/** Thin YouTube Data API client that counts quota before every call. */
export class YoutubeClient {
  private readonly fetchImpl: FetchLike
  constructor(private readonly opts: YoutubeClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? defaultFetch
  }

  get budget() {
    return this.opts.budget
  }

  private async get<T>(endpoint: string, params: Record<string, string>, units: number): Promise<T> {
    this.opts.budget.spend(units)
    const qs = new URLSearchParams({ ...params, key: this.opts.apiKey })
    const res = await this.fetchImpl(`${YT_API}/${endpoint}?${qs.toString()}`)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(explainApiError(res.status, body))
    }
    return (await res.json()) as T
  }

  /** Video ids for a keyword, long-form only (medium and long durations). */
  async searchVideoIds(query: string, max = 50): Promise<string[]> {
    const ids: string[] = []
    // Two passes because the API filters duration as under 4, 4 to 20, or over 20 minutes.
    for (const videoDuration of ['medium', 'long']) {
      const data = await this.get<{ items?: { id?: { videoId?: string } }[] }>(
        'search',
        {
          part: 'id',
          q: query,
          type: 'video',
          maxResults: String(Math.min(max, 50)),
          order: 'relevance',
          videoDuration,
          relevanceLanguage: 'en',
          regionCode: this.opts.regionCode ?? 'US',
        },
        QUOTA_COST.search,
      )
      for (const item of data.items ?? []) if (item.id?.videoId) ids.push(item.id.videoId)
    }
    return [...new Set(ids)]
  }

  async videos(ids: string[], foundVia: string): Promise<ResearchVideo[]> {
    const out: ResearchVideo[] = []
    for (let i = 0; i < ids.length; i += 50) {
      const data = await this.get<{ items?: RawVideo[] }>(
        'videos',
        { part: 'snippet,statistics,contentDetails', id: ids.slice(i, i + 50).join(','), maxResults: '50' },
        QUOTA_COST.list,
      )
      for (const v of data.items ?? []) out.push(toResearchVideo(v, foundVia))
    }
    return out
  }

  async channels(ids: string[]): Promise<RawChannel[]> {
    const out: RawChannel[] = []
    for (let i = 0; i < ids.length; i += 50) {
      const data = await this.get<{ items?: RawChannel[] }>(
        'channels',
        { part: 'snippet,statistics,contentDetails', id: ids.slice(i, i + 50).join(','), maxResults: '50' },
        QUOTA_COST.list,
      )
      out.push(...(data.items ?? []))
    }
    return out
  }

  /** Most recent upload ids from a channel's uploads playlist. */
  async recentUploadIds(uploadsPlaylistId: string, max = 50): Promise<string[]> {
    const data = await this.get<{ items?: { contentDetails?: { videoId?: string } }[] }>(
      'playlistItems',
      { part: 'contentDetails', playlistId: uploadsPlaylistId, maxResults: String(Math.min(max, 50)) },
      QUOTA_COST.list,
    )
    return (data.items ?? []).map((i) => i.contentDetails?.videoId).filter((id): id is string => Boolean(id))
  }
}

interface RawVideo {
  id: string
  snippet?: {
    title?: string
    channelId?: string
    channelTitle?: string
    publishedAt?: string
    thumbnails?: Record<string, { url?: string }>
  }
  statistics?: { viewCount?: string }
  contentDetails?: { duration?: string }
}

export interface RawChannel {
  id: string
  snippet?: { title?: string }
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean }
  contentDetails?: { relatedPlaylists?: { uploads?: string } }
}

export function toResearchVideo(v: RawVideo, foundVia: string): ResearchVideo {
  const title = v.snippet?.title ?? ''
  const thumbs = v.snippet?.thumbnails ?? {}
  return {
    id: v.id,
    title,
    channelId: v.snippet?.channelId ?? '',
    channelTitle: v.snippet?.channelTitle ?? '',
    publishedAt: v.snippet?.publishedAt ?? '',
    durationSeconds: parseIsoDuration(v.contentDetails?.duration),
    views: Number(v.statistics?.viewCount ?? 0),
    thumbnail: thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? null,
    ratio: null,
    formats: classifyTitle(title),
    foundVia,
  }
}

export function explainApiError(status: number, body: string): string {
  if (status === 403 && /accessNotConfigured|has not been used|SERVICE_DISABLED|API_KEY_SERVICE_BLOCKED/i.test(body)) {
    return 'YouTube Data API v3 is not enabled for this key. Turn it on in the Google Cloud project that owns the key, or check the key\'s API restrictions.'
  }
  if (status === 403 && /quotaExceeded|dailyLimitExceeded/i.test(body)) {
    return 'The daily YouTube API quota is used up. It resets at midnight Pacific time.'
  }
  if (status === 400 && /API key not valid|keyInvalid/i.test(body)) return 'The YouTube API key is not valid.'
  return `YouTube API request failed (HTTP ${status}). ${body.slice(0, 200)}`
}

export function isLongForm(v: Pick<ResearchVideo, 'durationSeconds'>): boolean {
  return v.durationSeconds > SHORT_MAX_SECONDS
}

/** Median long-form views over a channel's recent uploads. */
export function channelBaseline(channel: RawChannel, uploads: ResearchVideo[]): ChannelBaseline {
  const longForm = uploads.filter(isLongForm)
  const subs = channel.statistics?.hiddenSubscriberCount ? null : Number(channel.statistics?.subscriberCount ?? NaN)
  return {
    id: channel.id,
    title: channel.snippet?.title ?? '',
    subscribers: Number.isFinite(subs) ? subs : null,
    medianViews: median(longForm.map((v) => v.views)),
    sampleSize: longForm.length,
  }
}

/** Fills in ratio for every video whose channel has a usable baseline. */
export function scoreVideos(videos: ResearchVideo[], baselines: Map<string, ChannelBaseline>, minSample = 5): ResearchVideo[] {
  return videos.map((v) => {
    const b = baselines.get(v.channelId)
    const ratio = b && b.sampleSize >= minSample && b.medianViews > 0 ? v.views / b.medianViews : null
    return { ...v, ratio: ratio === null ? null : Math.round(ratio * 100) / 100 }
  })
}

export function isOutlier(v: ResearchVideo, ratio = OUTLIER_RATIO): boolean {
  return v.ratio !== null && v.ratio >= ratio
}

/**
 * Wins and flops per title format across every scored video. A format is
 * validated only with enough samples and more wins than flops.
 */
export function scoreFormats(videos: ResearchVideo[], minVideos = 8): FormatScore[] {
  const scored = videos.filter((v) => v.ratio !== null)
  return TITLE_FORMATS.map((f) => {
    const using = scored.filter((v) => v.formats.includes(f.id))
    const winners = using.filter((v) => isOutlier(v))
    const flops = using.filter((v) => (v.ratio ?? 1) <= FLOP_RATIO).length
    const winRate = using.length ? winners.length / using.length : 0
    return {
      format: f.id,
      label: f.label,
      videos: using.length,
      wins: winners.length,
      flops,
      winRate: Math.round(winRate * 100) / 100,
      validated: using.length >= minVideos && winners.length > flops,
      medianWinnerMinutes: winners.length ? Math.round(median(winners.map((v) => v.durationSeconds)) / 60) : null,
      examples: [...winners].sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0)).slice(0, 3).map((v) => v.title),
    }
  })
    .filter((s) => s.videos > 0)
    .sort((a, b) => Number(b.validated) - Number(a.validated) || b.winRate - a.winRate || b.videos - a.videos)
}

export interface ResearchOptions {
  keywords: string[]
  /** Next keywords taken from YouTube autocomplete per seed. 0 turns expansion off. */
  expandPerKeyword: number
  suggest?: (keyword: string) => Promise<string[]>
  log?: (line: string) => void
}

export interface ResearchResult {
  keywords: string[]
  videos: ResearchVideo[]
  channels: ChannelBaseline[]
  formats: FormatScore[]
  quotaUsed: number
  stoppedEarly: string | null
}

/**
 * Runs the depth-first search. Finishes each keyword (search, score, open
 * outlier channels) before moving to the next, and stops cleanly when the
 * quota budget runs out, keeping what it already found.
 */
export async function runResearch(client: YoutubeClient, opts: ResearchOptions): Promise<ResearchResult> {
  const log = opts.log ?? (() => {})
  const videos = new Map<string, ResearchVideo>()
  const baselines = new Map<string, ChannelBaseline>()
  const rawChannels = new Map<string, RawChannel>()
  const queue = [...opts.keywords]
  const seen = new Set<string>()
  const done: string[] = []
  let stoppedEarly: string | null = null

  async function baselineFor(channelIds: string[]) {
    const missing = channelIds.filter((id) => !rawChannels.has(id))
    if (missing.length) for (const c of await client.channels(missing)) rawChannels.set(c.id, c)
    for (const id of channelIds) {
      if (baselines.has(id)) continue
      const channel = rawChannels.get(id)
      const uploadsId = channel?.contentDetails?.relatedPlaylists?.uploads
      if (!channel || !uploadsId) continue
      const uploads = await client.videos(await client.recentUploadIds(uploadsId), `channel:${channel.snippet?.title ?? id}`)
      baselines.set(id, channelBaseline(channel, uploads))
      for (const v of uploads) if (isLongForm(v) && !videos.has(v.id)) videos.set(v.id, v)
    }
  }

  try {
    while (queue.length) {
      const keyword = queue.shift()!.trim().toLowerCase()
      if (!keyword || seen.has(keyword)) continue
      seen.add(keyword)
      log(`Searching "${keyword}"`)

      const found = (await client.videos(await client.searchVideoIds(keyword), keyword)).filter(isLongForm)
      for (const v of found) if (!videos.has(v.id)) videos.set(v.id, v)
      await baselineFor([...new Set(found.map((v) => v.channelId))])

      // Every channel in the results is opened: its recent uploads set the baseline,
      // and those uploads join the pool, so an outlier channel's other hits are logged too.
      const outliers = scoreVideos(found, baselines).filter((v) => isOutlier(v))
      log(`  ${found.length} long-form results, ${outliers.length} outliers`)
      done.push(keyword)

      if (opts.expandPerKeyword > 0 && opts.suggest && opts.keywords.includes(keyword)) {
        const next = (await opts.suggest(keyword).catch(() => [] as string[]))
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s && s !== keyword && !seen.has(s))
          .slice(0, opts.expandPerKeyword)
        // Depth first: the seed's own expansions go before the next seed.
        queue.unshift(...next)
      }
    }
  } catch (err) {
    if (!(err instanceof QuotaExhausted)) throw err
    stoppedEarly = err.message
    log(`  ${err.message}`)
  }

  const all = scoreVideos([...videos.values()], baselines)
  return {
    keywords: done,
    videos: all.sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1)),
    channels: [...baselines.values()].sort((a, b) => b.medianViews - a.medianViews),
    formats: scoreFormats(all),
    quotaUsed: client.budget.used,
    stoppedEarly,
  }
}

function fmtViews(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`
  return String(n)
}

/** Markdown report for Myles and the long-form skill. */
export function renderReport(result: ResearchResult, date: string, topOutliers = 30): string {
  const outliers = result.videos.filter((v) => isOutlier(v)).slice(0, topOutliers)
  const lines = [
    `# YouTube research, ${date}`,
    '',
    `Keywords searched: ${result.keywords.join(', ') || 'none'}`,
    `Videos scored: ${result.videos.filter((v) => v.ratio !== null).length}. Channels opened: ${result.channels.length}. Quota used: ${result.quotaUsed} units.`,
    ...(result.stoppedEarly ? ['', `Stopped early: ${result.stoppedEarly}`] : []),
    '',
    '## Title formats (wins vs flops)',
    '',
    `A win is ${OUTLIER_RATIO}x or more of the channel's median views; a flop is ${FLOP_RATIO}x or less. Validated means at least 8 videos and more wins than flops.`,
    '',
    '| Format | Videos | Wins | Flops | Win rate | Winner length | Validated |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...result.formats.map(
      (f) =>
        `| ${f.label} | ${f.videos} | ${f.wins} | ${f.flops} | ${Math.round(f.winRate * 100)}% | ${f.medianWinnerMinutes === null ? '' : `${f.medianWinnerMinutes} min`} | ${f.validated ? 'yes' : 'no'} |`,
    ),
    '',
    '## Top outliers',
    '',
    '| Ratio | Views | Title | Channel | Length | Formats |',
    '| --- | --- | --- | --- | --- | --- |',
    ...outliers.map(
      (v) =>
        `| ${v.ratio}x | ${fmtViews(v.views)} | [${v.title.replace(/\|/g, '/')}](https://www.youtube.com/watch?v=${v.id}) | ${v.channelTitle.replace(/\|/g, '/')} | ${Math.round(v.durationSeconds / 60)} min | ${v.formats.join(', ')} |`,
    ),
    '',
  ]
  return lines.join('\n')
}
