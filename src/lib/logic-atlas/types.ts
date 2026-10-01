/**
 * Logic Atlas data contract.
 *
 * `scripts/sync-logic-atlas.ts` builds this shape from `docs/logic/**` and the
 * code anchors those files point at. The admin Logic Atlas page renders it.
 */

export const RULE_KINDS = ['gate', 'threshold', 'invariant', 'flow', 'limit', 'permission'] as const
export type RuleKind = (typeof RULE_KINDS)[number]

export const RULE_STATUSES = ['active', 'soft-launch', 'deprecated'] as const
export type RuleStatus = (typeof RULE_STATUSES)[number]

export const FLAG_LEVELS = ['gap', 'watch'] as const
export type FlagLevel = (typeof FLAG_LEVELS)[number]

export const FLOW_STEP_KINDS = ['start', 'check', 'action', 'outcome'] as const
export type FlowStepKind = (typeof FLOW_STEP_KINDS)[number]

export const FLOW_STEP_TONES = ['neutral', 'allow', 'block', 'warn'] as const
export type FlowStepTone = (typeof FLOW_STEP_TONES)[number]

export const DECISION_STATUSES = ['accepted', 'superseded'] as const
export type DecisionStatus = (typeof DECISION_STATUSES)[number]

/**
 * ok: the code matches the verified lock.
 * changed: the anchored declaration changed since it was last verified.
 * missing: the file or symbol no longer exists.
 * unverified: no lock entry yet.
 */
export type DriftState = 'ok' | 'changed' | 'missing' | 'unverified'

export interface AtlasPoint {
  x: number
  y: number
}

export interface AtlasBox extends AtlasPoint {
  width: number
  height: number
}

export interface AtlasAnchor {
  file: string
  symbol: string
  line: number | null
  /** Short source excerpt, such as the literal value of a constant. */
  value: string | null
  drift: DriftState
  url: string
}

export interface AtlasFlowStep {
  id: string
  label: string
  kind: FlowStepKind
  tone: FlowStepTone
  position: AtlasPoint
  width: number
  height: number
}

export interface AtlasFlowLink {
  id: string
  source: string
  target: string
  label: string | null
}

export interface AtlasFlow {
  steps: AtlasFlowStep[]
  links: AtlasFlowLink[]
  width: number
  height: number
}

export interface AtlasFlag {
  level: FlagLevel
  note: string
}

export interface AtlasRule {
  id: string
  domain: string
  title: string
  kind: RuleKind
  status: RuleStatus
  statement: string
  anchors: AtlasAnchor[]
  tests: { file: string; url: string }[]
  dependsOn: string[]
  /** Rules that depend on this one. */
  usedBy: string[]
  /** Decision ids, oldest first. */
  decisions: string[]
  flag: AtlasFlag | null
  flow: AtlasFlow | null
  /** Position relative to the domain box. */
  position: AtlasPoint
  drift: DriftState
}

export interface AtlasDomain {
  id: string
  title: string
  color: string
  summary: string
  overviewHtml: string
  box: AtlasBox
  ruleIds: string[]
}

export interface AtlasSource {
  kind: 'pr' | 'commit' | 'changelog' | 'doc'
  label: string
  url: string
}

export interface AtlasDecision {
  id: string
  date: string
  title: string
  summary: string
  domains: string[]
  rules: string[]
  status: DecisionStatus
  supersededBy: string | null
  sources: AtlasSource[]
  sections: { heading: string; html: string }[]
}

export interface AtlasEdge {
  id: string
  /** The rule being relied on. */
  source: string
  /** The rule that relies on it. */
  target: string
  crossDomain: boolean
}

export interface AtlasStats {
  domains: number
  rules: number
  decisions: number
  anchors: number
  drifted: number
  flagged: number
}

export interface LogicAtlas {
  version: 1
  syncedAt: string
  repoUrl: string
  stats: AtlasStats
  canvas: { width: number; height: number }
  domains: AtlasDomain[]
  rules: AtlasRule[]
  decisions: AtlasDecision[]
  edges: AtlasEdge[]
}

export const RULE_KIND_LABELS: Record<RuleKind, string> = {
  gate: 'Gate',
  threshold: 'Threshold',
  invariant: 'Invariant',
  flow: 'Flow',
  limit: 'Limit',
  permission: 'Permission',
}

export const RULE_KIND_HINTS: Record<RuleKind, string> = {
  gate: 'Lets something through or stops it',
  threshold: 'A number that decides an outcome',
  invariant: 'Must always hold',
  flow: 'A multi-step process',
  limit: 'A cap on size, rate, or count',
  permission: 'Who is allowed to do what',
}

export const RULE_STATUS_LABELS: Record<RuleStatus, string> = {
  active: 'Active',
  'soft-launch': 'Soft launch',
  deprecated: 'Deprecated',
}

export const DRIFT_LABELS: Record<DriftState, string> = {
  ok: 'Verified',
  changed: 'Code changed',
  missing: 'Anchor missing',
  unverified: 'Not verified',
}
