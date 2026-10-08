import { describe, expect, it, vi } from 'vitest'
import {
  buildTrendsExploreUrl,
  classifyMomentum,
  fetchInterest,
  fetchRelatedQueries,
  parseRelatedQueries,
  readDataForSeoCredentials,
  summarizeGraph,
  validateKeywords,
} from './blog-trends'

const creds = { login: 'me', password: 'secret' }

function okResponse(items: unknown[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ tasks: [{ status_code: 20000, result: [{ items }] }] }),
  }
}

describe('validateKeywords', () => {
  it('trims, dedupes and strips commas', () => {
    expect(validateKeywords([' ai agents ', 'ai agents', 'robots, humanoid'])).toEqual(['ai agents', 'robots humanoid'])
  })

  it('rejects more than five keywords and empty input', () => {
    expect(() => validateKeywords(['a1', 'b2', 'c3', 'd4', 'e5', 'f6'])).toThrow(/at most 5/)
    expect(() => validateKeywords(['  '])).toThrow(/at least one/)
  })
})

describe('classifyMomentum', () => {
  it('labels a 20% swing either way', () => {
    expect(classifyMomentum(50, 60)).toBe('rising')
    expect(classifyMomentum(50, 40)).toBe('falling')
    expect(classifyMomentum(50, 55)).toBe('steady')
    expect(classifyMomentum(0, 0)).toBe('no data')
    expect(classifyMomentum(0, 10)).toBe('rising')
  })
})

describe('summarizeGraph', () => {
  it('averages per keyword, skips missing points, and sorts by recent interest', () => {
    const points = [
      { values: [10, 80] },
      { values: [10, 80] },
      { values: [null, 0], missing_data: true },
      { values: [20, 60] },
      { values: [60, 40] },
    ]
    const [first, second] = summarizeGraph(['agents', 'robots'], points)
    expect(first).toEqual({ keyword: 'agents', average: 25, recent: 60, momentum: 'rising' })
    expect(second).toEqual({ keyword: 'robots', average: 65, recent: 40, momentum: 'falling' })
  })
})

describe('parseRelatedQueries', () => {
  it('keeps query/value pairs and drops malformed rows', () => {
    const parsed = parseRelatedQueries('agents', {
      top: [{ query: 'ai agents', value: 100 }, { nope: true }],
      rising: [{ query: 'agent browser', value: '450' }],
    })
    expect(parsed.top).toEqual([{ query: 'ai agents', value: '100' }])
    expect(parsed.rising).toEqual([{ query: 'agent browser', value: '450' }])
    expect(parseRelatedQueries('x', null)).toEqual({ keyword: 'x', top: [], rising: [] })
  })
})

describe('readDataForSeoCredentials', () => {
  it('needs both login and password', () => {
    expect(readDataForSeoCredentials({ DATAFORSEO_LOGIN: 'a' } as NodeJS.ProcessEnv)).toBeNull()
    expect(
      readDataForSeoCredentials({ DATAFORSEO_LOGIN: 'a', DATAFORSEO_PASSWORD: 'b' } as NodeJS.ProcessEnv),
    ).toEqual({ login: 'a', password: 'b' })
  })
})

describe('buildTrendsExploreUrl', () => {
  it('builds a US compare link by default and drops geo for global', () => {
    const us = new URL(buildTrendsExploreUrl(['ai agents', 'robots']))
    expect(us.searchParams.get('q')).toBe('ai agents,robots')
    expect(us.searchParams.get('geo')).toBe('US')
    expect(us.searchParams.get('date')).toBe('today 3-m')
    expect(new URL(buildTrendsExploreUrl(['x'], 'global', 'past_12_months')).searchParams.has('geo')).toBe(false)
  })
})

describe('DataForSEO calls', () => {
  it('posts one graph task with basic auth and US location', async () => {
    const fetchImpl = vi.fn(async () =>
      okResponse([{ type: 'google_trends_graph', keywords: ['a1', 'b2'], data: [{ values: [10, 20] }] }]),
    )
    const result = await fetchInterest(creds, ['a1', 'b2'], { fetchImpl })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/google_trends/explore/live')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from('me:secret').toString('base64')}`,
    )
    const [task] = JSON.parse(init.body as string)
    expect(task).toMatchObject({ keywords: ['a1', 'b2'], location_code: 2840, item_types: ['google_trends_graph'] })
    expect(result.map((r) => r.keyword)).toEqual(['b2', 'a1'])
  })

  it('omits location for global and reads the queries list', async () => {
    const fetchImpl = vi.fn(async () =>
      okResponse([{ type: 'google_trends_queries_list', data: { top: [{ query: 'q', value: 100 }], rising: [] } }]),
    )
    const result = await fetchRelatedQueries(creds, 'a1', { geo: 'global', fetchImpl })
    const [task] = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(task).not.toHaveProperty('location_code')
    expect(result.top).toEqual([{ query: 'q', value: '100' }])
  })

  it('surfaces HTTP and task errors in plain language', async () => {
    await expect(
      fetchInterest(creds, ['a1'], { fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({}) }) }),
    ).rejects.toThrow(/HTTP 401/)
    await expect(
      fetchInterest(creds, ['a1'], {
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          json: async () => ({ tasks: [{ status_code: 40200, status_message: 'Payment Required.' }] }),
        }),
      }),
    ).rejects.toThrow(/Payment Required/)
  })
})
