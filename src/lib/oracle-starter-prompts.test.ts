import { describe, expect, it } from 'vitest'
import {
  STARTER_CHIP_COUNT,
  STARTER_PROMPTS,
  pickStarterChips,
  starterPageKind,
  starterPromptsByGroup,
  starterPromptVisible,
  type StarterContext,
} from './oracle-starter-prompts'

const base: StarterContext = { audience: 'member', memberDays: 60, today: '2026-11-16', seed: 'user-1' }

describe('starter prompt catalog', () => {
  it('has unique ids and short labels', () => {
    const ids = STARTER_PROMPTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of STARTER_PROMPTS) {
      expect(p.label.length).toBeLessThanOrEqual(40)
      expect(Boolean(p.group) !== Boolean(p.page)).toBe(true)
    }
  })
})

describe('pickStarterChips', () => {
  it('gives one chip per group for a member', () => {
    const chips = pickStarterChips(base)
    expect(chips).toHaveLength(STARTER_CHIP_COUNT)
    expect(chips.map((c) => c.group)).toEqual(['start', 'community', 'codex', 'focus'])
  })

  it('is stable for a day and can change the next day', () => {
    expect(pickStarterChips(base)).toEqual(pickStarterChips(base))
    const days = Array.from({ length: 14 }, (_, i) => pickStarterChips({ ...base, today: `2026-12-${String(i + 1).padStart(2, '0')}` }).map((c) => c.id).join())
    expect(new Set(days).size).toBeGreaterThan(1)
  })

  it('always shows "What is Moltology?" to guests and hides member-only prompts', () => {
    const chips = pickStarterChips({ ...base, audience: 'guest', memberDays: undefined })
    expect(chips[0].id).toBe('what-is-moltology')
    const all = starterPromptsByGroup({ ...base, audience: 'guest' }).flatMap((g) => g.prompts.map((p) => p.id))
    expect(all).not.toContain('earn-gems')
  })

  it('leads with the newcomer prompt and a second start prompt in the first week', () => {
    const chips = pickStarterChips({ ...base, memberDays: 2 })
    expect(chips[0].id).toBe('first-steps')
    expect(chips.filter((c) => c.group === 'start')).toHaveLength(2)
    expect(pickStarterChips(base).map((c) => c.id)).not.toContain('first-steps')
  })

  it('puts the page prompt first', () => {
    const chips = pickStarterChips({ ...base, page: 'forum-thread' })
    expect(chips[0].label).toBe('Summarize this thread')
    expect(chips).toHaveLength(STARTER_CHIP_COUNT)
  })

  it('hides prompts whose needs are not met, or outside their dates', () => {
    const academy = STARTER_PROMPTS.find((p) => p.id === 'academy-courses')!
    expect(starterPromptVisible(academy, base)).toBe(false)
    expect(starterPromptVisible(academy, { ...base, has: { 'academy-courses': true } })).toBe(true)
    const seasonal = { id: 'x', label: 'x', group: 'start' as const, from: '2026-12-01', until: '2026-12-31' }
    expect(starterPromptVisible(seasonal, base)).toBe(false)
    expect(starterPromptVisible(seasonal, { ...base, today: '2026-12-31' })).toBe(true)
  })
})

describe('starterPageKind', () => {
  it('reads the page kind from a path', () => {
    expect(starterPageKind('/forum/general/some-topic')).toBe('forum-thread')
    expect(starterPageKind('/forum/general')).toBe('forum-board')
    expect(starterPageKind('/forum/leaderboard')).toBe('forum')
    expect(starterPageKind('/news/a-story')).toBe('news-article')
    expect(starterPageKind('/codex/scr-010')).toBe('codex')
    expect(starterPageKind('/codex')).toBeNull()
    expect(starterPageKind('/dashboard')).toBeNull()
  })
})
