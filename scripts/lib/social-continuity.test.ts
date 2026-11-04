import { describe, expect, it } from 'vitest'
import { continuityFields, formatContinuityReport, summarizeContinuity } from './social-continuity'

describe('continuityFields', () => {
  it('reads top-level fields first and fills gaps from the creative brief', () => {
    expect(
      continuityFields({
        format: 'Tier list',
        loudness: 4,
        creativeBrief: { series: 'Shell Check', episode: 4, cast: ['crab_sentinel', ''], stopper: 'Eye contact', format: 'ignored' },
      })
    ).toEqual({ series: 'Shell Check', episode: 4, format: 'Tier list', cast: ['crab_sentinel'], stopper: 'Eye contact', loudness: 4 })
  })

  it('falls back to the mascot for cast and returns nothing for old drafts', () => {
    expect(continuityFields({ mascot: 'lobster_engineer' })).toEqual({ cast: ['lobster_engineer'] })
    expect(continuityFields({ mascot: 'none', title: 'x' })).toEqual({})
    expect(continuityFields(undefined)).toEqual({})
  })
})

describe('summarizeContinuity', () => {
  const posts = [
    { hookHeadline: 'Your tabs are open.', mascot: 'lobster_engineer', scheduledFor: '2026-10-08T17:00:00Z' },
    { type: 'carousel', series: 'Shell Check', episode: 3, cast: ['crab_sentinel'], scheduledFor: '2026-10-20T17:00:00Z', hookHeadline: 'Rate your inbox' },
    { hookHeadline: 'Your TABS are open!', mascot: 'lobster_engineer', scheduledFor: '2026-10-19T17:00:00Z' },
  ]
  const reels = [
    { series: 'Field Notes', episode: 2, cast: ['lobster_navigator'], scheduledFor: '2026-10-22T22:30:00Z', hookHeadline: 'Here we observe' },
    { series: 'Shell Check', episode: 2, scheduledFor: '2026-10-01T22:30:00Z' },
  ]

  it('finds the latest episode per series, cast counts and repeated hooks', () => {
    const report = summarizeContinuity(posts, reels)
    expect(report.recent[0].channel).toBe('reel')
    expect(report.recent[1].channel).toBe('carousel')
    expect(report.seriesLatest).toEqual([
      expect.objectContaining({ series: 'Field Notes', episode: 2 }),
      expect.objectContaining({ series: 'Shell Check', episode: 3, channel: 'carousel' }),
    ])
    expect(report.castCounts[0]).toEqual({ character: 'lobster_engineer', count: 2 })
    expect(report.repeatedHooks).toEqual([{ hook: 'Your TABS are open!', count: 2 }])
    expect(report.untracked).toBe(2)
    expect(formatContinuityReport(report)).toContain('Shell Check: 3 (carousel')
  })
})
