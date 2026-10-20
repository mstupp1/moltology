import { describe, it, expect } from 'vitest'
import { filterThreadsByQuery, groupThreadsByDate, threadDateGroup } from './thread-groups'

const now = new Date(2026, 9, 20, 15, 0, 0).getTime()
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).toISOString()

describe('threadDateGroup', () => {
  it('buckets by local calendar day', () => {
    expect(threadDateGroup({ updatedAt: at(2026, 9, 20, 0) }, now)).toBe('today')
    expect(threadDateGroup({ updatedAt: at(2026, 9, 19, 23) }, now)).toBe('yesterday')
    expect(threadDateGroup({ updatedAt: at(2026, 9, 15) }, now)).toBe('week')
    expect(threadDateGroup({ updatedAt: at(2026, 8, 1) }, now)).toBe('older')
  })

  it('falls back to createdAt and treats bad dates as older', () => {
    expect(threadDateGroup({ createdAt: at(2026, 9, 20) }, now)).toBe('today')
    expect(threadDateGroup({ updatedAt: 'not a date' }, now)).toBe('older')
  })
})

describe('groupThreadsByDate', () => {
  it('keeps input order inside each group and skips empty groups', () => {
    const threads = [
      { id: 'a', updatedAt: at(2026, 9, 20, 14) },
      { id: 'b', updatedAt: at(2026, 9, 20, 9) },
      { id: 'c', updatedAt: at(2026, 7, 2) },
    ]
    const groups = groupThreadsByDate(threads, now)
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Older'])
    expect(groups[0].threads.map((t) => t.id)).toEqual(['a', 'b'])
  })
})

describe('filterThreadsByQuery', () => {
  it('matches titles case-insensitively and returns all for a blank query', () => {
    const threads = [{ title: 'Shell hardening' }, { title: 'Depth focus' }, { title: null }]
    expect(filterThreadsByQuery(threads, '  ')).toHaveLength(3)
    expect(filterThreadsByQuery(threads, 'SHELL')).toEqual([{ title: 'Shell hardening' }])
  })
})
