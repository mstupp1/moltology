import { marked } from 'marked'
import type {
  AtlasAnchor,
  AtlasDecision,
  AtlasDomain,
  AtlasEdge,
  AtlasFlow,
  AtlasRule,
  AtlasSource,
  DriftState,
  LogicAtlas,
} from '../../../src/lib/logic-atlas/types'
import { anchorKey, resolveAnchor } from './anchors'
import { DOMAIN_PADDING, FLOW_STEP, layoutDomainRules, layoutFlow, packDomains } from './layout'
import type { DecisionInput, DomainInput, RuleInput } from './schema'

export interface AnchorReportRow {
  key: string
  ruleId: string
  file: string
  symbol: string
  drift: DriftState
  hash: string | null
}

export interface BuildInput {
  domains: DomainInput[]
  decisions: DecisionInput[]
  readFile: (file: string) => string | null
  lock: Record<string, string>
  repoUrl: string
  syncedAt: string
}

export interface BuildResult {
  atlas: LogicAtlas
  errors: string[]
  anchors: AnchorReportRow[]
}

const DRIFT_RANK: Record<DriftState, number> = { ok: 0, unverified: 1, changed: 2, missing: 3 }

function renderMarkdown(markdown: string): string {
  const trimmed = markdown.trim()
  if (!trimmed) return ''
  return (marked.parse(trimmed, { async: false, gfm: true }) as string).trim()
}

/** Split a decision body into its `## Heading` sections. */
export function splitSections(markdown: string): { heading: string; html: string }[] {
  const sections: { heading: string; body: string[] }[] = []
  for (const line of markdown.split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line)
    if (heading) {
      sections.push({ heading: heading[1].trim(), body: [] })
    } else if (sections.length > 0) {
      sections[sections.length - 1].body.push(line)
    } else if (line.trim()) {
      sections.push({ heading: 'Notes', body: [line] })
    }
  }
  return sections
    .map((section) => ({ heading: section.heading, html: renderMarkdown(section.body.join('\n')) }))
    .filter((section) => section.html.length > 0)
}

export function sourceLink(
  source: DecisionInput['sources'][number],
  repoUrl: string,
): AtlasSource {
  if ('pr' in source) {
    return { kind: 'pr', label: `PR #${source.pr}`, url: `${repoUrl}/pull/${source.pr}` }
  }
  if ('commit' in source) {
    return { kind: 'commit', label: source.commit.slice(0, 7), url: `${repoUrl}/commit/${source.commit}` }
  }
  if ('changelog' in source) {
    const name = source.changelog.endsWith('.md') ? source.changelog : `${source.changelog}.md`
    return {
      kind: 'changelog',
      label: `Changelog ${name.slice(0, 10)}`,
      url: `${repoUrl}/blob/main/content/changelogs/${name}`,
    }
  }
  const [path, hash] = source.doc.split('#')
  return {
    kind: 'doc',
    label: path.split('/').pop() ?? path,
    url: `${repoUrl}/blob/main/${path}${hash ? `#${hash}` : ''}`,
  }
}

function worstDrift(states: DriftState[]): DriftState {
  return states.reduce<DriftState>((worst, state) => (DRIFT_RANK[state] > DRIFT_RANK[worst] ? state : worst), 'ok')
}

function flowLinks(rule: RuleInput) {
  const links: { id: string; source: string; target: string; label: string | null }[] = []
  for (const step of rule.flow ?? []) {
    step.next.forEach((next, index) => {
      const target = typeof next === 'string' ? next : next.to
      const label = typeof next === 'string' ? null : (next.label ?? null)
      links.push({ id: `${step.id}-${index}-${target}`, source: step.id, target, label })
    })
  }
  return links
}

