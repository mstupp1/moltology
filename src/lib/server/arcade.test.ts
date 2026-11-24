import { beforeEach, describe, expect, it, vi } from 'vitest'

const awardGems = vi.fn(async () => {})
vi.mock('./gems', () => ({ awardGems: (...args: unknown[]) => awardGems(...(args as [])) }))
vi.mock('../../db', () => ({ getDb: () => ({}) }))

import { settleArcadeWeek } from './arcade'

function dbWith(rows: { userId: string; score: number; finishedAt: string }[]) {
  return { execute: vi.fn(async () => ({ rows })) } as unknown as Parameters<typeof settleArcadeWeek>[0]
}

describe('arcade weekly prizes', () => {
  beforeEach(() => awardGems.mockClear())

  it('pays the top 10 with a score of 3 or more, once per key', async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      userId: `u${i}`,
      score: 40 - i * 3,
      finishedAt: `2026-11-1${i % 7}T10:00:00.000Z`,
    }))
    rows.push({ userId: 'low', score: 2, finishedAt: '2026-11-17T10:00:00.000Z' })
    await settleArcadeWeek(dbWith(rows), 'riptide', new Date('2026-11-16T00:00:00Z'))
    expect(awardGems).toHaveBeenCalledTimes(10)
    const first = awardGems.mock.calls[0] as unknown as [unknown, string, { amount: number; sourceKey: string; source: string }[]]
    expect(first[1]).toBe('u0')
    expect(first[2][0]).toMatchObject({ amount: 100, source: 'arcade', sourceKey: 'arcade:riptide:week:2026-11-16' })
    const paid = awardGems.mock.calls.map((c) => (c as unknown as [unknown, string])[1])
    expect(paid).not.toContain('low')
    expect(paid).not.toContain('u10')
  })

  it('breaks ties by who got there first', async () => {
    const rows = [
      { userId: 'late', score: 10, finishedAt: '2026-11-19T10:00:00.000Z' },
      { userId: 'early', score: 10, finishedAt: '2026-11-17T10:00:00.000Z' },
    ]
    await settleArcadeWeek(dbWith(rows), 'riptide', new Date('2026-11-09T00:00:00Z'))
    const order = awardGems.mock.calls.map((c) => (c as unknown as [unknown, string])[1])
    expect(order).toEqual(['early', 'late'])
  })

  it('skips players below the minimum score', async () => {
    await settleArcadeWeek(dbWith([{ userId: 'a', score: 1, finishedAt: '2026-11-03T10:00:00.000Z' }]), 'riptide', new Date('2026-11-02T00:00:00Z'))
    expect(awardGems).not.toHaveBeenCalled()
  })
})
