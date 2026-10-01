export const ATLAS_TABS = ['map', 'timeline'] as const
export type AtlasTab = (typeof ATLAS_TABS)[number]

/** URL state for /admin/logic, so every rule and decision has a shareable link. */
export interface LogicAtlasSearch {
  tab?: AtlasTab
  rule?: string
  decision?: string
  domain?: string
  q?: string
}

const ID_PATTERN = /^[a-z0-9][a-z0-9.-]{0,79}$/

function readId(value: unknown): string | undefined {
  return typeof value === 'string' && ID_PATTERN.test(value) ? value : undefined
}

export function parseLogicAtlasSearch(search: Record<string, unknown>): LogicAtlasSearch {
  const tab = ATLAS_TABS.includes(search.tab as AtlasTab) ? (search.tab as AtlasTab) : undefined
  const q = typeof search.q === 'string' && search.q.trim() ? search.q.slice(0, 80) : undefined
  const result: LogicAtlasSearch = {}
  if (tab) result.tab = tab
  const rule = readId(search.rule)
  if (rule) result.rule = rule
  const decision = readId(search.decision)
  if (decision) result.decision = decision
  const domain = readId(search.domain)
  if (domain) result.domain = domain
  if (q) result.q = q
  return result
}