function validate(input: BuildInput): string[] {
  const errors: string[] = []
  const domainIds = new Set<string>()
  const ruleIds = new Set<string>()
  const decisionIds = new Set<string>()

  for (const domain of input.domains) {
    if (domainIds.has(domain.id)) errors.push(`${domain.file}: duplicate domain id "${domain.id}"`)
    domainIds.add(domain.id)
    for (const rule of domain.rules) {
      if (ruleIds.has(rule.id)) errors.push(`${domain.file}: duplicate rule id "${rule.id}"`)
      ruleIds.add(rule.id)
    }
  }

  for (const domain of input.domains) {
    for (const rule of domain.rules) {
      for (const dep of rule.dependsOn) {
        if (dep === rule.id) errors.push(`${domain.file}: rule "${rule.id}" depends on itself`)
        else if (!ruleIds.has(dep)) errors.push(`${domain.file}: rule "${rule.id}" depends on unknown rule "${dep}"`)
      }
      for (const test of rule.tests) {
        if (input.readFile(test) === null) errors.push(`${domain.file}: rule "${rule.id}" lists missing test "${test}"`)
      }
      if (rule.flow) {
        const stepIds = new Set<string>()
        for (const step of rule.flow) {
          if (stepIds.has(step.id)) errors.push(`${domain.file}: rule "${rule.id}" repeats flow step "${step.id}"`)
          stepIds.add(step.id)
        }
        for (const link of flowLinks(rule)) {
          if (!stepIds.has(link.target)) {
            errors.push(`${domain.file}: rule "${rule.id}" flow step "${link.source}" points at unknown step "${link.target}"`)
          }
        }
      }
    }
  }

  for (const decision of input.decisions) {
    if (decisionIds.has(decision.id)) errors.push(`${decision.file}: duplicate decision id "${decision.id}"`)
    decisionIds.add(decision.id)
  }
  for (const decision of input.decisions) {
    for (const domain of decision.domains) {
      if (!domainIds.has(domain)) errors.push(`${decision.file}: unknown domain "${domain}"`)
    }
    for (const rule of decision.rules) {
      if (!ruleIds.has(rule)) errors.push(`${decision.file}: unknown rule "${rule}"`)
    }
    if (decision.supersededBy && !decisionIds.has(decision.supersededBy)) {
      errors.push(`${decision.file}: supersededBy points at unknown decision "${decision.supersededBy}"`)
    }
    if (decision.status === 'superseded' && !decision.supersededBy) {
      errors.push(`${decision.file}: a superseded decision needs supersededBy`)
    }
  }
  return errors
}

