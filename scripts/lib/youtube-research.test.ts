import { describe, expect, it, vi } from 'vitest'
import type { FetchLike } from './blog-trends'
import {
  QuotaBudget,
  YoutubeClient,
  channelBaseline,
  classifyTitle,
  explainApiError,
  median,
  parseIsoDuration,
  renderReport,
  runResearch,
  scoreFormats,
  scoreVideos,
  type ChannelBaseline,
  type ResearchVideo,
} from './youtube-research'

function video(overrides: Partial<ResearchVideo>): ResearchVideo {
  return {
    id: 'v',
    title: 'A video',
    channelId: 'c1',
    channelTitle: 'Channel',
    publishedAt: '2026-01-01T00:00:00Z',
    durationSeconds: 600,
    views: 1000,
    thumbnail: null,
    ratio: null,
    formats: [],
    foundVia: 'test',
    ...overrides,
  }
}

describe('parseIsoDuration', () => {
  it('reads hours, minutes and seconds', () => {
    expect(parseIsoDuration('PT1H2M3S')).toBe(3723)
    expect(parseIsoDuration('PT45S')).toBe(45)
    expect(parseIsoDuration('P1DT1M')).toBe(86460)
  })
  it('returns 0 for missing or malformed values', () => {
    expect(parseIsoDuration(undefined)).toBe(0)
    expect(parseIsoDuration('soon')).toBe(0)
  })
})

describe('median', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBe(0)
  })
})

describe('classifyTitle', () => {
  it('tags the formats a title uses', () => {
    expect(classifyTitle("If you don't understand dopamine, you don't understand procrastination")).toContain('mechanism')
    expect(classifyTitle('I tried waking up at 5am for 30 days')).toContain('experiment')
    expect(classifyTitle('7 habits that changed my life')).toContain('listicle')
    expect(classifyTitle('How to stop procrastinating so fast it feels like cheating')).toEqual(
      expect.arrayContaining(['how-to', 'unfair-advantage']),
    )
    expect(classifyTitle('Why you can never focus?')).toEqual(expect.arrayContaining(['why', 'question']))
  })
  it('returns nothing for a plain title', () => {
    expect(classifyTitle('My desk tour')).toEqual([])
  })
})

describe('channelBaseline and scoreVideos', () => {
  it('uses only long-form uploads for the median and skips thin samples', () => {
    const uploads = [100, 200, 300, 400, 500].map((views, i) => video({ id: `u${i}`, views }))
    uploads.push(video({ id: 'short', views: 1_000_000, durationSeconds: 40 }))
    const baseline = channelBaseline({ id: 'c1', snippet: { title: 'C' }, statistics: { subscriberCount: '900' } }, uploads)
    expect(baseline).toMatchObject({ medianViews: 300, sampleSize: 5, subscribers: 900 })

    const baselines = new Map<string, ChannelBaseline>([['c1', baseline], ['c2', { ...baseline, id: 'c2', sampleSize: 2 }]])
    const [hit, thin] = scoreVideos([video({ views: 1200 }), video({ channelId: 'c2', views: 1200 })], baselines)
    expect(hit.ratio).toBe(4)
    expect(thin.ratio).toBeNull()
  })
})

describe('scoreFormats', () => {
  it('counts flops as negative evidence against a format', () => {
    const videos = [
      ...Array.from({ length: 3 }, (_, i) => video({ id: `w${i}`, ratio: 5, formats: ['listicle'], durationSeconds: 1200 })),
      ...Array.from({ length: 6 }, (_, i) => video({ id: `f${i}`, ratio: 0.3, formats: ['listicle'] })),
      ...Array.from({ length: 6 }, (_, i) => video({ id: `m${i}`, ratio: 4, formats: ['mechanism'], durationSeconds: 540 })),
      ...Array.from({ length: 3 }, (_, i) => video({ id: `n${i}`, ratio: 1, formats: ['mechanism'] })),
      video({ id: 'unscored', ratio: null, formats: ['listicle'] }),
    ]
    const scores = scoreFormats(videos)
    const listicle = scores.find((s) => s.format === 'listicle')!
    const mechanism = scores.find((s) => s.format === 'mechanism')!
    expect(listicle).toMatchObject({ videos: 9, wins: 3, flops: 6, validated: false, medianWinnerMinutes: 20 })
    expect(mechanism).toMatchObject({ videos: 9, wins: 6, flops: 0, validated: true, medianWinnerMinutes: 9 })
    expect(scores[0].format).toBe('mechanism')
  })
})

