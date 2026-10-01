import type { AtlasDecision, AtlasRule, RuleKind } from './types'

export interface AtlasFilter {
  query: string
  domains: string[]
  kinds: RuleKind[]
  onlyAttention: boolean
}

export const EMPTY_FILTER: AtlasFilter = { query: '', domains: [], kinds: [], onlyAttention: false }

export function isFilterActive(filter: AtlasFilter): boolean {
  return (
    filter.query.trim().length > 0 ||
    filter.domains.length > 0 ||
    filter.kinds.length > 0 ||
    filter.onlyAttention
  )
}

function tokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function ruleHaystack(rule: AtlasRule): string {
  return [
    rule.id,
    rule.title,
    rule.statement,
    rule.flag?.note ?? '',
    ...rule.anchors.flatMap((anchor) => [anchor.file, anchor.symbol, anchor.value ?? '']),
  ]
    .join(' ')
    .toLowerCase()
}

/** A rule needs attention when it is flagged or its code drifted from the verified lock. */
export function needsAttention(rule: AtlasRule): boolean {
  return rule.flag !== null || rule.drift !== 'ok'
}

export function ruleMatches(rule: AtlasRule, filter: AtlasFilter): boolean {
  if (filter.domains.length > 0 && !filter.domains.includes(rule.domain)) return false
  if (filter.kinds.length > 0 && !filter.kinds.includes(rule.kind)) return false
  if (filter.onlyAttention && !needsAttention(rule)) return false
  const words = tokens(filter.query)
  if (words.length === 0) return true
  const haystack = ruleHaystack(rule)
  return words.every((word) => haystack.includes(word))
}

/** Matching rule ids, or null when no filter is active (everything shows). */
export function matchingRuleIds(rules: AtlasRule[], filter: AtlasFilter): Set<string> | null {
  if (!isFilterActive(filter)) return null
  return new Set(rules.filter((rule) => ruleMatches(rule, filter)).map((rule) => rule.id))
}

export function decisionMatches(decision: AtlasDecision, filter: AtlasFilter): boolean {
  if (filter.domains.length > 0 && !decision.domains.some((domain) => filter.domains.includes(domain))) {
    return false
  }
  const words = tokens(filter.query)
  if (words.length === 0) return true
  const haystack = [
    decision.id,
    decision.title,
    decision.summary,
    ...decision.rules,
    ...decision.sources.map((source) => source.label),
    ...decision.sections.map((section) => section.html.replace(/<[^>]+>/g, ' ')),
  ]
    .join(' ')
    .toLowerCase()
  return words.every((word) => haystack.includes(word))
}

export interface DecisionMonth {
  key: string
  label: string
  decisions: AtlasDecision[]
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Newest month first, newest decision first within a month. */
export function groupDecisionsByMonth(decisions: AtlasDecision[]): DecisionMonth[] {
  const groups = new Map<string, AtlasDecision[]>()
  for (const decision of decisions) {
    const key = decision.date.slice(0, 7)
    groups.set(key, [...(groups.get(key) ?? []), decision])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [year, month] = key.split('-')
      return {
        key,
        label: `${MONTHS[Number(month) - 1] ?? month} ${year}`,
        decisions: [...items].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)),
      }
    })
}

/** "Sep 23" style label, parsed without time zones so SSR and client agree. */
export function shortDate(iso: string): string {
  const [, month, day] = iso.split('-')
  const name = MONTHS[Number(month) - 1]?.slice(0, 3) ?? month
  return `${name} ${Number(day)}`
}