export async function buildAtlas(input: BuildInput): Promise<BuildResult> {
  const errors = validate(input)
  const anchorRows: AnchorReportRow[] = []
  const fileCache = new Map<string, string | null>()
  const read = (file: string) => {
    if (!fileCache.has(file)) fileCache.set(file, input.readFile(file))
    return fileCache.get(file) ?? null
  }

  const domains = [...input.domains].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  const ruleToDomain = new Map<string, string>()
  for (const domain of domains) for (const rule of domain.rules) ruleToDomain.set(rule.id, domain.id)

  const decisions = [...input.decisions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const decisionsByRule = new Map<string, string[]>()
  for (const decision of decisions) {
    for (const ruleId of decision.rules) {
      decisionsByRule.set(ruleId, [...(decisionsByRule.get(ruleId) ?? []), decision.id])
    }
  }

  const edges: AtlasEdge[] = []
  const usedBy = new Map<string, string[]>()
  for (const domain of domains) {
    for (const rule of domain.rules) {
      for (const dep of rule.dependsOn) {
        if (!ruleToDomain.has(dep) || dep === rule.id) continue
        edges.push({
          id: `${dep}->${rule.id}`,
          source: dep,
          target: rule.id,
          crossDomain: ruleToDomain.get(dep) !== domain.id,
        })
        usedBy.set(dep, [...(usedBy.get(dep) ?? []), rule.id])
      }
    }
  }

  const rules: AtlasRule[] = []
  const domainBoxes: { id: string; width: number; height: number }[] = []
  const rulePositions = new Map<string, { x: number; y: number }>()

  for (const domain of domains) {
    const ids = domain.rules.map((rule) => rule.id)
    const internal = edges.filter((edge) => !edge.crossDomain && ruleToDomain.get(edge.target) === domain.id)
    const layout = await layoutDomainRules(ids, internal)
    for (const position of layout.positions) {
      rulePositions.set(position.id, {
        x: position.x + DOMAIN_PADDING.side,
        y: position.y + DOMAIN_PADDING.top,
      })
    }
    domainBoxes.push({
      id: domain.id,
      width: layout.width + DOMAIN_PADDING.side * 2,
      height: layout.height + DOMAIN_PADDING.top + DOMAIN_PADDING.bottom,
    })

    for (const rule of domain.rules) {
      const anchors: AtlasAnchor[] = rule.anchors.map((anchor) => {
        const key = anchorKey(rule.id, anchor.file, anchor.symbol)
        const text = read(anchor.file)
        const resolved = text === null ? null : resolveAnchor(anchor.file, text, anchor.symbol)
        let drift: DriftState
        if (!resolved) drift = 'missing'
        else if (!input.lock[key]) drift = 'unverified'
        else drift = input.lock[key] === resolved.hash ? 'ok' : 'changed'
        anchorRows.push({ key, ruleId: rule.id, file: anchor.file, symbol: anchor.symbol, drift, hash: resolved?.hash ?? null })
        return {
          file: anchor.file,
          symbol: anchor.symbol,
          line: resolved?.line ?? null,
          value: resolved?.value ?? null,
          drift,
          url: `${input.repoUrl}/blob/main/${anchor.file}${resolved ? `#L${resolved.line}` : ''}`,
        }
      })

      let flow: AtlasFlow | null = null
      if (rule.flow) {
        const links = flowLinks(rule).filter((link) => rule.flow!.some((step) => step.id === link.target))
        const layout = await layoutFlow(
          rule.flow.map((step) => step.id),
          links,
        )
        const byId = new Map(layout.positions.map((position) => [position.id, position]))
        flow = {
          steps: rule.flow.map((step) => ({
            id: step.id,
            label: step.label,
            kind: step.kind,
            tone: step.tone,
            position: { x: byId.get(step.id)?.x ?? 0, y: byId.get(step.id)?.y ?? 0 },
            width: FLOW_STEP.width,
            height: FLOW_STEP.height,
          })),
          links,
          width: layout.width,
          height: layout.height,
        }
      }

      rules.push({
        id: rule.id,
        domain: domain.id,
        title: rule.title,
        kind: rule.kind,
        status: rule.status,
        statement: rule.statement,
        anchors,
        tests: rule.tests.map((file) => ({ file, url: `${input.repoUrl}/blob/main/${file}` })),
        dependsOn: rule.dependsOn.filter((dep) => ruleToDomain.has(dep) && dep !== rule.id),
        usedBy: [],
        decisions: decisionsByRule.get(rule.id) ?? [],
        flag: rule.flag ?? null,
        flow,
        position: { x: 0, y: 0 },
        drift: worstDrift(anchors.map((anchor) => anchor.drift)),
      })
    }
  }

  for (const rule of rules) {
    rule.usedBy = usedBy.get(rule.id) ?? []
    rule.position = rulePositions.get(rule.id) ?? { x: 0, y: 0 }
  }

  const packed = packDomains(domainBoxes)
  const placement = new Map(packed.placements.map((p) => [p.id, p]))
  const atlasDomains: AtlasDomain[] = domains.map((domain) => {
    const box = domainBoxes.find((b) => b.id === domain.id)!
    const at = placement.get(domain.id)!
    return {
      id: domain.id,
      title: domain.title,
      color: domain.color,
      summary: domain.summary,
      overviewHtml: renderMarkdown(domain.overviewMarkdown),
      box: { x: at.x, y: at.y, width: box.width, height: box.height },
      ruleIds: domain.rules.map((rule) => rule.id),
    }
  })

  const atlasDecisions: AtlasDecision[] = decisions.map((decision) => ({
    id: decision.id,
    date: decision.date,
    title: decision.title,
    summary: decision.summary,
    domains: decision.domains,
    rules: decision.rules,
    status: decision.status,
    supersededBy: decision.supersededBy ?? null,
    sources: decision.sources.map((source) => sourceLink(source, input.repoUrl)),
    sections: splitSections(decision.bodyMarkdown),
  }))

  const atlas: LogicAtlas = {
    version: 1,
    syncedAt: input.syncedAt,
    repoUrl: input.repoUrl,
    stats: {
      domains: atlasDomains.length,
      rules: rules.length,
      decisions: atlasDecisions.length,
      anchors: anchorRows.length,
      drifted: anchorRows.filter((row) => row.drift !== 'ok').length,
      flagged: rules.filter((rule) => rule.flag).length,
    },
    canvas: { width: packed.width, height: packed.height },
    domains: atlasDomains,
    rules,
    decisions: atlasDecisions,
    edges,
  }

  return { atlas, errors, anchors: anchorRows }
}
