import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTER,
  decisionMatches,
  groupDecisionsByMonth,
  isFilterActive,
  matchingRuleIds,
  needsAttention,
  shortDate,
} from './filter'
import { ruleNeighborhood, upstreamChain } from './neighborhood'
import { parseLogicAtlasSearch } from './search'
import type { AtlasDecision, AtlasEdge, AtlasRule } from './types'

function rule(overrides: Partial<AtlasRule> & { id: string }): AtlasRule {
  return {
    domain: 'forum',
    title: overrides.id,
    kind: 'gate',
    status: 'active',
    statement: 'A statement about the rule.',
    anchors: [],
    tests: [],
    dependsOn: [],
    usedBy: [],
    decisions: [],
    flag: null,
    flow: null,
    position: { x: 0, y: 0 },
    drift: 'ok',
    ...overrides,
  }
}

function decision(overrides: Partial<AtlasDecision> & { id: string; date: string }): AtlasDecision {
  return {
    title: overrides.id,
    summary: 'Summary',
    domains: ['forum'],
    rules: [],
    status: 'accepted',
    supersededBy: null,
    sources: [],
    sections: [],
    ...overrides,
  }
}

const rules = [
  rule({
    id: 'forum.rate-limit',
    kind: 'limit',
    title: 'Ten writes per minute',
    anchors: [
      {
        file: 'src/lib/community-rules.ts',
        symbol: 'FORUM_WRITE_RATE_LIMIT',
        line: 70,
        value: '10',
        drift: 'ok',
        url: '',
      },
    ],
  }),
  rule({ id: 'signup.honeypot', domain: 'signup', title: 'Honeypot rejects bots', drift: 'changed' }),
  rule({ id: 'premium.no-charge-toggle', domain: 'premium', kind: 'permission', flag: { level: 'gap', note: 'Not staff-gated yet.' } }),
]

describe('rule filters', () => {
  it('shows everything when no filter is active', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false)
    expect(matchingRuleIds(rules, EMPTY_FILTER)).toBeNull()
  })

  it('matches every search word across titles, symbols, and values', () => {
    expect(matchingRuleIds(rules, { ...EMPTY_FILTER, query: 'forum_write_rate' })).toEqual(new Set(['forum.rate-limit']))
    expect(matchingRuleIds(rules, { ...EMPTY_FILTER, query: 'ten minute' })).toEqual(new Set(['forum.rate-limit']))
    expect(matchingRuleIds(rules, { ...EMPTY_FILTER, query: 'ten honeypot' })).toEqual(new Set())
  })

  it('filters by domain, kind, and attention', () => {
    expect(matchingRuleIds(rules, { ...EMPTY_FILTER, domains: ['signup'] })).toEqual(new Set(['signup.honeypot']))
    expect(matchingRuleIds(rules, { ...EMPTY_FILTER, kinds: ['permission'] })).toEqual(
      new Set(['premium.no-charge-toggle']),
    )
    expect(matchingRuleIds(rules, { ...EMPTY_FILTER, onlyAttention: true })).toEqual(
      new Set(['signup.honeypot', 'premium.no-charge-toggle']),
    )
  })

  it('treats flagged or drifted rules as needing attention', () => {
    expect(rules.map(needsAttention)).toEqual([false, true, true])
  })
})

describe('decision helpers', () => {
  const decisions = [
    decision({ id: 'a', date: '2026-08-25', title: 'Lock the economy', domains: ['economy'] }),
    decision({ id: 'b', date: '2026-09-23', title: 'Screen signups', domains: ['signup'], rules: ['signup.honeypot'] }),
    decision({ id: 'c', date: '2026-09-06', title: 'Soft flags' }),
  ]

  it('groups newest month first and newest decision first', () => {
    const months = groupDecisionsByMonth(decisions)
    expect(months.map((month) => month.label)).toEqual(['September 2026', 'August 2026'])
    expect(months[0].decisions.map((item) => item.id)).toEqual(['b', 'c'])
  })

  it('matches decisions by domain and by linked rule ids', () => {
    expect(decisions.filter((item) => decisionMatches(item, { ...EMPTY_FILTER, domains: ['signup'] })).map((item) => item.id)).toEqual(['b'])
    expect(decisions.filter((item) => decisionMatches(item, { ...EMPTY_FILTER, query: 'honeypot' })).map((item) => item.id)).toEqual(['b'])
  })

  it('formats short dates without time zone shifts', () => {
    expect(shortDate('2026-09-01')).toBe('Sep 1')
    expect(shortDate('2026-12-31')).toBe('Dec 31')
  })
})

describe('neighborhood', () => {
  const graph = [
    rule({ id: 'a', usedBy: ['b'] }),
    rule({ id: 'b', dependsOn: ['a'], usedBy: ['c'] }),
    rule({ id: 'c', dependsOn: ['b'] }),
  ]
  const edges: AtlasEdge[] = [
    { id: 'a->b', source: 'a', target: 'b', crossDomain: false },
    { id: 'b->c', source: 'b', target: 'c', crossDomain: true },
  ]

  it('includes direct dependencies and dependents', () => {
    const hood = ruleNeighborhood(graph[1], edges)
    expect(hood.ruleIds).toEqual(new Set(['a', 'b', 'c']))
    expect(hood.edgeIds).toEqual(new Set(['a->b', 'b->c']))
  })

  it('walks the upstream chain nearest first', () => {
    const byId = new Map(graph.map((item) => [item.id, item]))
    expect(upstreamChain('c', byId)).toEqual(['b', 'a'])
  })
})

describe('search params', () => {
  it('drops unknown tabs and unsafe ids', () => {
    expect(parseLogicAtlasSearch({ tab: 'map', domain: 'signup', decision: 'Bad Id' })).toEqual({
      tab: 'map',
      domain: 'signup',
    })
    expect(parseLogicAtlasSearch({ q: '   ' })).toEqual({})
  })
})
