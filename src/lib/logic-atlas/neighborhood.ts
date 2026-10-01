import type { AtlasEdge, AtlasRule } from './types'

export interface RuleNeighborhood {
  ruleIds: Set<string>
  edgeIds: Set<string>
}

/** The selected rule plus every rule it depends on or that depends on it. */
export function ruleNeighborhood(rule: AtlasRule, edges: AtlasEdge[]): RuleNeighborhood {
  const ruleIds = new Set<string>([rule.id, ...rule.dependsOn, ...rule.usedBy])
  const edgeIds = new Set<string>()
  for (const edge of edges) {
    if (edge.source === rule.id || edge.target === rule.id) edgeIds.add(edge.id)
  }
  return { ruleIds, edgeIds }
}

/** Every rule reachable upstream (what this rule relies on), nearest first. */
export function upstreamChain(ruleId: string, rulesById: Map<string, AtlasRule>): string[] {
  const seen = new Set<string>([ruleId])
  const order: string[] = []
  let frontier = [ruleId]
  while (frontier.length > 0) {
    const next: string[] = []
    for (const id of frontier) {
      for (const dep of rulesById.get(id)?.dependsOn ?? []) {
        if (seen.has(dep)) continue
        seen.add(dep)
        order.push(dep)
        next.push(dep)
      }
    }
    frontier = next
  }
  return order
}