describe('explainApiError', () => {
  it('explains a key without the YouTube API enabled', () => {
    expect(explainApiError(403, '{"reason":"accessNotConfigured"}')).toMatch(/not enabled/)
    expect(explainApiError(403, '{"reason":"quotaExceeded"}')).toMatch(/quota/)
  })
})

/** Fake YouTube API: two seed results on two channels, each channel with five uploads. */
function fakeYoutube(): FetchLike & ReturnType<typeof vi.fn> {
  const vid = (id: string, channelId: string, views: number, title = id, duration = 'PT10M') => ({
    id,
    snippet: { title, channelId, channelTitle: channelId },
    statistics: { viewCount: String(views) },
    contentDetails: { duration },
  })
  const catalog = Object.fromEntries(
    [
      vid('hit', 'a', 50_000, 'Why you procrastinate'),
      vid('meh', 'b', 1_000, '5 ways to focus'),
      vid('shortie', 'b', 9_000_000, 'Short', 'PT30S'),
      ...[1, 2, 3, 4].map((i) => vid(`a${i}`, 'a', 5_000)),
      ...[1, 2, 3, 4].map((i) => vid(`b${i}`, 'b', 2_000)),
      vid('deep', 'a', 40_000, 'How to reset your life'),
    ].map((v) => [v.id, v]),
  )
  const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) })
  return vi.fn(async (url: string) => {
    const u = new URL(url)
    const endpoint = u.pathname.split('/').pop()
    if (endpoint === 'search') {
      const q = u.searchParams.get('q')
      const ids = q === 'procrastination' ? ['hit', 'meh', 'shortie'] : q === 'procrastination tips' ? ['deep'] : []
      return json({ items: u.searchParams.get('videoDuration') === 'medium' ? ids.map((videoId) => ({ id: { videoId } })) : [] })
    }
    if (endpoint === 'videos') return json({ items: u.searchParams.get('id')!.split(',').map((id) => catalog[id]).filter(Boolean) })
    if (endpoint === 'channels') {
      return json({
        items: u.searchParams.get('id')!.split(',').map((id) => ({ id, snippet: { title: id }, statistics: {}, contentDetails: { relatedPlaylists: { uploads: `UU${id}` } } })),
      })
    }
    if (endpoint === 'playlistItems') {
      const ch = u.searchParams.get('playlistId')!.slice(2)
      const ids = ch === 'a' ? ['hit', 'a1', 'a2', 'a3', 'a4'] : ['meh', 'b1', 'b2', 'b3', 'b4']
      return json({ items: ids.map((videoId) => ({ contentDetails: { videoId } })) })
    }
    return { ok: false, status: 404, json: async () => ({}), text: async () => '' }
  }) as unknown as FetchLike & ReturnType<typeof vi.fn>
}

describe('runResearch', () => {
  it('scores results against channel medians and follows autocomplete depth first', async () => {
    const fetchImpl = fakeYoutube()
    const client = new YoutubeClient({ apiKey: 'k', budget: new QuotaBudget(5000), fetchImpl })
    const suggest = vi.fn(async () => ['procrastination', 'procrastination tips'])
    const result = await runResearch(client, { keywords: ['procrastination'], expandPerKeyword: 2, suggest })

    expect(result.keywords).toEqual(['procrastination', 'procrastination tips'])
    expect(result.videos.find((v) => v.id === 'shortie')).toBeUndefined()
    const hit = result.videos.find((v) => v.id === 'hit')!
    expect(hit.ratio).toBe(10) // 50k against a median of 5k
    expect(hit.formats).toContain('why')
    expect(result.videos.find((v) => v.id === 'meh')!.ratio).toBe(0.5)
    expect(result.channels.map((c) => c.id).sort()).toEqual(['a', 'b'])
    expect(result.stoppedEarly).toBeNull()
    // 2 keywords x 2 searches x 100, plus 1-unit reads.
    expect(result.quotaUsed).toBeGreaterThanOrEqual(400)
    expect(renderReport(result, '2026-10-15')).toContain('Why you procrastinate')
  })

  it('stops cleanly and keeps findings when the budget runs out', async () => {
    const client = new YoutubeClient({ apiKey: 'k', budget: new QuotaBudget(250), fetchImpl: fakeYoutube() })
    const result = await runResearch(client, {
      keywords: ['procrastination', 'focus'],
      expandPerKeyword: 0,
    })
    expect(result.keywords).toEqual(['procrastination'])
    expect(result.stoppedEarly).toMatch(/Quota budget reached/)
    expect(result.videos.length).toBeGreaterThan(0)
  })
})
